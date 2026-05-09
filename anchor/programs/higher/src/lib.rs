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

    /// Initialize a new King of the Hill game.
    pub fn initialize_game(ctx: Context<InitializeGame>) -> Result<()> {
        instructions::initialize_game::initialize_game(ctx)
    }

    /// Pay SOL to become the new King of the Hill.
    pub fn become_king(ctx: Context<BecomeKing>) -> Result<()> {
        instructions::become_king::become_king(ctx)
    }

    /// Claim the prize pot after the timer expires.
    pub fn claim_prize(ctx: Context<ClaimPrize>) -> Result<()> {
        instructions::claim_prize::claim_prize(ctx)
    }
}
