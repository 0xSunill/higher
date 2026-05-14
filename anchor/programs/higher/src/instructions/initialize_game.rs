use anchor_lang::prelude::*;

use crate::constants::*;
use crate::state::GameState;

#[derive(Accounts)]
pub struct InitializeGame<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = 8 + GameState::INIT_SPACE,
        seeds = [b"game_state_v2"],
        bump,
    )]
    pub game_state: Account<'info, GameState>,

    /// The vault PDA that holds the pot SOL
    #[account(
        mut,
        seeds = [b"vault_v2"],
        bump,
    )]
    pub vault: SystemAccount<'info>,

    pub system_program: Program<'info, System>,
}

/// Initialize a new King of the Hill game.
/// Sets starting price and creates the vault.
/// Timer does NOT start until the first player becomes king.
pub fn initialize_game(ctx: Context<InitializeGame>) -> Result<()> {
    let game = &mut ctx.accounts.game_state;

    game.authority = ctx.accounts.authority.key();
    game.current_king = Pubkey::default(); // No king yet
    game.current_price = STARTING_PRICE;
    game.pot_amount = 0;
    game.end_time = 0; // Timer not started — starts on first become_king
    game.game_active = true;
    game.bump = ctx.bumps.game_state;
    game.vault_bump = ctx.bumps.vault;
    game.recent_winners = Default::default(); // Initialize empty array
    game.round_number = 0;

    msg!("Game initialized! First price: {} lamports", STARTING_PRICE);
    msg!("Timer will start when the first King is crowned.");

    Ok(())
}
