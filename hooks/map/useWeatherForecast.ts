/**
 * Hook for fetching weather forecast for a specific location.
 */

import { useState, useEffect } from "react";
import { getWeather } from "@/components/weather/weatherAPI";
import type { WeatherResponse } from "@/components/weather/weatherTypes";
import { logError } from "@/lib/logger";

interface UseWeatherForecastOptions {
  coordinate: { latitude: number; longitude: number } | null;
  enabled: boolean;
}

interface UseWeatherForecastResult {
  weatherData: WeatherResponse | null;
  loading: boolean;
  error: string | null;
}

export function useWeatherForecast({
  coordinate,
  enabled,
}: UseWeatherForecastOptions): UseWeatherForecastResult {
  const [weatherData, setWeatherData] = useState<WeatherResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !coordinate) {
      setWeatherData(null);
      setError(null);
      return;
    }

    const fetchForecast = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await getWeather(coordinate);
        if (data) {
          setWeatherData(data);
        } else {
          setError("Hava durumu verisi alınamadı");
        }
      } catch (err) {
        logError("[useWeatherForecast] Error:", err);
        setError(err instanceof Error ? err.message : "Bilinmeyen hata");
      } finally {
        setLoading(false);
      }
    };

    fetchForecast();
  }, [enabled, coordinate?.latitude, coordinate?.longitude]);

  return {
    weatherData,
    loading,
    error,
  };
}

