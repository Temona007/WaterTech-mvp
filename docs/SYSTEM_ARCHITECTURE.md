# WaterTech dMRV — System Architecture

## End-to-End Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                           EXTERNAL DATA SOURCES (API Integrations)                            │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐   │
│  │ BMS / Smart      │  │ Greywater        │  │ AWG Device       │  │ Weather API      │   │
│  │ Meters (kWh)     │  │ Volume Sensors   │  │ Production APIs  │  │ (UAE: NCM,       │   │
│  │                  │  │                  │  │                  │  │  WeatherAPI.com) │   │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘   │
└───────────┼─────────────────────┼─────────────────────┼─────────────────────┼─────────────┘
            │                     │                     │                     │
            ▼                     ▼                     ▼                     ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                              API INGESTION LAYER (REST / Webhooks)                           │
│  • Rate limiting  • Schema validation  • Idempotency keys  • Request signing                 │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
                                            │
                                            ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                           DATA VALIDATION ENGINE (Triangulation Logic)                       │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────┐  ┌─────────────────────────────────────────────┐   │
│  │ GREYWATER TRIANGULATION             │  │ AWG TRIANGULATION                           │   │
│  │ Volume vs. kWh (pump efficiency)     │  │ Production vs. Temp/Humidity (physics)     │   │
│  │ • Expected kWh = f(volume, pump η)   │  │ • Max yield = f(T, RH) per device spec     │   │
│  │ • Flag if |actual - expected| > ε    │  │ • Flag if reported > theoretical max        │   │
│  └─────────────────────────────────────┘  └─────────────────────────────────────────────┘   │
│                                            │                                                     │
│  Output: VERIFIED | FLAGGED | BLOCKED                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
                                            │
                                            ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                              AUDIT LOG (Immutable Append-Only)                               │
│  • Every verification step logged  • Hash chain for integrity  • Timestamp + actor           │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
                                            │
                                            ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                    UAE DATA RESIDENCY — Database (PostgreSQL / UAE DC)                       │
│  • Assets  • Readings  • Verifications  • AuditLog  • Users  • WaterCredits                  │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
                                            │
                                            ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                    COMPLIANCE LAYER (KYB / AML — Sumsub, Chainalysis)                        │
│  • Pre-mint KYB check  • AML screening  • FSRA/ADGM reporting hooks                         │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
                                            │
                                            ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                    WEB3 MINTING LAYER (Institutional Blockchain)                            │
│  • Batch aggregation (e.g. daily)  • Gas-optimized minting  • Water Credit NFT/Token       │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

## Data Flow Summary

| Stage | Input | Output |
|-------|-------|--------|
| Ingestion | BMS kWh, Volume, AWG L/day, Weather (T, RH) | Raw readings |
| Triangulation | Raw readings | Verified / Flagged / Blocked |
| Audit | Verification result | Immutable log entry |
| Compliance | Asset owner ID | KYB/AML status |
| Minting | Verified credits | Tokenized Water Credits |

## Key Design Decisions

- **No custom hardware**: All data via existing BMS/smart meter APIs
- **UAE data residency**: DB and compute in UAE data centers only
- **Fraud-first**: Triangulation before any mint; flagged data never reaches chain
