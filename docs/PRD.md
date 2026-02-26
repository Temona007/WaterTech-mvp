# WaterTech dMRV — Product Requirements Document (PRD)

## 1. Overview

**Product**: Sovereign dMRV (digital Measurement, Reporting, Verification) platform for Water Credits  
**Mission**: Operationalize water security by verifying decentralized water generation/savings in commercial real estate and converting them into tokenized Water Credits.  
**Constraint**: API-driven SaaS only — no custom hardware.

---

## 2. Tech Stack (MVP)

| Layer | Technology |
|-------|------------|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Backend (future) | Node.js / Python |
| Database (future) | PostgreSQL (UAE-hosted) |
| Weather API | WeatherAPI.com (free tier, UAE: q=Dubai) |
| Compliance (future) | Sumsub (KYB), Chainalysis (AML) |
| Blockchain (future) | Polygon / Hedera (ADGM-friendly, low gas) |

---

## 3. Multi-Role Login

### 3.1 Roles

| Role | Scope | Capabilities |
|------|-------|--------------|
| **Asset Owner / Hotel** | Own assets only | View own metrics, credits, audit trail |
| **GIAS Admin** | System-wide | Oversight, fraud monitoring, all assets, simulation controls |

### 3.2 Endpoints (Future API)

```
POST /auth/login          → { email, password } → { token, role }
GET  /assets              → (role-filtered: owner sees own, admin sees all)
GET  /assets/:id/readings → Time-series data
GET  /verifications       → Audit trail (owner: own, admin: all)
GET  /credits             → Minted credits
POST /simulation/toggle   → Admin only: enable/disable simulation mode
POST /simulation/stream   → Admin only: inject clean or malicious synthetic data
```

### 3.3 Dashboard Scopes

- **Asset Owner**: Single-tenant view — only their properties/assets
- **GIAS Admin**: Multi-tenant view — all properties, fraud alerts, simulation panel

---

## 4. Simulation Mode

### 4.1 Purpose

Demo environment for investors: showcase fraud detection with synthetic data.

### 4.2 Toggle

- **Production**: Real API data only
- **Simulation**: Synthetic streams only (no real data)

### 4.3 Data Streams

| Stream Type | Description | Expected Outcome |
|-------------|-------------|------------------|
| **Clean** | Physics-consistent synthetic data | All verifications PASS |
| **Malicious** | Inflated volume, mismatched kWh, impossible AWG yield | Verifications FLAG / BLOCK |

### 4.4 Endpoints

```
GET  /simulation/status   → { enabled: bool, mode: "clean" | "malicious" }
POST /simulation/start    → { mode: "clean" | "malicious" }
POST /simulation/stop     → Stop synthetic stream
```

---

## 5. Anti-Fraud & Audit Trail

### 5.1 Triangulation Logic

**Greywater:**
- Inputs: Volume (m³), kWh (pump)
- Formula: `expected_kWh = volume * pump_specific_energy (kWh/m³)`
- Threshold: `|actual_kWh - expected_kWh| / expected_kWh < 0.15` (15% tolerance)
- Outcome: PASS or FLAG

**AWG:**
- Inputs: Production (L/day), Temp (°C), Humidity (%), device spec (L/day per condition)
- Formula: `max_yield = device_coefficient * f(T, RH)` (physics-based curve)
- Rule: `reported <= max_yield * 1.1` (10% tolerance)
- Outcome: PASS or FLAG

### 5.2 Audit Log Schema

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
  hash_prev VARCHAR(64),            -- Hash chain
  hash_self VARCHAR(64)
);
```

---

## 6. Compliance Integration (KYB/AML)

### 6.1 Flow

```
Asset Owner Registration → Sumsub KYB (identity, biz docs)
                          → Chainalysis AML screening
                          → Status: APPROVED | PENDING | REJECTED
Mint Request → Check compliance status → Block if not APPROVED
```

### 6.2 API Endpoints (Future)

```
POST /compliance/kyb/init    → Redirect to Sumsub flow
GET  /compliance/kyb/status  → { status, applicant_id }
POST /compliance/aml/check   → Chainalysis API call
```

---

## 7. Data Residency & Sovereign Cloud

- **Requirement**: All data stored and processed within UAE data centers
- **Options**: AWS me-south-1 (Bahrain), Azure UAE North, GCP (future UAE region), or local UAE providers (e.g., Khazna, Khazna Data Centers)
- **MVP**: Architecture designed for UAE hosting; demo uses local/in-memory data

---

## 8. Ledger & Unit Economics

### 8.1 Recommended Ledgers (ADGM)

| Ledger | Pros | Cons |
|--------|------|------|
| **Polygon** | Low gas, EVM, institutional adoption | Not UAE-specific |
| **Hedera** | Council governance, low fees, ESG focus | Smaller ecosystem |
| **BSN (UAE)** | Sovereign, UAE-aligned | Less mature |

**Recommendation**: Polygon or Hedera for MVP; evaluate BSN for sovereign roadmap.

### 8.2 Batching Strategy

- **Aggregation**: Daily or weekly batches per asset
- **Minting**: One transaction per batch (not per reading)
- **API Polling**: Max 1x per 15 min per asset (configurable)
- **Gas**: Minimize on-chain writes; batch multiple credits per tx

---

## 9. MVP Scope (Current Build)

- [x] Multi-role login (Asset Owner / GIAS Admin)
- [x] Simulation mode (clean + malicious)
- [x] Data triangulation logic (conceptual + demo)
- [x] Audit trail UI
- [x] Weather API integration (UAE)
- [x] Demo data (no real DB)
- [ ] Real database
- [ ] Real blockchain minting
- [ ] Sumsub / Chainalysis integration
