import { WeatherResponse, AirQuality, LocationCoords, CurrentWeather, DailyForecast } from "./weatherTypes";
import { logWarn, logError } from "@/lib/logger";

const OPENWEATHER_API_KEY = process.env.EXPO_PUBLIC_OPENWEATHER_KEY;
// Using free tier compatible APIs
const BASE_URL_CURRENT = "https://api.openweathermap.org/data/2.5/weather";
const BASE_URL_FORECAST = "https://api.openweathermap.org/data/2.5/forecast";
const BASE_URL_AIR_POLLUTION = "https://api.openweathermap.org/data/2.5/air_pollution";
// Open-Meteo Marine API - Free and open source
// Using the marine-specific API endpoint
const BASE_URL_MARINE = "https://marine-api.open-meteo.com/v1/marine";

if (!OPENWEATHER_API_KEY) {
  logWarn("EXPO_PUBLIC_OPENWEATHER_KEY is not set. Weather features will not work.");
}

/**
 * Get current weather and forecast data using free tier APIs
 */
export async function getWeather(
  coords: LocationCoords
): Promise<WeatherResponse | null> {
  if (!OPENWEATHER_API_KEY) {
    return null;
  }

  try {
    // Fetch current weather
    const currentUrl = `${BASE_URL_CURRENT}?lat=${coords.latitude}&lon=${coords.longitude}&units=metric&lang=tr&appid=${OPENWEATHER_API_KEY}`;
    const currentResponse = await fetch(currentUrl);

    if (!currentResponse.ok) {
      logError("Current weather API error:", currentResponse.status);
      throw new Error(`Weather API error: ${currentResponse.status}`);
    }

    const currentData = await currentResponse.json();

    // Fetch 5-day forecast (3-hour intervals)
    const forecastUrl = `${BASE_URL_FORECAST}?lat=${coords.latitude}&lon=${coords.longitude}&units=metric&lang=tr&appid=${OPENWEATHER_API_KEY}`;
    const forecastResponse = await fetch(forecastUrl);

    if (!forecastResponse.ok) {
      logError("Forecast API error:", forecastResponse.status);
      throw new Error(`Forecast API error: ${forecastResponse.status}`);
    }

    const forecastData = await forecastResponse.json();

    // Calculate UV Index based on time of day and weather conditions
    // OpenWeather Current Weather API doesn't provide UV Index in free tier
    // So we estimate it based on time, weather, and cloud coverage
    const calculateUVIndex = (): number => {
      const now = new Date(currentData.dt * 1000);
      const hours = now.getHours();
      const weatherMain = currentData.weather[0]?.main?.toLowerCase() || "";
      const clouds = currentData.clouds?.all || 0;
      
      // UV Index is highest around noon (12:00-14:00)
      let baseUV = 0;
      if (hours >= 6 && hours <= 18) {
        // Daytime: calculate based on hour (peak at 12:00)
        const hourFromNoon = Math.abs(hours - 12);
        baseUV = Math.max(0, 8 - hourFromNoon * 0.8);
      }
      
      // Adjust for weather conditions
      if (weatherMain.includes("clear") || weatherMain.includes("sun")) {
        baseUV *= 1.0; // Full sun
      } else if (weatherMain.includes("cloud")) {
        baseUV *= (1 - clouds / 200); // Reduce based on cloud coverage
      } else if (weatherMain.includes("rain") || weatherMain.includes("storm")) {
        baseUV *= 0.3; // Heavy clouds/rain
      } else {
        baseUV *= 0.6; // Other conditions
      }
      
      return Math.round(Math.max(0, Math.min(11, baseUV)));
    };

    // Fetch marine data from Open-Meteo (free API)
    let seaTemperature: number | undefined = undefined;
    let waveHeight: number | undefined = undefined;
    
    try {
      // Open-Meteo Marine API endpoint
      // Try different API endpoints and parameters
      let marineResponse: Response | null = null;
      let marineData: any = null;
      
      // Try 1: Standard marine API with forecast_days
      try {
        const marineUrl1 = `${BASE_URL_MARINE}?latitude=${coords.latitude}&longitude=${coords.longitude}&hourly=sea_surface_temperature,wave_height&forecast_days=1&timezone=auto`;
        marineResponse = await fetch(marineUrl1);
        if (marineResponse && marineResponse.ok) {
          marineData = await marineResponse.json();
        }
      } catch {
        // Continue to next attempt
      }
      
      // Try 2: Without forecast_days
      if (!marineResponse || !marineResponse.ok) {
        try {
          const marineUrl2 = `${BASE_URL_MARINE}?latitude=${coords.latitude}&longitude=${coords.longitude}&hourly=sea_surface_temperature,wave_height&timezone=auto`;
          marineResponse = await fetch(marineUrl2);
          if (marineResponse && marineResponse.ok) {
            marineData = await marineResponse.json();
          }
        } catch {
          // Continue to next attempt
        }
      }
      
      // Try 3: Alternative endpoint (forecast API)
      if (!marineResponse || !marineResponse.ok) {
        try {
          const marineUrl3 = `https://api.open-meteo.com/v1/marine?latitude=${coords.latitude}&longitude=${coords.longitude}&hourly=sea_surface_temperature,wave_height&timezone=auto`;
          marineResponse = await fetch(marineUrl3);
          if (marineResponse && marineResponse.ok) {
            marineData = await marineResponse.json();
          }
        } catch {
          // Continue gracefully - marine data is optional
        }
      }
      
      if (marineResponse && marineResponse.ok && marineData) {
        // Get current hour's data (or nearest available)
        if (marineData.hourly && marineData.hourly.time && marineData.hourly.time.length > 0) {
          const now = new Date();
          
          // Find the closest time index to current time
          let closestIndex = 0;
          let minDiff = Infinity;
          
          marineData.hourly.time.forEach((timeStr: string, index: number) => {
            const time = new Date(timeStr);
            const diff = Math.abs(time.getTime() - now.getTime());
            if (diff < minDiff) {
              minDiff = diff;
              closestIndex = index;
            }
          });
          
          // Get sea surface temperature (Open-Meteo returns in Celsius)
          const rawSeaTemp = marineData.hourly.sea_surface_temperature?.[closestIndex];
          
          if (
            rawSeaTemp !== null &&
            rawSeaTemp !== undefined &&
            !isNaN(rawSeaTemp) &&
            rawSeaTemp > -50 && // Reasonable temperature range
            rawSeaTemp < 50
          ) {
            seaTemperature = Math.round(rawSeaTemp * 10) / 10; // Round to 1 decimal
          }
          
          // Get wave height (in meters)
          const rawWaveHeight = marineData.hourly.wave_height?.[closestIndex];
          
          if (
            marineData.hourly.wave_height && 
            rawWaveHeight !== null &&
            rawWaveHeight !== undefined &&
            !isNaN(rawWaveHeight) &&
            rawWaveHeight >= 0
          ) {
            // Accept all non-negative values, including 0 (calm sea)
            // Round to 1 decimal place
            waveHeight = Math.round(rawWaveHeight * 10) / 10;
          }
        }
      }
      // If all attempts fail, continue gracefully - marine data is optional
    } catch {
      // Continue without marine data - it's optional
    }

    // Transform to match WeatherResponse interface
    const current: CurrentWeather = {
      dt: currentData.dt,
      temp: currentData.main.temp,
      feels_like: currentData.main.feels_like,
      humidity: currentData.main.humidity,
      wind_speed: currentData.wind?.speed || 0,
      wind_deg: currentData.wind?.deg, // Wind direction in degrees
      pressure: currentData.main.pressure,
      uvi: currentData.uvi || calculateUVIndex(), // Use API value if available, otherwise calculate
      weather: currentData.weather,
      sunrise: currentData.sys.sunrise,
      sunset: currentData.sys.sunset,
      seaTemperature,
      waveHeight,
    };

    // Group forecast by day and get daily min/max
    const dailyMap = new Map<number, { temps: number[]; weather: any; dt: number }>();
    
    forecastData.list.forEach((item: any) => {
      const date = new Date(item.dt * 1000);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
      
      if (!dailyMap.has(dayStart)) {
        dailyMap.set(dayStart, { temps: [], weather: item.weather[0], dt: item.dt });
      }
      dailyMap.get(dayStart)!.temps.push(item.main.temp);
    });

    // Sort by date to ensure chronological order
    const sortedDaily = Array.from(dailyMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([_, data]) => ({
        dt: data.dt,
        temp: {
          min: Math.min(...data.temps),
          max: Math.max(...data.temps),
        },
        weather: [data.weather],
      }));

    // Get all available days (API provides 5 days forecast)
    const daily: DailyForecast[] = sortedDaily.slice(0, 7); // Take up to 7 days

    const response: WeatherResponse = {
      current,
      daily,
      timezone: forecastData.city.timezone.toString(),
      timezone_offset: forecastData.city.timezone,
      forecastList: forecastData.list, // Include raw forecast list for hourly processing
    };

    return response;
  } catch (error) {
    logError("Error fetching weather:", error);
    return null;
  }
}

/**
 * Get air quality (AQI) data
 */
export async function getAQI(
  coords: LocationCoords
): Promise<AirQuality | null> {
  if (!OPENWEATHER_API_KEY) {
    return null;
  }

  try {
    const url = `${BASE_URL_AIR_POLLUTION}?lat=${coords.latitude}&lon=${coords.longitude}&appid=${OPENWEATHER_API_KEY}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Air Quality API error: ${response.status}`);
    }

    const data: AirQuality = await response.json();
    return data;
  } catch (error) {
    logError("Error fetching air quality:", error);
    return null;
  }
}

/**
 * Get forecast data (next 3 days)
 */
export async function getForecast(
  coords: LocationCoords
): Promise<WeatherResponse | null> {
  // Forecast is included in the onecall response
  return getWeather(coords);
}

