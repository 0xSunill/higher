use anchor_lang::prelude::*;

#[cfg(test)]
mod tests;

pub mod constants;
pub mod errors;
pub mod instructions;
pub mod state;

use instructions::*;

declare_id!("hiHQCBK7yUu6KNp5sN9yNrrKFcirokX1act8B1HnTH7");

#[program]
pub mod higher {
    use super::*;

   
    pub fn initialize_game(ctx: Context<InitializeGame>) -> Result<()> {
        instructions::initialize_game::initialize_game(ctx)
    }

  
    pub fn become_king(ctx: Context<BecomeKing>, multiplier_bps: u64) -> Result<()> {
        instructions::become_king::become_king(ctx, multiplier_bps)
    }

    pub fn claim_prize(ctx: Context<ClaimPrize>) -> Result<()> {
        instructions::claim_prize::claim_prize(ctx)
    }

    pub fn close_game(ctx: Context<CloseGame>) -> Result<()> {
        instructions::close_game::close_game(ctx)
    }
}
