#[cfg(test)]
mod tests {
    use crate::ID as PROGRAM_ID;
    use litesvm::LiteSVM;
    use solana_sdk::{
        instruction::{AccountMeta, Instruction},
        pubkey::Pubkey,
        signature::Keypair,
        signer::Signer,
        system_program,
        transaction::Transaction,
    };

    const LAMPORTS_PER_SOL: u64 = 1_000_000_000;
    const STARTING_PRICE: u64 = 10_000_000; // 0.01 SOL

    fn get_game_state_pda() -> (Pubkey, u8) {
        Pubkey::find_program_address(&[b"game_state"], &PROGRAM_ID)
    }

    fn get_vault_pda() -> (Pubkey, u8) {
        Pubkey::find_program_address(&[b"vault"], &PROGRAM_ID)
    }

    // Pre-computed Anchor discriminators: sha256("global:<name>")[0..8]
    const DISC_INITIALIZE_GAME: [u8; 8] = [44, 62, 102, 247, 126, 208, 130, 215];
    const DISC_BECOME_KING: [u8; 8] = [115, 206, 166, 150, 156, 183, 194, 51];
    const DISC_CLAIM_PRIZE: [u8; 8] = [157, 233, 139, 121, 246, 62, 234, 235];

    fn create_initialize_ix(authority: &Pubkey) -> Instruction {
        let (game_state_pda, _) = get_game_state_pda();
        let (vault_pda, _) = get_vault_pda();

        Instruction {
            program_id: PROGRAM_ID,
            accounts: vec![
                AccountMeta::new(*authority, true),
                AccountMeta::new(game_state_pda, false),
                AccountMeta::new(vault_pda, false),
                AccountMeta::new_readonly(system_program::ID, false),
            ],
            data: DISC_INITIALIZE_GAME.to_vec(),
        }
    }

    fn create_become_king_ix(player: &Pubkey) -> Instruction {
        let (game_state_pda, _) = get_game_state_pda();
        let (vault_pda, _) = get_vault_pda();

        Instruction {
            program_id: PROGRAM_ID,
            accounts: vec![
                AccountMeta::new(*player, true),
                AccountMeta::new(game_state_pda, false),
                AccountMeta::new(vault_pda, false),
                AccountMeta::new_readonly(system_program::ID, false),
            ],
            data: DISC_BECOME_KING.to_vec(),
        }
    }

    fn create_claim_prize_ix(king: &Pubkey) -> Instruction {
        let (game_state_pda, _) = get_game_state_pda();
        let (vault_pda, _) = get_vault_pda();

        Instruction {
            program_id: PROGRAM_ID,
            accounts: vec![
                AccountMeta::new(*king, true),
                AccountMeta::new(game_state_pda, false),
                AccountMeta::new(vault_pda, false),
                AccountMeta::new_readonly(system_program::ID, false),
            ],
            data: DISC_CLAIM_PRIZE.to_vec(),
        }
    }

    /// Read a u64 from the game state account data at the given offset (after 8-byte discriminator)
    fn read_u64(data: &[u8], offset: usize) -> u64 {
        let start = 8 + offset;
        u64::from_le_bytes(data[start..start + 8].try_into().unwrap())
    }

    /// Read a Pubkey from the game state account data at the given offset (after 8-byte discriminator)
    fn read_pubkey(data: &[u8], offset: usize) -> Pubkey {
        let start = 8 + offset;
        Pubkey::new_from_array(data[start..start + 32].try_into().unwrap())
    }

    // GameState layout (after 8-byte discriminator):
    // authority:      offset 0,  32 bytes
    // current_king:   offset 32, 32 bytes
    // current_price:  offset 64, 8 bytes
    // pot_amount:     offset 72, 8 bytes
    // end_time:       offset 80, 8 bytes
    // game_active:    offset 88, 1 byte
    // bump:           offset 89, 1 byte
    // vault_bump:     offset 90, 1 byte

