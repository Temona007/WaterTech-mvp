# WaterTech dMRV — Water Credits Platform

Sovereign digital Measurement, Reporting, and Verification (dMRV) platform for tokenized Water Credits in commercial real estate.

## Quick Start

1. Open `index.html` in a browser, or serve locally:
   ```bash
   npx serve .
   ```
2. **Login**: Use any email/password. Select **Asset Owner** or **GIAS Admin**.
3. **Asset Owner**: Sees only their assets (Burj Al Arab, Emirates Palace).
4. **GIAS Admin**: Sees all assets + Simulation panel.

## Simulation Mode (Admin Only)

- Toggle **Enable Simulation** to switch from demo data to synthetic streams.
- **Clean Data**: Physics-consistent readings → all verifications PASS.
- **Malicious Data**: Inflated/impossible readings → FLAGGED/BLOCKED by triangulation.

## Weather API (UAE)

For live UAE weather in AWG triangulation:

1. Sign up at [weatherapi.com](https://www.weatherapi.com/signup.aspx) (free tier).
2. Add your API key in `js/config.js`:
   ```js
   weatherApiKey: 'your-key-here'
   ```
3. Without a key, demo values (32°C, 55% RH) are used.

## Project Structure

```
WaterTech-mvp/
├── index.html
├── css/styles.css
├── js/
│   ├── config.js
│   ├── demo-data.js
│   ├── triangulation.js
│   ├── weather.js
│   └── app.js
├── docs/
│   ├── SYSTEM_ARCHITECTURE.md
│   └── PRD.md
└── README.md
```

## Documentation

- **System Architecture**: `docs/SYSTEM_ARCHITECTURE.md`
- **Product Requirements**: `docs/PRD.md`

## MVP Scope

- Multi-role login (Asset Owner / GIAS Admin)
- Simulation mode (clean + malicious)
- Data triangulation (Greywater: kWh vs volume; AWG: production vs weather)
- Audit trail UI
- Weather API integration (UAE)
- Demo data (no backend/DB)
