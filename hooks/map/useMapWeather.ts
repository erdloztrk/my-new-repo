/**
 * Hook for managing weather data on the map.
 * Fetches weather when location is available.
 */

import { useState, useEffect } from "react";
import * as Location from "expo-location";
import { getWeather } from "@/components/weather/weatherAPI";
import type { CurrentWeather, WeatherResponse } from "@/components/weather/weatherTypes";

interface UseMapWeatherResult {
  weather: CurrentWeather | null;
  forecastList: WeatherResponse["forecastList"];
  loading: boolean;
}

export function useMapWeather(
  location: Location.LocationObject | null
): UseMapWeatherResult {
  const [weather, setWeather] = useState<CurrentWeather | null>(null);
  const [forecastList, setForecastList] = useState<WeatherResponse["forecastList"]>(undefined);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!location) {
      setWeather(null);
      setForecastList(undefined);
      return;
    }

    setLoading(true);
    getWeather({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    })
      .then((weatherData) => {
        if (weatherData) {
          setWeather(weatherData.current);
          setForecastList(weatherData.forecastList);
        }
      })
      .catch((error) => {
        console.error("Error loading weather:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [location]);

  return {
    weather,
    forecastList,
    loading,
  };
}

