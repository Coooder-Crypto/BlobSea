module blobsea::marketplace_tests {
    use blobsea::marketplace;

    const E_ASSERT: u64 = 0;

    #[test]
    fun calculate_fee_zero() {
        let fee = marketplace::calculate_fee(1_000, 0);
        assert!(fee == 0, E_ASSERT);
    }

    #[test]
    fun calculate_fee_half_percent() {
        let fee = marketplace::calculate_fee(200_000_000, 50);
        assert!(fee == 1_000_000, E_ASSERT);
    }
}
