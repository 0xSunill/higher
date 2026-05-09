use anchor_lang::prelude::*;

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
