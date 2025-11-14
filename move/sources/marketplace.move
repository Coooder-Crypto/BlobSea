#[allow(duplicate_alias, lint(public_entry))]
module blobsea::marketplace {
    use sui::coin::{Self as CoinModule, Coin};
    use sui::event;
    use sui::object::{Self as Object, ID, UID};
    use sui::transfer;
    use sui::tx_context::{Self as TxContextModule, TxContext};
    use std::type_name::{Self as TypeNameModule, TypeName};

    const E_FEE_TOO_HIGH: u64 = 0;
    const E_INVALID_PAYMENT_METHOD: u64 = 1;
    const E_LISTING_INACTIVE: u64 = 2;
    const E_INSUFFICIENT_PAYMENT: u64 = 3;
    const E_WRONG_COIN_TYPE: u64 = 4;
    const E_NOT_ADMIN: u64 = 5;
    const E_NOT_SELLER: u64 = 6;
    const E_INVALID_STATUS: u64 = 7;
    const E_WRONG_MARKETPLACE: u64 = 8;

    const PAYMENT_METHOD_DIRECT_SUI: u8 = 0;
    const PAYMENT_METHOD_DIRECT_COIN: u8 = 1;

    const LISTING_STATUS_ACTIVE: u8 = 1;
    const LISTING_STATUS_PAUSED: u8 = 2;
    const LISTING_STATUS_RETIRED: u8 = 3;

    const LISTING_UPDATE_PRICE: u64 = 1;
    const LISTING_UPDATE_STATUS: u64 = 2;
    const LISTING_UPDATE_METADATA: u64 = 4;

    public struct Marketplace has key {
        id: UID,
        admin: address,
        treasury: address,
        fee_bps: u16,
        listing_count: u64,
    }

    public struct Listing has key, store {
        id: UID,
        marketplace_id: ID,
        seller: address,
        price: u64,
        coin_type: TypeName,
        walrus_blob_id: vector<u8>,
        walrus_hash: vector<u8>,
        terms_hash: vector<u8>,
        key_template: vector<u8>,
        status: u8,
        payment_method: u8,
        created_at_ms: u64,
        updated_at_ms: u64,
    }

    public struct ListingCap has key, store {
        id: UID,
        listing_id: ID,
        marketplace_id: ID,
        seller: address,
    }

    public struct License has key, store {
        id: UID,
        listing_id: ID,
        buyer: address,
        encrypted_key: vector<u8>,
        expiry_ms: option::Option<u64>,
        usage_limit: option::Option<u32>,
        payment_receipt: PaymentMetadata,
        granted_at: u64,
    }

    public struct WalrusAccessCap has key, store {
        id: UID,
        license_id: ID,
        listing_id: ID,
        permissions: u64,
    }

    public struct PaymentMetadata has copy, drop, store {
        method: u8,
        amount: u64,
        coin_type: TypeName,
        payer: address,
        channel_id: option::Option<vector<u8>>,
        proof_digest: option::Option<vector<u8>>,
    }

    public struct ListingCreated has copy, drop, store {
        listing_id: ID,
        seller: address,
        price: u64,
        coin_type: TypeName,
        payment_method: u8,
        walrus_blob_id: vector<u8>,
        walrus_hash: vector<u8>,
        terms_hash: vector<u8>,
    }

    public struct ListingUpdated has copy, drop, store {
        listing_id: ID,
        seller: address,
        price: u64,
        status: u8,
        update_mask: u64,
    }

    public struct PurchaseSettled has copy, drop, store {
        listing_id: ID,
        buyer: address,
        amount: u64,
        coin_type: TypeName,
        payment_metadata: PaymentMetadata,
    }

    public struct LicenseRevoked has copy, drop, store {
        license_id: ID,
        listing_id: ID,
        actor: address,
    }

