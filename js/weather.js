/**
 * WaterTech dMRV — Weather API (UAE)
 * Uses WeatherAPI.com free tier — sign up at weatherapi.com for API key
 * Fallback: demo values for Dubai
 */

const WEATHER_CONFIG = {
  apiKey: typeof CONFIG !== 'undefined' ? CONFIG.weatherApiKey : '',
  baseUrl: 'https://api.weatherapi.com/v1/current.json',
  defaultLocation: 'Dubai' // UAE
};

async function fetchUAEWeather(location = WEATHER_CONFIG.defaultLocation) {
  if (WEATHER_CONFIG.apiKey) {
    try {
      const url = `${WEATHER_CONFIG.baseUrl}?key=${WEATHER_CONFIG.apiKey}&q=${encodeURIComponent(location)}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        return {
          temp_c: data.current.temp_c,
          humidity: data.current.humidity,
          condition: data.current.condition?.text || 'N/A',
          location: data.location?.name || location
        };
      }
    } catch (e) {
      console.warn('Weather API error:', e);
    }
  }

  // Demo fallback — typical UAE values
  return {
    temp_c: 32,
    humidity: 55,
    condition: 'Partly cloudy',
    location: 'Dubai (demo)'
  };
}
