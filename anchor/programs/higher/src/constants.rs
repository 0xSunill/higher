/// Starting price to become king: 0.01 SOL
pub const STARTING_PRICE: u64 = 10_000_000; // 0.01 SOL in lamports

/// Price increase percentage per new king (20%)
pub const PRICE_INCREASE_BPS: u64 = 2000; // 20% = 2000 basis points

/// Initial game duration: 2 minutes (for testing)
pub const INITIAL_DURATION: i64 = 120;

/// Anti-sniping threshold: 1 minute (for testing)
pub const ANTI_SNIPE_THRESHOLD: i64 = 60;

/// Anti-sniping extension: 1 minute (for testing)
pub const ANTI_SNIPE_EXTENSION: i64 = 60;