    public entry fun publish_marketplace(
        treasury: address,
        fee_bps: u16,
        ctx: &mut TxContext,
    ) {
        assert!(fee_bps <= 10_000, E_FEE_TOO_HIGH);
        let marketplace = Marketplace {
            id: Object::new(ctx),
            admin: TxContextModule::sender(ctx),
            treasury,
            fee_bps,
            listing_count: 0,
        };
        transfer::share_object(marketplace);
    }

    public entry fun set_fee_bps(
        marketplace: &mut Marketplace,
        new_fee_bps: u16,
        ctx: &TxContext,
    ) {
        assert_admin(marketplace, ctx);
        assert!(new_fee_bps <= 10_000, E_FEE_TOO_HIGH);
        marketplace.fee_bps = new_fee_bps;
    }

    public entry fun set_treasury(
        marketplace: &mut Marketplace,
        new_treasury: address,
        ctx: &TxContext,
    ) {
        assert_admin(marketplace, ctx);
        marketplace.treasury = new_treasury;
    }

    public entry fun create_listing<T>(
        marketplace: &mut Marketplace,
        price: u64,
        walrus_blob_id: vector<u8>,
        walrus_hash: vector<u8>,
        terms_hash: vector<u8>,
        key_template: vector<u8>,
        payment_method: u8,
        ctx: &mut TxContext,
    ) {
        assert!(price > 0, E_INSUFFICIENT_PAYMENT);
        assert!(
            payment_method == PAYMENT_METHOD_DIRECT_SUI || payment_method == PAYMENT_METHOD_DIRECT_COIN,
            E_INVALID_PAYMENT_METHOD
        );

        marketplace.listing_count = marketplace.listing_count + 1;
        let seller = TxContextModule::sender(ctx);
        let now = TxContextModule::epoch_timestamp_ms(ctx);
        let listing = Listing {
            id: Object::new(ctx),
            marketplace_id: Object::uid_to_inner(&marketplace.id),
            seller,
            price,
            coin_type: TypeNameModule::with_defining_ids<T>(),
            walrus_blob_id,
            walrus_hash,
            terms_hash,
            key_template,
            status: LISTING_STATUS_ACTIVE,
            payment_method,
            created_at_ms: now,
            updated_at_ms: now,
        };
        let cap = ListingCap {
            id: Object::new(ctx),
            listing_id: Object::uid_to_inner(&listing.id),
            marketplace_id: Object::uid_to_inner(&marketplace.id),
            seller,
        };

        emit_listing_created(&listing);
        transfer::share_object(listing);
        transfer::public_transfer(cap, seller);
    }

    public entry fun purchase_listing<T>(
        marketplace: &mut Marketplace,
        listing: &Listing,
        payment: Coin<T>,
        ctx: &mut TxContext,
    ) {
        let method = listing.payment_method;
        assert!(
            method == PAYMENT_METHOD_DIRECT_SUI || method == PAYMENT_METHOD_DIRECT_COIN,
            E_INVALID_PAYMENT_METHOD
        );
        assert!(listing.status == LISTING_STATUS_ACTIVE, E_LISTING_INACTIVE);
        assert_marketplace_membership(marketplace, listing);
        let expected_type = TypeNameModule::with_defining_ids<T>();
        assert!(type_names_equal(&listing.coin_type, &expected_type), E_WRONG_COIN_TYPE);

        let buyer = TxContextModule::sender(ctx);
        let payment_receipt = direct_payment(marketplace, listing, payment, buyer, ctx);
        mint_entitlements(listing, buyer, payment_receipt, ctx);
    }

    public entry fun purchase_listing_with_payment(
        _marketplace: &mut Marketplace,
        _listing: &Listing,
        _params: vector<u8>,
        _ctx: &mut TxContext,
    ) {
        abort E_INVALID_PAYMENT_METHOD
    }