    #[test]
    fn test_initialize_game() {
        let mut svm = LiteSVM::new();

        let program_bytes = include_bytes!("../../../target/deploy/higher.so");
        svm.add_program(PROGRAM_ID, program_bytes);

        let authority = Keypair::new();
        svm.airdrop(&authority.pubkey(), 10 * LAMPORTS_PER_SOL)
            .unwrap();

        let ix = create_initialize_ix(&authority.pubkey());
        let blockhash = svm.latest_blockhash();
        let tx = Transaction::new_signed_with_payer(
            &[ix],
            Some(&authority.pubkey()),
            &[&authority],
            blockhash,
        );

        let result = svm.send_transaction(tx);
        assert!(
            result.is_ok(),
            "Initialize should succeed: {:?}",
            result.err()
        );

        // Read game state
        let (game_state_pda, _) = get_game_state_pda();
        let account = svm.get_account(&game_state_pda).unwrap();
        let data = &account.data;

        let authority_key = read_pubkey(data, 0);
        let current_king = read_pubkey(data, 32);
        let current_price = read_u64(data, 64);
        let pot_amount = read_u64(data, 72);
        let game_active = data[8 + 88];

        assert_eq!(authority_key, authority.pubkey());
        assert_eq!(current_king, Pubkey::default()); // No king yet
        assert_eq!(current_price, STARTING_PRICE);
        assert_eq!(pot_amount, 0);
        assert_eq!(game_active, 1); // true
    }

    #[test]
    fn test_become_king() {
        let mut svm = LiteSVM::new();

        let program_bytes = include_bytes!("../../../target/deploy/higher.so");
        svm.add_program(PROGRAM_ID, program_bytes);

        let authority = Keypair::new();
        svm.airdrop(&authority.pubkey(), 10 * LAMPORTS_PER_SOL)
            .unwrap();

        // Initialize
        let ix = create_initialize_ix(&authority.pubkey());
        let blockhash = svm.latest_blockhash();
        let tx = Transaction::new_signed_with_payer(
            &[ix],
            Some(&authority.pubkey()),
            &[&authority],
            blockhash,
        );
        svm.send_transaction(tx).unwrap();

        // Player becomes king
        let player = Keypair::new();
        svm.airdrop(&player.pubkey(), 10 * LAMPORTS_PER_SOL)
            .unwrap();

        let ix = create_become_king_ix(&player.pubkey());
        let blockhash = svm.latest_blockhash();
        let tx = Transaction::new_signed_with_payer(
            &[ix],
            Some(&player.pubkey()),
            &[&player],
            blockhash,
        );

        let result = svm.send_transaction(tx);
        assert!(
            result.is_ok(),
            "Become king should succeed: {:?}",
            result.err()
        );

        // Verify state
        let (game_state_pda, _) = get_game_state_pda();
        let account = svm.get_account(&game_state_pda).unwrap();
        let data = &account.data;

        let current_king = read_pubkey(data, 32);
        let current_price = read_u64(data, 64);
        let pot_amount = read_u64(data, 72);

        assert_eq!(current_king, player.pubkey());
        assert_eq!(pot_amount, STARTING_PRICE);
        // Price should increase 20%: 10_000_000 * 1.2 = 12_000_000
        assert_eq!(current_price, 12_000_000);

        // Verify vault has funds
        let (vault_pda, _) = get_vault_pda();
        let vault_account = svm.get_account(&vault_pda).unwrap();
        assert!(vault_account.lamports >= STARTING_PRICE);
    }

    #[test]
    fn test_successive_kings() {
        let mut svm = LiteSVM::new();

        let program_bytes = include_bytes!("../../../target/deploy/higher.so");
        svm.add_program(PROGRAM_ID, program_bytes);

        let authority = Keypair::new();
        svm.airdrop(&authority.pubkey(), 10 * LAMPORTS_PER_SOL)
            .unwrap();

        // Initialize
        let ix = create_initialize_ix(&authority.pubkey());
        let blockhash = svm.latest_blockhash();
        let tx = Transaction::new_signed_with_payer(
            &[ix],
            Some(&authority.pubkey()),
            &[&authority],
            blockhash,
        );
        svm.send_transaction(tx).unwrap();

        // Player 1 becomes king at 0.01 SOL
        let player1 = Keypair::new();
        svm.airdrop(&player1.pubkey(), 10 * LAMPORTS_PER_SOL)
            .unwrap();

        let ix = create_become_king_ix(&player1.pubkey());
        let blockhash = svm.latest_blockhash();
        let tx = Transaction::new_signed_with_payer(
            &[ix],
            Some(&player1.pubkey()),
            &[&player1],
            blockhash,
        );
        svm.send_transaction(tx).unwrap();

        // Player 2 becomes king at 0.012 SOL
        let player2 = Keypair::new();
        svm.airdrop(&player2.pubkey(), 10 * LAMPORTS_PER_SOL)
            .unwrap();

        let ix = create_become_king_ix(&player2.pubkey());
        let blockhash = svm.latest_blockhash();
        let tx = Transaction::new_signed_with_payer(
            &[ix],
            Some(&player2.pubkey()),
            &[&player2],
            blockhash,
        );
        svm.send_transaction(tx).unwrap();

        // Verify state
        let (game_state_pda, _) = get_game_state_pda();
        let account = svm.get_account(&game_state_pda).unwrap();
        let data = &account.data;

        let current_king = read_pubkey(data, 32);
        let current_price = read_u64(data, 64);
        let pot_amount = read_u64(data, 72);

        assert_eq!(current_king, player2.pubkey());
        // Total pot: 10_000_000 + 12_000_000 = 22_000_000
        assert_eq!(pot_amount, 22_000_000);
        // Price after second king: 12_000_000 * 1.2 = 14_400_000
        assert_eq!(current_price, 14_400_000);
    }

