import { useState, useEffect } from "react";
import { View, Text } from "react-native";
import * as Location from "expo-location";
import { getWeather } from "./weatherAPI";
import { WeatherResponse, LocationCoords } from "./weatherTypes";
import { WeatherWidget } from "./WeatherWidget";
import { ForecastWidget } from "./ForecastWidget";
import { WeatherDetailsWidget } from "./WeatherDetailsWidget";
import { useTheme } from "@/stores/theme-store";

export function WeatherContainer() {
  const { colorScheme } = useTheme();
  const isDark = colorScheme === "dark";
  const [location, setLocation] = useState<LocationCoords | null>(null);
  const [locationPermission, setLocationPermission] = useState<
    "granted" | "denied" | "loading"
  >("loading");
  const [weatherData, setWeatherData] = useState<WeatherResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [cityName, setCityName] = useState<string>("Konum");

  // Request location permission and get coordinates
  useEffect(() => {
    async function requestLocationPermission() {
      try {
        // Check if permission already granted
        const { status: existingStatus } = await Location.getForegroundPermissionsAsync();
        let finalStatus = existingStatus;

        // Request permission if not granted
        if (existingStatus !== "granted") {
          const { status } = await Location.requestForegroundPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== "granted") {
          setLocationPermission("denied");
          setLoading(false);
          return;
        }

        setLocationPermission("granted");
        
        // Get current position with high accuracy
        const locationResult = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
          maximumAge: 60000, // Accept cached location up to 1 minute old
        });

        const coords: LocationCoords = {
          latitude: locationResult.coords.latitude,
          longitude: locationResult.coords.longitude,
        };

        console.log("📍 Konum alındı:", coords.latitude, coords.longitude);
        setLocation(coords);

        // Try to get city name from reverse geocoding
        try {
          const reverseGeocode = await Location.reverseGeocodeAsync(coords);
          if (reverseGeocode && reverseGeocode.length > 0) {
            const city =
              reverseGeocode[0].city ||
              reverseGeocode[0].subAdministrativeArea ||
              reverseGeocode[0].administrativeArea ||
              "Konum";
            setCityName(city);
          }
        } catch (error) {
          console.error("Error getting city name:", error);
        }
      } catch (error) {
        console.error("Error requesting location:", error);
        setLocationPermission("denied");
        setLoading(false);
      }
    }

    requestLocationPermission();
  }, []);

  // Fetch weather data when location is available
  useEffect(() => {
    if (!location) return;

    async function fetchWeatherData() {
      setLoading(true);
      try {
        const weather = await getWeather(location);

        if (weather) {
          setWeatherData(weather);
        }
      } catch (error) {
        console.error("Error fetching weather data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchWeatherData();
  }, [location]);

  // Show permission denied message
  if (locationPermission === "denied") {
    return (
      <View className={`rounded-2xl p-4 shadow-sm border ${isDark ? "bg-card-dark border-border-dark" : "bg-card border-border"}`}>
        <Text className={`text-sm text-center ${isDark ? "text-muted-foreground-dark" : "text-muted-foreground"}`}>
          Konum izni gerekli
        </Text>
      </View>
    );
  }

  // Show loading state
  if (loading || !weatherData) {
    return (
      <View>
        <View className="mb-3">
          <WeatherWidget weather={null} cityName={cityName} loading={true} />
        </View>
        <View className="mb-3">
          <ForecastWidget forecast={null} loading={true} />
        </View>
        <View className="mb-3">
          <WeatherDetailsWidget
            windSpeed={0}
            pressure={null}
            uvi={null}
            loading={true}
          />
        </View>
      </View>
    );
  }

  return (
    <View>
      <View className="mb-3">
        <WeatherWidget
          weather={weatherData.current}
          cityName={cityName}
          loading={false}
        />
      </View>
      <View className="mb-3">
        <ForecastWidget
          forecast={weatherData.daily}
          currentWeather={weatherData.current}
          loading={false}
        />
      </View>
      <View className="mb-3">
        <WeatherDetailsWidget
          windSpeed={weatherData.current.wind_speed}
          pressure={weatherData.current.pressure}
          feelsLike={weatherData.current.feels_like}
          date={new Date()}
          loading={false}
        />
      </View>
    </View>
  );
}