    public entry fun revoke_license(
        listing_cap: &ListingCap,
        license: License,
        ctx: &TxContext,
    ) {
        let actor = TxContextModule::sender(ctx);
        assert!(actor == listing_cap.seller, E_NOT_SELLER);
        assert!(license.listing_id == listing_cap.listing_id, E_WRONG_MARKETPLACE);
        let License {
            id,
            listing_id,
            buyer: _,
            encrypted_key: _,
            expiry_ms: _,
            usage_limit: _,
            payment_receipt: _,
            granted_at: _,
        } = license;
        let license_id = Object::uid_to_inner(&id);
        Object::delete(id);
        let event = LicenseRevoked {
            license_id,
            listing_id,
            actor,
        };
        event::emit(event);
    }

    public entry fun update_listing_price(
        listing_cap: &ListingCap,
        listing: &mut Listing,
        new_price: u64,
        ctx: &TxContext,
    ) {
        assert!(new_price > 0, E_INSUFFICIENT_PAYMENT);
        assert_listing_control(listing_cap, listing, ctx);
        listing.price = new_price;
        bump_listing_timestamp(listing, ctx);
        emit_listing_updated(listing, LISTING_UPDATE_PRICE);
    }

    public entry fun update_listing_status(
        listing_cap: &ListingCap,
        listing: &mut Listing,
        new_status: u8,
        ctx: &TxContext,
    ) {
        assert!(is_valid_status(new_status), E_INVALID_STATUS);
        assert_listing_control(listing_cap, listing, ctx);
        listing.status = new_status;
        bump_listing_timestamp(listing, ctx);
        emit_listing_updated(listing, LISTING_UPDATE_STATUS);
    }

    public entry fun update_listing_metadata(
        listing_cap: &ListingCap,
        listing: &mut Listing,
        walrus_blob_id: vector<u8>,
        walrus_hash: vector<u8>,
        terms_hash: vector<u8>,
        key_template: vector<u8>,
        ctx: &TxContext,
    ) {
        assert_listing_control(listing_cap, listing, ctx);
        listing.walrus_blob_id = walrus_blob_id;
        listing.walrus_hash = walrus_hash;
        listing.terms_hash = terms_hash;
        listing.key_template = key_template;
        bump_listing_timestamp(listing, ctx);
        emit_listing_updated(listing, LISTING_UPDATE_METADATA);
    }

    public entry fun withdraw_fees(
        _marketplace: &Marketplace,
        _ctx: &mut TxContext,
    ) {
        // Fees are transferred immediately during purchase.
    }

    fun direct_payment<T>(
        marketplace: &Marketplace,
        listing: &Listing,
        payment: Coin<T>,
        buyer_addr: address,
        ctx: &mut TxContext,
    ): PaymentMetadata {
        let total_value = CoinModule::value(&payment);
        assert!(total_value >= listing.price, E_INSUFFICIENT_PAYMENT);

        let mut working_payment = payment;
        let price_coin = CoinModule::split(&mut working_payment, listing.price, ctx);
        let change = working_payment;
        if (CoinModule::value(&change) > 0) {
            transfer::public_transfer(change, buyer_addr);
        } else {
            CoinModule::destroy_zero(change);
        };

        let fee = calculate_fee(listing.price, marketplace.fee_bps);
        let mut seller_coin = price_coin;
        if (fee > 0) {
            let fee_coin = CoinModule::split(&mut seller_coin, fee, ctx);
            transfer::public_transfer(fee_coin, marketplace.treasury);
        };
        transfer::public_transfer(seller_coin, listing.seller);

        PaymentMetadata {
            method: listing.payment_method,
            amount: listing.price,
            coin_type: listing.coin_type,
            payer: buyer_addr,
            channel_id: option::none(),
            proof_digest: option::none(),
        }
    }

