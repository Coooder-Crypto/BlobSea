module blobsea::marketplace_tests {
    use std::debug;

    use blobsea::marketplace;

    #[test]
    fun calculate_fee_zero() {
        let fee = marketplace::calculate_fee(1_000, 0);
        debug::assert_eq(fee, 0);
    }

    #[test]
    fun calculate_fee_half_percent() {
        let fee = marketplace::calculate_fee(200_000_000, 50);
        debug::assert_eq(fee, 1_000_000);
    }
}
