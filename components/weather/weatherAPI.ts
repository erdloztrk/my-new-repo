import { WeatherResponse, AirQuality, LocationCoords, CurrentWeather, DailyForecast } from "./weatherTypes";

const OPENWEATHER_API_KEY = process.env.EXPO_PUBLIC_OPENWEATHER_KEY;
// Using free tier compatible APIs
const BASE_URL_CURRENT = "https://api.openweathermap.org/data/2.5/weather";
const BASE_URL_FORECAST = "https://api.openweathermap.org/data/2.5/forecast";
const BASE_URL_AIR_POLLUTION = "https://api.openweathermap.org/data/2.5/air_pollution";

if (!OPENWEATHER_API_KEY) {
  console.warn(
    "EXPO_PUBLIC_OPENWEATHER_KEY is not set. Weather features will not work."
  );
} else {
  console.log("OpenWeather API key loaded:", OPENWEATHER_API_KEY.substring(0, 8) + "...");
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
      const errorText = await currentResponse.text();
      console.error("Current weather API error:", currentResponse.status, errorText);
      throw new Error(`Weather API error: ${currentResponse.status}`);
    }

    const currentData = await currentResponse.json();

    // Fetch 5-day forecast (3-hour intervals)
    const forecastUrl = `${BASE_URL_FORECAST}?lat=${coords.latitude}&lon=${coords.longitude}&units=metric&lang=tr&appid=${OPENWEATHER_API_KEY}`;
    const forecastResponse = await fetch(forecastUrl);

    if (!forecastResponse.ok) {
      const errorText = await forecastResponse.text();
      console.error("Forecast API error:", forecastResponse.status, errorText);
      throw new Error(`Forecast API error: ${forecastResponse.status}`);
    }

    const forecastData = await forecastResponse.json();

    // Transform to match WeatherResponse interface
    const current: CurrentWeather = {
      dt: currentData.dt,
      temp: currentData.main.temp,
      feels_like: currentData.main.feels_like,
      humidity: currentData.main.humidity,
      wind_speed: currentData.wind?.speed || 0,
      pressure: currentData.main.pressure,
      uvi: currentData.uvi, // UV Index (may not be available in free tier)
      weather: currentData.weather,
      sunrise: currentData.sys.sunrise,
      sunset: currentData.sys.sunset,
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

    // Get all available days (API provides 5 days, but we group by day)
    // We need at least 6 days for 7-day forecast (today + 6 more)
    const daily: DailyForecast[] = Array.from(dailyMap.values())
      .slice(0, 6) // Take 6 days from forecast (today will be added separately if needed)
      .map((data) => ({
        dt: data.dt,
        temp: {
          min: Math.min(...data.temps),
          max: Math.max(...data.temps),
        },
        weather: [data.weather],
      }));

    const response: WeatherResponse = {
      current,
      daily,
      timezone: forecastData.city.timezone.toString(),
      timezone_offset: forecastData.city.timezone,
    };

    return response;
  } catch (error) {
    console.error("Error fetching weather:", error);
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
    console.error("Error fetching air quality:", error);
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

