import type * as Location from "expo-location";
import type { ShoreType } from "@/components/weather/fishProfiles";

interface ReverseGeocodeLike {
  name?: string | null;
  street?: string | null;
  district?: string | null;
  region?: string | null;
  city?: string | null;
  subregion?: string | null;
}

function containsAny(haystack: string, needles: string[]): boolean {
  const h = haystack.toLowerCase();
  return needles.some((n) => h.includes(n));
}

export function inferShoreTypeFromReverseGeocode(
  address: ReverseGeocodeLike | Location.LocationGeocodedAddress | null | undefined
): ShoreType {
  if (!address) return "unknown";

  const text = [
    address.name,
    address.street,
    address.district,
    address.subregion,
    address.city,
    address.region,
  ]
    .filter(Boolean)
    .join(" | ");

  if (!text) return "unknown";

  // Heuristic keywords (TR + common EN)
  if (containsAny(text, ["plaj", "kumsal", "sahil", "beach"])) return "beach";
  if (containsAny(text, ["iskele", "rıhtım", "liman", "marina", "port", "pier", "harbour", "harbor"]))
    return "pier";
  if (containsAny(text, ["kayalık", "falez", "cliff", "rock"])) return "rocky";

  return "unknown";
}


