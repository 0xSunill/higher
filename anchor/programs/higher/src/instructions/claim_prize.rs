use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};

use crate::constants::*;
use crate::errors::HigherError;
use crate::state::GameState;

#[derive(Accounts)]
pub struct ClaimPrize<'info> {
    #[account(mut)]
    pub king: SystemAccount<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

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


pub fn claim_prize(ctx: Context<ClaimPrize>) -> Result<()> {
    let clock = Clock::get()?;
    let game = &mut ctx.accounts.game_state;


    require!(game.game_active, HigherError::GameNotActive);

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
    let signer_seeds: &[&[&[u8]]] = &[&[b"vault_v2", &[game.vault_bump]]];

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

    // Record this round's winner
    for i in (1..5).rev() {
        game.recent_winners[i] = game.recent_winners[i - 1];
    }
    game.recent_winners[0] = crate::state::WinnerRecord {
        address: game.current_king,
        prize,
        round_number: game.round_number,
    };

    game.round_number = game
        .round_number
        .checked_add(1)
        .ok_or(HigherError::Overflow)?;

    // Reset game state for the next round
    game.current_king = Pubkey::default();
    game.current_price = STARTING_PRICE;
    game.pot_amount = 0;
    game.end_time = 0; // Timer not started — starts on next become_king
    // game_active remains true – new round starts automatically

    msg!("Prize of {} lamports claimed!", prize);
    msg!("New round started!");

    Ok(())
}
