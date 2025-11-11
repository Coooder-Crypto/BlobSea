module blobsea::marketplace {
    use std::error;
    use std::option::{Self as Option, Option};
    use std::vector;

    use sui::coin::{Self as CoinModule, Coin};
    use sui::event;
    use sui::object::{Self as Object, ID, UID};
    use sui::signer;
    use sui::transfer;
    use sui::tx_context::TxContext;
    use sui::type_name::{Self as TypeNameModule, TypeName};

    const E_FEE_TOO_HIGH: u64 = 0;
    const E_INVALID_PAYMENT_METHOD: u64 = 1;
    const E_LISTING_INACTIVE: u64 = 2;
    const E_INSUFFICIENT_PAYMENT: u64 = 3;
    const E_WRONG_COIN_TYPE: u64 = 4;

    const PAYMENT_METHOD_DIRECT_SUI: u8 = 0;
    const PAYMENT_METHOD_DIRECT_COIN: u8 = 1;
    const PAYMENT_METHOD_X402_PROOF: u8 = 2;

    const LISTING_STATUS_ACTIVE: u8 = 1;
    const LISTING_STATUS_PAUSED: u8 = 2;
    const LISTING_STATUS_RETIRED: u8 = 3;

    struct Marketplace has key {
        id: UID,
        admin: address,
        treasury: address,
        fee_bps: u16,
        listing_count: u64,
    }

    struct Listing has key {
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
    }

    struct ListingCap has key {
        id: UID,
        listing_id: ID,
        marketplace_id: ID,
        seller: address,
    }

    struct License has key {
        id: UID,
        listing_id: ID,
        buyer: address,
        encrypted_key: vector<u8>,
        expiry_ms: Option<u64>,
        usage_limit: Option<u32>,
        payment_receipt: PaymentMetadata,
    }

    struct WalrusAccessCap has key {
        id: UID,
        license_id: ID,
        listing_id: ID,
        permissions: u64,
    }

    struct PaymentMetadata has copy, drop, store {
        method: u8,
        amount: u64,
        coin_type: TypeName,
        payer: address,
        channel_id: Option<vector<u8>>,
        proof_digest: Option<vector<u8>>,
    }

    struct ListingCreated has copy, drop, store {
        listing_id: ID,
        seller: address,
        price: u64,
        coin_type: TypeName,
        payment_method: u8,
    }

    struct PurchaseSettled has copy, drop, store {
        listing_id: ID,
        buyer: address,
        amount: u64,
        coin_type: TypeName,
        payment_metadata: PaymentMetadata,
    }

    struct LicenseRevoked has copy, drop, store {
        license_id: ID,
        listing_id: ID,
        actor: address,
    }

    public entry fun publish_marketplace(
        admin: &signer,
        treasury: address,
        fee_bps: u16,
        ctx: &mut TxContext,
    ) {
        assert!(fee_bps <= 10_000, error::invalid_argument(E_FEE_TOO_HIGH));
        let marketplace = Marketplace {
            id: Object::new(ctx),
            admin: signer::address_of(admin),
            treasury,
            fee_bps,
            listing_count: 0,
        };
        transfer::share_object(marketplace);
    }

    public entry fun create_listing<T>(
        marketplace: &mut Marketplace,
        seller: &signer,
        price: u64,
        walrus_blob_id: vector<u8>,
        walrus_hash: vector<u8>,
        terms_hash: vector<u8>,
        key_template: vector<u8>,
        payment_method: u8,
        ctx: &mut TxContext,
    ) {
        assert!(price > 0, error::invalid_argument(E_INSUFFICIENT_PAYMENT));
        assert!(
            payment_method == PAYMENT_METHOD_DIRECT_SUI || payment_method == PAYMENT_METHOD_DIRECT_COIN,
            error::invalid_argument(E_INVALID_PAYMENT_METHOD)
        );

        marketplace.listing_count = marketplace.listing_count + 1;
        let listing = Listing {
            id: Object::new(ctx),
            marketplace_id: Object::uid_to_id(&marketplace.id),
            seller: signer::address_of(seller),
            price,
            coin_type: TypeNameModule::get<T>(),
            walrus_blob_id,
            walrus_hash,
            terms_hash,
            key_template,
            status: LISTING_STATUS_ACTIVE,
            payment_method,
        };
        let cap = ListingCap {
            id: Object::new(ctx),
            listing_id: Object::uid_to_id(&listing.id),
            marketplace_id: Object::uid_to_id(&marketplace.id),
            seller: signer::address_of(seller),
        };

        emit_listing_created(&listing);
        transfer::share_object(listing);
        transfer::transfer(cap, signer::address_of(seller));
    }

    public entry fun purchase_listing<T>(
        marketplace: &mut Marketplace,
        listing: &Listing,
        payment: Coin<T>,
        buyer: &signer,
        ctx: &mut TxContext,
    ) {
        let method = listing.payment_method;
        assert!(
            method == PAYMENT_METHOD_DIRECT_SUI || method == PAYMENT_METHOD_DIRECT_COIN,
            error::invalid_argument(E_INVALID_PAYMENT_METHOD)
        );
        assert!(listing.status == LISTING_STATUS_ACTIVE, error::invalid_state(E_LISTING_INACTIVE));
        assert!(
            TypeNameModule::equals(&listing.coin_type, &TypeNameModule::get<T>()),
            error::invalid_argument(E_WRONG_COIN_TYPE)
        );

        let payment_receipt = direct_payment(marketplace, listing, payment, buyer);
        mint_entitlements(listing, buyer, payment_receipt, ctx);
    }

    public entry fun purchase_listing_with_payment(
        _marketplace: &mut Marketplace,
        _listing: &Listing,
        _buyer: &signer,
        _params: vector<u8>,
        _ctx: &mut TxContext,
    ) {
        abort error::invalid_argument(E_INVALID_PAYMENT_METHOD)
    }

    public entry fun revoke_license(
        listing_cap: &ListingCap,
        seller: &signer,
        license: License,
    ) {
        let actor = signer::address_of(seller);
        assert!(actor == listing_cap.seller, error::permission_denied(E_INVALID_PAYMENT_METHOD));
        let license_id = Object::uid_to_id(&license.id);
        let listing_id = license.listing_id;
        Object::delete(license);
        let event = LicenseRevoked {
            license_id,
            listing_id,
            actor,
        };
        event::emit(event);
    }

    public entry fun withdraw_fees(
        _treasury: &signer,
        _marketplace: &Marketplace,
    ) {
        // Fees are distributed instantly in `direct_payment`.
    }

    fun direct_payment<T>(
        marketplace: &Marketplace,
        listing: &Listing,
        payment: Coin<T>,
        buyer: &signer,
    ): PaymentMetadata {
        let buyer_addr = signer::address_of(buyer);
        let total_value = CoinModule::value(&payment);
        assert!(total_value >= listing.price, error::invalid_argument(E_INSUFFICIENT_PAYMENT));

        let mut working_payment = payment;
        let required = CoinModule::split(&mut working_payment, listing.price);
        let change = working_payment;
        if (CoinModule::value(&change) > 0) {
            transfer::transfer(change, buyer_addr);
        } else {
            CoinModule::destroy_zero(change);
        }

        let fee = calculate_fee(listing.price, marketplace.fee_bps);
        let seller_amount = listing.price - fee;
        let mut seller_coin = required;
        if (fee > 0) {
            let fee_coin = CoinModule::split(&mut seller_coin, fee);
            transfer::transfer(fee_coin, marketplace.treasury);
        }
        transfer::transfer(seller_coin, listing.seller);

        PaymentMetadata {
            method: listing.payment_method,
            amount: listing.price,
            coin_type: listing.coin_type,
            payer: buyer_addr,
            channel_id: Option::none(),
            proof_digest: Option::none(),
        }
    }

    fun mint_entitlements(
        listing: &Listing,
        buyer: &signer,
        payment_receipt: PaymentMetadata,
        ctx: &mut TxContext,
    ) {
        let event_metadata = payment_receipt;
        let license = License {
            id: Object::new(ctx),
            listing_id: Object::uid_to_id(&listing.id),
            buyer: signer::address_of(buyer),
            encrypted_key: vector::empty<u8>(),
            expiry_ms: Option::none(),
            usage_limit: Option::none(),
            payment_receipt,
        };

        let license_id = Object::uid_to_id(&license.id);
        let walrus_cap = WalrusAccessCap {
            id: Object::new(ctx),
            license_id,
            listing_id: Object::uid_to_id(&listing.id),
            permissions: 0,
        };

        let purchase_event = PurchaseSettled {
            listing_id: Object::uid_to_id(&listing.id),
            buyer: signer::address_of(buyer),
            amount: listing.price,
            coin_type: listing.coin_type,
            payment_metadata: event_metadata,
        };

        transfer::transfer(license, signer::address_of(buyer));
        transfer::transfer(walrus_cap, signer::address_of(buyer));
        event::emit(purchase_event);
    }

    public(package) fun calculate_fee(amount: u64, fee_bps: u16): u64 {
        (amount * (fee_bps as u64)) / 10_000
    }

    fun emit_listing_created(listing: &Listing) {
        let event = ListingCreated {
            listing_id: Object::uid_to_id(&listing.id),
            seller: listing.seller,
            price: listing.price,
            coin_type: listing.coin_type,
            payment_method: listing.payment_method,
        };
        event::emit(event);
    }
}
