# Anti-Fraud & Immutable Audit Trail

## Triangulation Logic

### Greywater Recycling Systems

| Input | Source | Purpose |
|-------|--------|---------|
| Volume (m³) | BMS / smart meter | Reported water recycled |
| kWh | BMS / pump meter | Energy consumed |

**Formula**: `expected_kWh = volume × pump_specific_energy (kWh/m³)`

**Rule**: If `|actual_kWh - expected_kWh| / expected_kWh > 15%` → **FLAGGED**

Rationale: Pump efficiency is predictable. Significant deviation suggests meter tampering or data manipulation.

---

### Atmospheric Water Generators (AWG)

| Input | Source | Purpose |
|-------|--------|---------|
| Production (L/day) | AWG device API | Reported water generated |
| Temp (°C) | Weather API (UAE) | Ambient temperature |
| Humidity (%) | Weather API (UAE) | Relative humidity |

**Formula**: `max_yield = device_coefficient × f(T, RH)` (physics-based curve per device spec)

**Rule**: If `reported > max_yield × 1.1` → **BLOCKED**

Rationale: AWG output is physically bounded by ambient conditions. Exceeding theoretical max indicates fraud.

---

## Audit Log Schema

Every verification is logged before any mint. Schema (conceptual):

```sql
CREATE TABLE audit_log (
  id UUID PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL,
  asset_id UUID NOT NULL,
  reading_id UUID NOT NULL,
  verification_result VARCHAR(20),  -- VERIFIED, FLAGGED, BLOCKED
  inputs JSONB,                     -- { volume, kWh, temp, humidity, ... }
  formula_used VARCHAR(100),
  expected_value DECIMAL,
  actual_value DECIMAL,
  tolerance_percent DECIMAL,
  hash_prev VARCHAR(64),            -- Previous entry hash (chain)
  hash_self VARCHAR(64)             -- SHA-256 of this entry
);
```

**Hash chain**: Each entry includes `hash_prev` (previous log hash) and `hash_self` (hash of this record). Tampering invalidates the chain.

---

## Flow

1. **Ingest** → Raw reading from API
2. **Triangulate** → Run physics check (Greywater or AWG)
3. **Log** → Append to audit_log (immutable)
4. **Decision** → VERIFIED → proceed to mint; FLAGGED/BLOCKED → never mint
