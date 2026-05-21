# Security Specification for La Preferida Restaurante

## 1. Data Invariants
1. Everyone (anonymous customers) can read the digital menu `/config/menu`, active promotion coupons `/config/coupons`, and general administration settings `/config/settings`.
2. Only the verified owner with the authenticated Google email `lapreferidarestaurante2025@gmail.com` is allowed to create, update, or delete settings, menu items, or coupon configurations.
3. System timestamps (`updatedAt`, etc.) must match `request.time` on writes.

## 2. The "Dirty Dozen" Malicious Payloads

### Payload 1: Unauthorized Menu Modification (Blocked)
- **Target Path**: `config/menu`
- **Method**: `set`
- **Auth**: None (Anonymous) or generic user
- **Goal**: Inject a rogue category or change prices for profit.

### Payload 2: Unauthorized Coupon Injection (Blocked)
- **Target Path**: `config/coupons`
- **Method**: `set`
- **Auth**: None (Anonymous) or generic user
- **Goal**: Create an unauthorised 100% OFF coupon configuration.

### Payload 3: Unauthorized Settings Update (Blocked)
- **Target Path**: `config/settings`
- **Method**: `set`
- **Auth**: None
- **Goal**: Change administrative PIN or disable promo banners.

### Payload 4: Spoofed Owner Email (Blocked)
- **Target Path**: `config/menu`
- **Method**: `set`
- **Auth**: Authenticated but with a spoofed email (not `lapreferidarestaurante2025@gmail.com`)
- **Goal**: Gain admin access using a personal gmail account.

### Payload 5: Spoofed Non-Verified Email (Blocked)
- **Target Path**: `config/menu`
- **Method**: `set`
- **Auth**: Authenticated with `lapreferidarestaurante2025@gmail.com` but with `email_verified == false`
- **Goal**: Trick security by signing up with a non-verified email placeholder.

### Payload 6: Invalid Document ID Poisoning (Blocked)
- **Target Path**: `config/some-rogue-collection-id-that-is-too-long-and-junk`
- **Method**: `set`
- **Auth**: Owner
- **Goal**: Exceed resource boundaries.

### Payload 7: Array Limit Abuse on Coupons (Blocked)
- **Target Path**: `config/coupons`
- **Method**: `update`
- **Auth**: Owner
- **Goal**: Insert millions of coupon nodes (denial of service/wallet attack).

### Payload 8: Immutable Settings Mod (Blocked)
- **Target Path**: `config/settings`
- **Method**: `update`
- **Auth**: Owner trying to remove structural keys.

### Payload 9: PII Leaks (Blocked)
- **Target Path**: Any user-metadata path
- **Method**: `get`
- **Auth**: Public
- **Goal**: Attempt to scrape other orders.

### Payload 10: State Bypass in Coupons (Blocked)
- **Target Path**: `config/coupons`
- **Method**: `update`
- **Auth**: Regular client trying to toggle coupon status.

...Additional validation payloads in the test suite verify strict schema and type boundaries.