    #[test]
    fn test_claim_prize_fails_before_timer() {
        let mut svm = LiteSVM::new();

        let program_bytes = include_bytes!("../../../target/deploy/higher.so");
        svm.add_program(PROGRAM_ID, program_bytes);

        let authority = Keypair::new();
        svm.airdrop(&authority.pubkey(), 10 * LAMPORTS_PER_SOL)
            .unwrap();

        // Initialize
        let ix = create_initialize_ix(&authority.pubkey());
        let blockhash = svm.latest_blockhash();
        let tx = Transaction::new_signed_with_payer(
            &[ix],
            Some(&authority.pubkey()),
            &[&authority],
            blockhash,
        );
        svm.send_transaction(tx).unwrap();

        // Player becomes king
        let player = Keypair::new();
        svm.airdrop(&player.pubkey(), 10 * LAMPORTS_PER_SOL)
            .unwrap();

        let ix = create_become_king_ix(&player.pubkey());
        let blockhash = svm.latest_blockhash();
        let tx = Transaction::new_signed_with_payer(
            &[ix],
            Some(&player.pubkey()),
            &[&player],
            blockhash,
        );
        svm.send_transaction(tx).unwrap();

        // Try to claim before timer expires - should fail
        let ix = create_claim_prize_ix(&player.pubkey());
        let blockhash = svm.latest_blockhash();
        let tx = Transaction::new_signed_with_payer(
            &[ix],
            Some(&player.pubkey()),
            &[&player],
            blockhash,
        );

        let result = svm.send_transaction(tx);
        assert!(result.is_err(), "Claim should fail before timer expires");
    }

    #[test]
    fn test_claim_prize_fails_for_non_king() {
        let mut svm = LiteSVM::new();

        let program_bytes = include_bytes!("../../../target/deploy/higher.so");
        svm.add_program(PROGRAM_ID, program_bytes);

        let authority = Keypair::new();
        svm.airdrop(&authority.pubkey(), 10 * LAMPORTS_PER_SOL)
            .unwrap();

        // Initialize
        let ix = create_initialize_ix(&authority.pubkey());
        let blockhash = svm.latest_blockhash();
        let tx = Transaction::new_signed_with_payer(
            &[ix],
            Some(&authority.pubkey()),
            &[&authority],
            blockhash,
        );
        svm.send_transaction(tx).unwrap();

        // Player 1 becomes king
        let player1 = Keypair::new();
        svm.airdrop(&player1.pubkey(), 10 * LAMPORTS_PER_SOL)
            .unwrap();

        let ix = create_become_king_ix(&player1.pubkey());
        let blockhash = svm.latest_blockhash();
        let tx = Transaction::new_signed_with_payer(
            &[ix],
            Some(&player1.pubkey()),
            &[&player1],
            blockhash,
        );
        svm.send_transaction(tx).unwrap();

        // Warp time past end_time
        svm.warp_to_slot(100_000);

        // Non-king (player2) tries to claim
        let player2 = Keypair::new();
        svm.airdrop(&player2.pubkey(), 10 * LAMPORTS_PER_SOL)
            .unwrap();

        let ix = create_claim_prize_ix(&player2.pubkey());
        let blockhash = svm.latest_blockhash();
        let tx = Transaction::new_signed_with_payer(
            &[ix],
            Some(&player2.pubkey()),
            &[&player2],
            blockhash,
        );

        let result = svm.send_transaction(tx);
        assert!(result.is_err(), "Non-king should not be able to claim");
    }
}
