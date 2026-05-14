use anchor_lang::prelude::*;

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
    #[msg("Multiplier must be between 1.25x and 3x")]
    InvalidMultiplier,
}
