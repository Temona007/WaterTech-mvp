/**
 * WaterTech dMRV — Data Triangulation Logic
 * Cross-references reported data with physics to detect fraud
 */

const TRIANGULATION = {
  /**
   * Greywater: Volume vs kWh (pump efficiency)
   * expected_kWh = volume * pump_specific_energy
   * Flag if |actual - expected| / expected > 15%
   */
  greywater(reading, asset) {
    const { volume, kWh } = reading;
    const pumpEfficiency = asset.pumpEfficiency || 0.85;
    const expectedKwh = volume * pumpEfficiency;
    const diff = Math.abs(kWh - expectedKwh) / expectedKwh;
    const passed = diff <= 0.15;

    return {
      result: passed ? 'VERIFIED' : 'FLAGGED',
      expectedKwh,
      actualKwh: kWh,
      diffPercent: diff * 100,
      threshold: 15,
      formula: 'expected_kWh = volume × pump_efficiency',
      details: passed
        ? `Within tolerance (${diff.toFixed(1)}% < 15%)`
        : `SUSPICIOUS: ${diff.toFixed(1)}% deviation — possible meter tampering`
    };
  },

  /**
   * AWG: Production vs Temp/Humidity (physics)
   * max_yield = device_coeff * f(T, RH)
   * Flag if reported > max_yield * 1.1
   */
  awg(reading, asset, weather) {
    const { production } = reading;
    const temp = weather?.temp_c ?? reading.temp ?? 30;
    const humidity = (weather?.humidity ?? reading.humidity ?? 50) / 100;
    const coeff = asset.deviceCoeff || 0.12;
    const maxYield = coeff * temp * humidity * 10;
    const ratio = production / maxYield;
    const passed = ratio <= 1.1;

    return {
      result: passed ? 'VERIFIED' : 'BLOCKED',
      maxYield,
      reported: production,
      temp,
      humidity: humidity * 100,
      ratio,
      formula: 'max_yield = f(T, RH)',
      details: passed
        ? `Within physics limit (${(ratio * 100).toFixed(0)}% of max)`
        : `FRAUD: ${(ratio * 100).toFixed(0)}% of theoretical max — BLOCKED`
    };
  }
};

function runTriangulation(reading, asset, weather = null) {
  if (reading.type === 'greywater') {
    return TRIANGULATION.greywater(reading, asset);
  }
  if (reading.type === 'awg') {
    return TRIANGULATION.awg(reading, asset, weather);
  }
  return { result: 'UNKNOWN', details: 'Unknown asset type' };
}
