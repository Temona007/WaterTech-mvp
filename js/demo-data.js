/**
 * WaterTech dMRV — Demo Data
 * In production, this would come from API/DB
 */

const DEMO_ASSETS = [
  {
    id: 'asset-1',
    name: 'Burj Al Arab — Greywater',
    type: 'greywater',
    location: 'Dubai, UAE',
    ownerId: 'owner-1',
    pumpEfficiency: 0.85, // kWh per m³
    lastReading: null,
    status: 'pending'
  },
  {
    id: 'asset-2',
    name: 'Emirates Palace — AWG',
    type: 'awg',
    location: 'Abu Dhabi, UAE',
    ownerId: 'owner-1',
    deviceCoeff: 0.12, // L/day per (temp * humidity factor)
    lastReading: null,
    status: 'pending'
  },
  {
    id: 'asset-3',
    name: 'Jumeirah Beach — Greywater',
    type: 'greywater',
    location: 'Dubai, UAE',
    ownerId: 'owner-2',
    pumpEfficiency: 0.82,
    lastReading: null,
    status: 'pending'
  }
];

const DEMO_READINGS = [];

const DEMO_AUDIT = [];

// Generate initial demo readings (clean)
function generateCleanReadings() {
  const now = Date.now();
  const readings = [];
  const audit = [];

  DEMO_ASSETS.forEach((asset, i) => {
    if (asset.type === 'greywater') {
      const volume = 10 + Math.random() * 20;
      const expectedKwh = volume * asset.pumpEfficiency;
      const actualKwh = expectedKwh * (0.95 + Math.random() * 0.1);
      const diff = Math.abs(actualKwh - expectedKwh) / expectedKwh;
      const result = diff <= 0.15 ? 'VERIFIED' : 'FLAGGED';

      readings.push({
        id: `r-${i}-${now}`,
        assetId: asset.id,
        timestamp: new Date(now - i * 60000).toISOString(),
        volume,
        kWh: actualKwh,
        type: 'greywater'
      });

      audit.push({
        id: `a-${i}-${now}`,
        timestamp: new Date(now - i * 60000).toISOString(),
        assetId: asset.id,
        assetName: asset.name,
        result,
        inputs: { volume, kWh: actualKwh, expectedKwh },
        formula: 'expected_kWh = volume × pump_efficiency',
        details: `Diff: ${(diff * 100).toFixed(1)}% (threshold 15%)`
      });
    } else {
      const temp = 28 + Math.random() * 8;
      const humidity = 45 + Math.random() * 25;
      const maxYield = asset.deviceCoeff * temp * (humidity / 100) * 10;
      const reported = maxYield * (0.7 + Math.random() * 0.3);
      const result = reported <= maxYield * 1.1 ? 'VERIFIED' : 'FLAGGED';

      readings.push({
        id: `r-${i}-${now}`,
        assetId: asset.id,
        timestamp: new Date(now - i * 60000).toISOString(),
        production: reported,
        temp,
        humidity,
        type: 'awg'
      });

      audit.push({
        id: `a-${i}-${now}`,
        timestamp: new Date(now - i * 60000).toISOString(),
        assetId: asset.id,
        assetName: asset.name,
        result,
        inputs: { production: reported, temp, humidity, maxYield },
        formula: 'max_yield = f(T, RH)',
        details: `Reported ${reported.toFixed(1)}L vs max ${maxYield.toFixed(1)}L`
      });
    }
  });

  return { readings, audit };
}

// Generate malicious readings (intentionally fail triangulation)
function generateMaliciousReadings() {
  const now = Date.now();
  const readings = [];
  const audit = [];

  DEMO_ASSETS.forEach((asset, i) => {
    if (asset.type === 'greywater') {
      const volume = 50;
      const expectedKwh = volume * asset.pumpEfficiency;
      const actualKwh = expectedKwh * 0.3; // Way too low — suspicious
      const diff = Math.abs(actualKwh - expectedKwh) / expectedKwh;
      const result = 'FLAGGED';

      readings.push({
        id: `r-m-${i}-${now}`,
        assetId: asset.id,
        timestamp: new Date(now - i * 30000).toISOString(),
        volume,
        kWh: actualKwh,
        type: 'greywater'
      });

      audit.push({
        id: `a-m-${i}-${now}`,
        timestamp: new Date(now - i * 30000).toISOString(),
        assetId: asset.id,
        assetName: asset.name,
        result,
        inputs: { volume, kWh: actualKwh, expectedKwh },
        formula: 'expected_kWh = volume × pump_efficiency',
        details: `SUSPICIOUS: kWh ${(diff * 100).toFixed(0)}% below expected — possible meter tampering`
      });
    } else {
      const temp = 25;
      const humidity = 40;
      const maxYield = asset.deviceCoeff * temp * (humidity / 100) * 10;
      const reported = maxYield * 2.5; // Impossible — 2.5x theoretical max
      const result = 'BLOCKED';

      readings.push({
        id: `r-m-${i}-${now}`,
        assetId: asset.id,
        timestamp: new Date(now - i * 30000).toISOString(),
        production: reported,
        temp,
        humidity,
        type: 'awg'
      });

      audit.push({
        id: `a-m-${i}-${now}`,
        timestamp: new Date(now - i * 30000).toISOString(),
        assetId: asset.id,
        assetName: asset.name,
        result,
        inputs: { production: reported, temp, humidity, maxYield },
        formula: 'max_yield = f(T, RH)',
        details: `FRAUD: Reported ${reported.toFixed(0)}L exceeds max ${maxYield.toFixed(0)}L — BLOCKED`
      });
    }
  });

  return { readings, audit };
}
