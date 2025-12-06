/**
 * Maps OpenWeather icon codes to Meteocons icon names
 * Reference: https://openweathermap.org/weather-conditions
 */
export const WEATHER_ICON_MAP: Record<string, string> = {
  // Clear sky
  "01d": "clear-day", // clear sky day
  "01n": "clear-night", // clear sky night

  // Few clouds
  "02d": "partly-cloudy-day", // few clouds day
  "02n": "partly-cloudy-night", // few clouds night

  // Scattered clouds
  "03d": "cloudy", // scattered clouds
  "03n": "cloudy", // scattered clouds

  // Broken clouds
  "04d": "cloudy", // broken clouds
  "04n": "cloudy", // broken clouds

  // Shower rain
  "09d": "rain", // shower rain
  "09n": "rain", // shower rain

  // Rain
  "10d": "rain", // rain day
  "10n": "rain", // rain night

  // Thunderstorm
  "11d": "thunderstorms", // thunderstorm
  "11n": "thunderstorms", // thunderstorm

  // Snow
  "13d": "snow", // snow
  "13n": "snow", // snow

  // Mist
  "50d": "fog", // mist
  "50n": "fog", // mist
};

/**
 * Get Meteocons icon name from OpenWeather icon code
 */
export function getMeteoconsIcon(openWeatherIcon: string | undefined): string {
  if (!openWeatherIcon) return "clear-day";
  return WEATHER_ICON_MAP[openWeatherIcon] || "clear-day";
}

