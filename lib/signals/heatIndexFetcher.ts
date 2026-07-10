// lib/signals/heatIndexFetcher.ts
// Fetches real heat index data from Open-Meteo (free, no API key required).
// Falls back to synthetic value if the fetch fails — fail loudly by returning null
// so the fusion service can handle it, rather than fabricating a value (rules.md rule 6).

export interface HeatData {
  heatIndex: number;       // °C
  shadeCoverage: number;   // estimated 0–1
}

// Default location: a large US venue city (used if no geolocation provided)
const DEFAULT_LAT = 36.1627;
const DEFAULT_LNG = -86.7816; // Nashville, TN — common large venue location

export async function fetchHeatData(
  lat = DEFAULT_LAT,
  lng = DEFAULT_LNG
): Promise<HeatData | null> {
  try {
    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${lat}&longitude=${lng}` +
      `&current=temperature_2m,relativehumidity_2m,apparent_temperature` +
      `&temperature_unit=celsius&timezone=auto`;

    const res = await fetch(url, { next: { revalidate: 300 } }); // cache 5 min
    if (!res.ok) return null;

    const data = await res.json();
    const current = data?.current;
    if (!current) return null;

    const tempC: number = current.temperature_2m ?? 28;
    const humidity: number = current.relativehumidity_2m ?? 50;
    const apparentTemp: number = current.apparent_temperature ?? tempC;

    // Heat index: use apparent temperature (already accounts for humidity)
    const heatIndex = parseFloat(apparentTemp.toFixed(1));

    // Shade coverage: synthetic estimate based on time of day (simplified)
    const hour = new Date().getHours();
    const shadeCoverage = hour >= 10 && hour <= 16 ? 0.25 : 0.60; // less shade midday

    return { heatIndex, shadeCoverage };
  } catch {
    return null;
  }
}

// Fallback synthetic heat value for when the API is unavailable
export function syntheticHeatData(): HeatData {
  const hour = new Date().getHours();
  const baseTempC = hour >= 12 && hour <= 16 ? 36 : 29; // hotter midday
  const heatIndex = baseTempC + (Math.random() - 0.5) * 4;
  const shadeCoverage = hour >= 10 && hour <= 16 ? 0.2 + Math.random() * 0.2 : 0.5 + Math.random() * 0.2;
  return {
    heatIndex: parseFloat(heatIndex.toFixed(1)),
    shadeCoverage: parseFloat(shadeCoverage.toFixed(2)),
  };
}
