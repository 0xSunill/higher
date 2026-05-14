use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};

use crate::constants::*;
use crate::errors::HigherError;
use crate::state::GameState;

#[derive(Accounts)]
pub struct BecomeKing<'info> {
    #[account(mut)]
    pub player: Signer<'info>,

    #[account(
        mut,
        seeds = [b"game_state_v2"],
        bump = game_state.bump,
    )]
    pub game_state: Account<'info, GameState>,

    /// The vault PDA receiving SOL
    #[account(
        mut,
        seeds = [b"vault_v2"],
        bump = game_state.vault_bump,
    )]
    pub vault: SystemAccount<'info>,

    pub system_program: Program<'info, System>,
}

/// Pay SOL to become the new King of the Hill.
///
/// Handles three scenarios:
/// 1. First king (no current king) — starts the timer
/// 2. Normal play (timer running) — dethrone current king
/// 3. Expired game (timer ran out, unclaimed) — auto-reset and start new round
///
/// The `multiplier_bps` must be between MIN_MULTIPLIER_BPS and MAX_MULTIPLIER_BPS.
pub fn become_king(ctx: Context<BecomeKing>, multiplier_bps: u64) -> Result<()> {
    let clock = Clock::get()?;
    let game = &mut ctx.accounts.game_state;

    // Ensure game is active
    require!(game.game_active, HigherError::GameNotActive);

    // Validate multiplier is within bounds
    require!(
        multiplier_bps >= MIN_MULTIPLIER_BPS && multiplier_bps <= MAX_MULTIPLIER_BPS,
        HigherError::InvalidMultiplier
    );

    // Check if the game has expired (timer started and ran out)
    let is_expired = game.end_time > 0 && clock.unix_timestamp >= game.end_time;

    if is_expired {
        return err!(HigherError::GameOver);
    }

    // After potential reset, determine if this is the first king of the round
    let is_first_king = game.current_king == Pubkey::default();

    // If not the first king, timer must still be running
    if !is_first_king {
        require!(clock.unix_timestamp < game.end_time, HigherError::GameOver);
    }

    let price = game.current_price;

    // Transfer SOL from player to vault
    transfer(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            Transfer {
                from: ctx.accounts.player.to_account_info(),
                to: ctx.accounts.vault.to_account_info(),
            },
        ),
        price,
    )?;

    // Update game state
    game.current_king = ctx.accounts.player.key();
    game.pot_amount = game
        .pot_amount
        .checked_add(price)
        .ok_or(HigherError::Overflow)?;

    // Increase price by the chosen multiplier
    // new_price = price * multiplier_bps / 10000
    game.current_price = price
        .checked_mul(multiplier_bps)
        .ok_or(HigherError::Overflow)?
        .checked_div(10_000)
        .ok_or(HigherError::Overflow)?;

    if is_first_king {
        // First king — start the timer
        game.end_time = clock.unix_timestamp + INITIAL_DURATION;
    } else {
        // Anti-sniping timer logic
        let time_remaining = game.end_time - clock.unix_timestamp;
        if time_remaining < ANTI_SNIPE_THRESHOLD {
            // Less than threshold remaining → extend by anti-snipe extension
            game.end_time = clock.unix_timestamp + ANTI_SNIPE_EXTENSION;
        } else {
            // Otherwise reset to initial duration from now
            game.end_time = clock.unix_timestamp + INITIAL_DURATION;
        }
    }

    msg!("New King: {}", ctx.accounts.player.key());
    msg!("Pot: {} lamports", game.pot_amount);
    msg!("Next price: {} lamports", game.current_price);
    msg!("End time: {}", game.end_time);

    Ok(())
}
