# Project Overview

## 1) What It Is

**Marlon** is a multi-tenant SaaS platform for Algerian entrepreneurs to launch and run COD-first online stores without technical setup.
It combines storefront creation, order operations, and local delivery workflows in one product.

## 2) Problem

Algerian merchants still face three core blockers when selling online:

- Ecommerce tools are too technical and heavy for solo operators.
- COD operations (confirmation calls, status handling, delivery handoff) are usually manual and fragmented.
- Local realities (DZD billing, local phone/address rules, local delivery providers) are poorly supported by global tools.

## 3) Solution (Current Monetization and Operating Model)

Marlon provides fast setup plus COD-native operations, with a locked commercial model for MVP:

- **Stores per account:** unlimited.
- **Usage gate:** per-store daily cap of 5 orders/day.
- **Overflow handling:** overflow orders are accepted, but merchant-side overflow order data is masked/frozen until unlock.
- **Locked-state customer experience:** no customer notification that the store is locked.
- **Retention rule for masked overflow:** masked overflow data auto-deletes after 5 days if still locked.
- **Unlock rule:** `2000 DZD / store / month` subscription; any store admin can pay to unlock.

## 4) Users and Go-to-Market Sequence

1. **Solo merchants first (primary segment):** non-technical operators who need a simple COD workflow and quick launch.
2. **Agency owners and resellers second:** operators managing multiple stores.

Agency model is explicitly supported in both forms:

- Agencies can create and own stores directly.
- Agencies can be invited to client-owned stores and operate them with granted access.

## 5) Differentiators

- **COD-native by default:** order lifecycle, call-driven confirmations, and operations built around COD realities.
- **Algeria-first implementation:** DZD economics, local address/phone patterns, and local delivery integrations.
- **Low-friction scaling:** unlimited store creation with clear per-store monetization and unlock mechanics.
- **Control-preserving lock model:** storefront continues accepting demand while merchant-side sensitive overflow data remains protected until paid unlock.

## 6) Success Metrics

- **North-star:** net revenue retained (after churn).
- **Supporting activation metrics:** time to first store, time to first product.
- **Supporting operational metrics:** order confirmation rate and order completion rate.
- **Supporting commercial metrics:** store unlock conversion rate, paid-store retention, and net DZD revenue growth.

## 7) Strategic Operating Principles

- **Reliability and security first:** when priorities conflict, reliability/security wins over feature velocity.
- **Per-store economic clarity:** monetization, limits, and unlock logic are enforced consistently per store.
- **Tenant-safe operations:** masking, access controls, and auditability are treated as core product behavior, not optional add-ons.
- **Pragmatic sequencing:** prioritize outcomes that improve retained revenue without degrading trust or operational stability.
