use anchor_lang::prelude::*;

use crate::state::GameState;

#[derive(Accounts)]
pub struct CloseGame<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"game_state_v2"],
        bump = game_state.bump,
        close = authority,
        constraint = game_state.authority == authority.key(),
    )]
    pub game_state: Account<'info, GameState>,

    pub system_program: Program<'info, System>,
}

/// Close the game state account and reclaim rent.
/// Only the original authority can close the game.
pub fn close_game(_ctx: Context<CloseGame>) -> Result<()> {
    msg!("Game state account closed. You can now re-initialize.");
    Ok(())
}
