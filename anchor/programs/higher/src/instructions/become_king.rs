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
        seeds = [b"game_state"],
        bump = game_state.bump,
    )]
    pub game_state: Account<'info, GameState>,

    /// The vault PDA receiving SOL
    #[account(
        mut,
        seeds = [b"vault"],
        bump = game_state.vault_bump,
    )]
    pub vault: SystemAccount<'info>,

    pub system_program: Program<'info, System>,
}

/// Pay SOL to become the new King of the Hill.
///
/// Requirements:
/// - Game must be active
/// - Timer must not have expired
/// - User must pay exactly `current_price`
///
/// Effects:
/// - SOL transferred to vault PDA
/// - Caller recorded as new king
/// - Price increases by 20%
/// - Timer reset logic with anti-sniping
pub fn become_king(ctx: Context<BecomeKing>) -> Result<()> {
    let clock = Clock::get()?;
    let game = &mut ctx.accounts.game_state;

    // Ensure game is active
    require!(game.game_active, HigherError::GameNotActive);

    // Ensure the timer has not expired
    require!(clock.unix_timestamp < game.end_time, HigherError::GameOver);

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

    // Increase price by 20%
    game.current_price = price
        .checked_mul(10_000 + PRICE_INCREASE_BPS)
        .ok_or(HigherError::Overflow)?
        .checked_div(10_000)
        .ok_or(HigherError::Overflow)?;

    // Anti-sniping timer logic
    let time_remaining = game.end_time - clock.unix_timestamp;
    if time_remaining < ANTI_SNIPE_THRESHOLD {
        // Less than threshold remaining → extend by anti-snipe extension
        game.end_time = clock.unix_timestamp + ANTI_SNIPE_EXTENSION;
    } else {
        // Otherwise reset to initial duration from now
        game.end_time = clock.unix_timestamp + INITIAL_DURATION;
    }

    msg!("New King: {}", ctx.accounts.player.key());
    msg!("Pot: {} lamports", game.pot_amount);
    msg!("Next price: {} lamports", game.current_price);
    msg!("End time: {}", game.end_time);

    Ok(())
}
