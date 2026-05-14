/// Starting price to become king: 0.01 SOL
pub const STARTING_PRICE: u64 = 10_000_000; // 0.01 SOL in lamports

/// Minimum multiplier: 1.25x (12500 basis points)
pub const MIN_MULTIPLIER_BPS: u64 = 12500;

/// Maximum multiplier: 3x (30000 basis points)
pub const MAX_MULTIPLIER_BPS: u64 = 30000;

/// Initial game duration: 2 minutes (for testing)
pub const INITIAL_DURATION: i64 = 120;

/// Anti-sniping threshold: 1 minute (for testing)
pub const ANTI_SNIPE_THRESHOLD: i64 = 60;

/// Anti-sniping extension: 1 minute (for testing)
pub const ANTI_SNIPE_EXTENSION: i64 = 60;