    fun mint_entitlements(
        listing: &Listing,
        buyer_addr: address,
        payment_receipt: PaymentMetadata,
        ctx: &mut TxContext,
    ) {
        let event_metadata = payment_receipt;
        let granted_at = TxContextModule::epoch_timestamp_ms(ctx);
        let license = License {
            id: Object::new(ctx),
            listing_id: Object::uid_to_inner(&listing.id),
            buyer: buyer_addr,
            encrypted_key: clone_bytes(&listing.key_template),
            expiry_ms: option::none(),
            usage_limit: option::none(),
            payment_receipt,
            granted_at,
        };

        let license_id = Object::uid_to_inner(&license.id);
        let walrus_cap = WalrusAccessCap {
            id: Object::new(ctx),
            license_id,
            listing_id: Object::uid_to_inner(&listing.id),
            permissions: 0,
        };

        let purchase_event = PurchaseSettled {
            listing_id: Object::uid_to_inner(&listing.id),
            buyer: buyer_addr,
            amount: listing.price,
            coin_type: listing.coin_type,
            payment_metadata: event_metadata,
        };

        transfer::public_transfer(license, buyer_addr);
        transfer::public_transfer(walrus_cap, buyer_addr);
        event::emit(purchase_event);
    }

    public fun calculate_fee(amount: u64, fee_bps: u16): u64 {
        (amount * (fee_bps as u64)) / 10_000
    }

    fun emit_listing_created(listing: &Listing) {
        let event = ListingCreated {
            listing_id: Object::uid_to_inner(&listing.id),
            seller: listing.seller,
            price: listing.price,
            coin_type: listing.coin_type,
            payment_method: listing.payment_method,
            walrus_blob_id: clone_bytes(&listing.walrus_blob_id),
            walrus_hash: clone_bytes(&listing.walrus_hash),
            terms_hash: clone_bytes(&listing.terms_hash),
        };
        event::emit(event);
    }

    fun emit_listing_updated(listing: &Listing, mask: u64) {
        let event = ListingUpdated {
            listing_id: Object::uid_to_inner(&listing.id),
            seller: listing.seller,
            price: listing.price,
            status: listing.status,
            update_mask: mask,
        };
        event::emit(event);
    }

    fun assert_admin(marketplace: &Marketplace, ctx: &TxContext) {
        assert!(
            TxContextModule::sender(ctx) == marketplace.admin,
            E_NOT_ADMIN
        );
    }

    fun assert_marketplace_membership(marketplace: &Marketplace, listing: &Listing) {
        assert!(
            listing.marketplace_id == Object::uid_to_inner(&marketplace.id),
            E_WRONG_MARKETPLACE
        );
    }

    fun assert_listing_control(listing_cap: &ListingCap, listing: &Listing, ctx: &TxContext) {
        let seller_addr = TxContextModule::sender(ctx);
        assert!(seller_addr == listing_cap.seller, E_NOT_SELLER);
        assert!(listing_cap.listing_id == Object::uid_to_inner(&listing.id), E_WRONG_MARKETPLACE);
        assert!(
            listing_cap.marketplace_id == listing.marketplace_id,
            E_WRONG_MARKETPLACE
        );
    }

    fun bump_listing_timestamp(listing: &mut Listing, ctx: &TxContext) {
        listing.updated_at_ms = TxContextModule::epoch_timestamp_ms(ctx);
    }

    public fun is_valid_status(status: u8): bool {
        status == LISTING_STATUS_ACTIVE ||
        status == LISTING_STATUS_PAUSED ||
        status == LISTING_STATUS_RETIRED
    }

    fun type_names_equal(lhs: &TypeName, rhs: &TypeName): bool {
        TypeNameModule::as_string(lhs) == TypeNameModule::as_string(rhs)
    }

    fun clone_bytes(data: &vector<u8>): vector<u8> {
        let mut result = vector::empty<u8>();
        let len = vector::length(data);
        let mut i = 0;
        while (i < len) {
            let value = *vector::borrow(data, i);
            vector::push_back(&mut result, value);
            i = i + 1;
        };
        result
    }
}
