use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};

#[cfg(test)]
mod tests;

declare_id!("hiHQCBK7yUu6KNp5sN9yNrrKFcirokX1act8B1HnTH7");

// ── Constants ────────────────────────────────────────────────────────────────

/// Starting price to become king: 0.01 SOL
const STARTING_PRICE: u64 = 10_000_000; // 0.01 SOL in lamports

/// Price increase percentage per new king (20%)
const PRICE_INCREASE_BPS: u64 = 2000; // 20% = 2000 basis points

/// Initial game duration: 2 minutes (for testing)
const INITIAL_DURATION: i64 = 120;

/// Anti-sniping threshold: 1 minute (for testing)
const ANTI_SNIPE_THRESHOLD: i64 = 60;

/// Anti-sniping extension: 1 minute (for testing)
const ANTI_SNIPE_EXTENSION: i64 = 60;

// ── Program ──────────────────────────────────────────────────────────────────

#[program]
pub mod higher {
    use super::*;

    /// Initialize a new King of the Hill game.
    /// Sets starting price, initial 1-hour timer, and creates the vault.
    pub fn initialize_game(ctx: Context<InitializeGame>) -> Result<()> {
        let clock = Clock::get()?;
        let game = &mut ctx.accounts.game_state;

        game.authority = ctx.accounts.authority.key();
        game.current_king = Pubkey::default(); // No king yet
        game.current_price = STARTING_PRICE;
        game.pot_amount = 0;
        game.end_time = clock.unix_timestamp + INITIAL_DURATION;
        game.game_active = true;
        game.bump = ctx.bumps.game_state;
        game.vault_bump = ctx.bumps.vault;

        msg!("Game initialized! First price: {} lamports", STARTING_PRICE);
        msg!("Game ends at timestamp: {}", game.end_time);

        Ok(())
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
            // Less than 10 minutes remaining → set to exactly 10 minutes from now
            game.end_time = clock.unix_timestamp + ANTI_SNIPE_EXTENSION;
        } else {
            // Otherwise reset to 1 hour from now
            game.end_time = clock.unix_timestamp + INITIAL_DURATION;
        }

        msg!("New King: {}", ctx.accounts.player.key());
        msg!("Pot: {} lamports", game.pot_amount);
        msg!("Next price: {} lamports", game.current_price);
        msg!("End time: {}", game.end_time);

        Ok(())
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
}

// ── Account Structs ──────────────────────────────────────────────────────────

#[derive(Accounts)]
pub struct InitializeGame<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = 8 + GameState::INIT_SPACE,
        seeds = [b"game_state"],
        bump,
    )]
    pub game_state: Account<'info, GameState>,

    /// The vault PDA that holds the pot SOL
    #[account(
        mut,
        seeds = [b"vault"],
        bump,
    )]
    pub vault: SystemAccount<'info>,

    pub system_program: Program<'info, System>,
}

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

// ── State ────────────────────────────────────────────────────────────────────

#[account]
#[derive(InitSpace)]
pub struct GameState {
    /// Authority who initialized the game
    pub authority: Pubkey, // 32
    /// Current king's public key (default = no king)
    pub current_king: Pubkey, // 32
    /// Current price to become king (in lamports)
    pub current_price: u64, // 8
    /// Total SOL in the pot (in lamports)
    pub pot_amount: u64, // 8
    /// Unix timestamp when the game ends
    pub end_time: i64, // 8
    /// Whether the game is currently active
    pub game_active: bool, // 1
    /// Bump seed for game_state PDA
    pub bump: u8, // 1
    /// Bump seed for vault PDA
    pub vault_bump: u8, // 1
}

// ── Errors ───────────────────────────────────────────────────────────────────

#[error_code]
pub enum HigherError {
    #[msg("The game timer has expired")]
    GameOver,
    #[msg("The game timer has not expired yet")]
    GameNotOver,
    #[msg("Only the current king can claim the prize")]
    NotKing,
    #[msg("The game is not currently active")]
    GameNotActive,
    #[msg("Arithmetic overflow")]
    Overflow,
}
