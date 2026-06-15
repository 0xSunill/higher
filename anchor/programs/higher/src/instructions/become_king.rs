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

    #[account(
        mut,
        seeds = [b"vault_v2"],
        bump = game_state.vault_bump,
    )]
    pub vault: SystemAccount<'info>,

    pub system_program: Program<'info, System>,
}


pub fn become_king(ctx: Context<BecomeKing>, multiplier_bps: u64) -> Result<()> {
    let clock = Clock::get()?;
    let game = &mut ctx.accounts.game_state;

    require!(game.game_active, HigherError::GameNotActive);

    require!(
        multiplier_bps >= MIN_MULTIPLIER_BPS && multiplier_bps <= MAX_MULTIPLIER_BPS,
        HigherError::InvalidMultiplier
    );

    let is_expired = game.end_time > 0 && clock.unix_timestamp >= game.end_time;

    if is_expired {
        return err!(HigherError::GameOver);
    }

    let is_first_king = game.current_king == Pubkey::default();


    if !is_first_king {
        require!(clock.unix_timestamp < game.end_time, HigherError::GameOver);
    }

    let price = if is_first_king {
        game.current_price
    } else {
        game.current_price
            .checked_mul(multiplier_bps)
            .ok_or(HigherError::Overflow)?
            .checked_div(10_000)
            .ok_or(HigherError::Overflow)?
    };

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

    game.current_king = ctx.accounts.player.key();
    game.pot_amount = game
        .pot_amount
        .checked_add(price)
        .ok_or(HigherError::Overflow)?;

    game.current_price = price;

    if is_first_king {
   //first time king time
        game.end_time = clock.unix_timestamp + INITIAL_DURATION;
    } else {
        //antisnipe
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
