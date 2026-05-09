use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};

use crate::constants::*;
use crate::errors::HigherError;
use crate::state::GameState;

#[derive(Accounts)]
pub struct ClaimPrize<'info> {
    #[account(mut)]
    pub king: Signer<'info>,

    #[account(
        mut,
        seeds = [b"game_state"],
        bump = game_state.bump,
    )]
    pub game_state: Account<'info, GameState>,

    /// The vault PDA holding the pot
    #[account(
        mut,
        seeds = [b"vault"],
        bump = game_state.vault_bump,
    )]
    pub vault: SystemAccount<'info>,

    pub system_program: Program<'info, System>,
}

/// Claim the prize pot. Only callable by the current king after the timer expires.
/// Resets the game for a new round.
pub fn claim_prize(ctx: Context<ClaimPrize>) -> Result<()> {
    let clock = Clock::get()?;
    let game = &mut ctx.accounts.game_state;

    // Ensure game is active
    require!(game.game_active, HigherError::GameNotActive);

    // Only the current king can claim
    require!(
        ctx.accounts.king.key() == game.current_king,
        HigherError::NotKing
    );

    // Timer must have expired
    require!(
        clock.unix_timestamp >= game.end_time,
        HigherError::GameNotOver
    );

    let prize = ctx.accounts.vault.lamports();

    // Transfer all vault lamports to king using PDA signer seeds
    let signer_seeds: &[&[&[u8]]] = &[&[b"vault", &[game.vault_bump]]];

    transfer(
        CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            Transfer {
                from: ctx.accounts.vault.to_account_info(),
                to: ctx.accounts.king.to_account_info(),
            },
            signer_seeds,
        ),
        prize,
    )?;

    // Reset game state for the next round
    game.current_king = Pubkey::default();
    game.current_price = STARTING_PRICE;
    game.pot_amount = 0;
    game.end_time = clock.unix_timestamp + INITIAL_DURATION;
    // game_active remains true – new round starts automatically

    msg!("Prize of {} lamports claimed!", prize);
    msg!("New round started!");

    Ok(())
}
