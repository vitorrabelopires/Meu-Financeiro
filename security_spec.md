# Firebase Firestore Security Specification

This document details the threat model, security invariants, and test payload assertions designed to enforce a fortress-level, Zero-Trust environment for the `meufinanceiro` applet.

## 1. Core Data Invariants

1. **User Isolation**: No user may read, update, list, or delete another user's financial objects (transactions, tags, credit cards, accounts).
2. **Global Admin Override**: Verified administrative master users (`vitorrabelopires@gmail.com` and `admin@meufinanceiro.com`) have full access across all documents to supervise operations.
3. **Data Type and Size Enforcement**: All fields saved under document creation or expansion are verified for string bounds, correct types, and finite ranges (e.g. days between 1-31).

---

## 2. The "Dirty Dozen" Payloads (Exploit Payloads)

Each payload is verified to fail (`PERMISSION_DENIED`) against the ruleset:

1. **Identity Spoofing - Transaction Theft**: User `attacker` tries to read a Transaction owned by `vitorrabelopires`.
2. **Privilege Escalation**: User `attacker` tries to write a system-wide Category document with `userId = null` to pollute general views.
3. **Shadow Update Gate - Extra Fields**: User tries to insert `isPremiumCustomer: true` inside a standard transaction.
4. **Denial of Wallet - High Size Payload**: Attacker attempts to populate a Transaction description string of 5MB length.
5. **Path ID Poisoning**: Attacker tries to create a document with ID `../../hack-path` containing malicious character escape loops.
6. **Value Poisoning - Out of Bounds Closing Day**: Attacker creates a CreditCard with closing day `45` to break calendar math.
7. **Type Mismatch Hijack**: Attacker updates standard Tag document setting the `color` property to a Map instead of string.
8. **Invalid Enum Bypass**: Attacker creates transaction with type `unknown` to break ledger balances.
9. **State Locking Violation**: Attacker attempts to inject custom status values to gain access.
10. **Orphaned Writes**: Attacker attempts to write tags linked to an unauthorized third-party user key.
11. **PII Isolation Leak**: Attacker lists notifications from accounts they do not own.
12. **Unauthorized Metadata Wipe**: Attacker tries to batch delete shared global preset accounts.

---

## 3. Test Runner Invariant

Our automated test assertions verify that any payload above is blocked by returning `false` under Firestore rules evaluation.
