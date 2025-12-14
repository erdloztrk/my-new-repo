"""
Species-based depth scoring algorithm with weather and time factors.
"""

from dataclasses import dataclass
from typing import Optional, Dict, Any
import json
from pathlib import Path
from datetime import datetime
import math


@dataclass
class SpeciesProfile:
    """Species depth preferences."""
    id: str
    name_tr: str
    name_en: str
    preferred_depth_range: tuple[float, float]  # (min, max) in meters
    optimal_band: tuple[float, float]  # (min, max) in meters (narrower, best zone)
    penalty_curve: str = "quadratic"  # "linear", "quadratic", "exponential"
    # TODO: season_adjustments, tide_preferences, etc.


@dataclass
class ScoreResult:
    """Scoring result."""
    score: float  # 0-100
    zone: str  # "shallow", "optimal", "deep", "land"
    reasons: list["ScoreReason"]
    depth_score: float = 0.0  # Base depth score (0-100)
    weather_score: float = 0.0  # Weather contribution (0-100)
    time_score: float = 0.0  # Time of day contribution (0-100)


@dataclass
class ScoreReason:
    """Reason for score."""
    type: str
    message: str


class DepthScorer:
    """Score depth for a species."""
    
    def __init__(self, profile: SpeciesProfile):
        self.profile = profile
    
    def score(self, depth_m: float, weather: Optional[Dict[str, Any]] = None, current_time: Optional[int] = None) -> ScoreResult:
        """
        Score depth with weather and time factors (0-100).
        
        Args:
            depth_m: Depth in meters (negative = below sea level)
            weather: Optional weather data dict with keys: seaTemperature, windSpeed, waveHeight, pressure, uvi
            current_time: Optional Unix timestamp for time of day calculation
        
        Returns:
            ScoreResult with combined score, zone, and reasons
        """
        reasons: list[ScoreReason] = []
        
        # Handle land (positive depth)
        if depth_m >= 0:
            return ScoreResult(
                score=0.0,
                zone="land",
                reasons=[
                    ScoreReason(
                        type="land",
                        message=f"Point is on land (elevation {depth_m:.1f}m). Not suitable for fishing."
                    )
                ],
                depth_score=0.0,
                weather_score=0.0,
                time_score=0.0
            )
        
        # Calculate base depth score
        depth_result = self._score_depth_only(depth_m)
        depth_score = depth_result.score
        zone = depth_result.zone
        reasons.extend(depth_result.reasons)
        
        # Calculate weather score (0-100)
        weather_score = 100.0
        if weather:
            weather_score, weather_reasons = self._score_weather(weather)
            reasons.extend(weather_reasons)
        else:
            weather_score = 50.0  # Neutral if no weather data
        
        # Calculate time score (0-100)
        time_score = 100.0
        if current_time:
            time_score, time_reasons = self._score_time_of_day(current_time)
            reasons.extend(time_reasons)
        else:
            time_score = 50.0  # Neutral if no time data
        
        # Combine scores: 60% depth, 25% weather, 15% time
        combined_score = (depth_score * 0.60) + (weather_score * 0.25) + (time_score * 0.15)
        combined_score = max(0.0, min(100.0, combined_score))  # Clamp to 0-100
        
        return ScoreResult(
            score=round(combined_score, 1),
            zone=zone,
            reasons=reasons,
            depth_score=round(depth_score, 1),
            weather_score=round(weather_score, 1),
            time_score=round(time_score, 1)
        )
    
    def _score_depth_only(self, depth_m: float) -> ScoreResult:
        """Calculate depth-only score (original logic)."""
        reasons: list[ScoreReason] = []
        
        # Convert to positive depth (below sea level)
        depth_positive = abs(depth_m)
        min_pref, max_pref = self.profile.preferred_depth_range
        min_opt, max_opt = self.profile.optimal_band
        
        # Determine zone
        if depth_positive < min_pref:
            zone = "shallow"
            reasons.append(ScoreReason(
                type="depth",
                message=f"Derinlik -{depth_positive:.1f}m tercih edilen aralıktan sığ (-{min_pref:.0f}m ile -{max_pref:.0f}m)."
            ))
        elif depth_positive > max_pref:
            zone = "deep"
            reasons.append(ScoreReason(
                type="depth",
                message=f"Derinlik -{depth_positive:.1f}m tercih edilen aralıktan derin (-{min_pref:.0f}m ile -{max_pref:.0f}m)."
            ))
        else:
            zone = "optimal"
            reasons.append(ScoreReason(
                type="depth",
                message=f"Derinlik -{depth_positive:.1f}m tercih edilen aralıkta (-{min_pref:.0f}m ile -{max_pref:.0f}m)."
            ))
        
        # Calculate score
        if min_opt <= depth_positive <= max_opt:
            score = 100.0
            reasons.append(ScoreReason(
                type="optimal_band",
                message=f"Derinlik -{depth_positive:.1f}m {self.profile.name_tr} için optimal bantta (-{min_opt:.0f}m ile -{max_opt:.0f}m)."
            ))
        elif depth_positive < min_opt:
            penalty_ratio = (min_opt - depth_positive) / (min_opt - min_pref) if min_opt > min_pref else 1.0
            penalty_ratio = min(penalty_ratio, 1.0)
            if self.profile.penalty_curve == "quadratic":
                penalty = penalty_ratio ** 2
            else:
                penalty = penalty_ratio
            score = max(0.0, 100.0 * (1.0 - penalty))
        else:
            penalty_ratio = (depth_positive - max_opt) / (max_pref - max_opt) if max_pref > max_opt else 1.0
            penalty_ratio = min(penalty_ratio, 1.0)
            if self.profile.penalty_curve == "quadratic":
                penalty = penalty_ratio ** 2
            else:
                penalty = penalty_ratio
            score = max(0.0, 100.0 * (1.0 - penalty))
        
        return ScoreResult(
            score=round(score, 1),
            zone=zone,
            reasons=reasons
        )
    
    def _score_weather(self, weather: Dict[str, Any]) -> tuple[float, list[ScoreReason]]:
        """Score weather conditions (0-100)."""
        reasons: list[ScoreReason] = []
        score = 100.0
        
        # Sea temperature (optimal: 15-25°C for most species)
        sea_temp = weather.get("seaTemperature")
        if sea_temp is not None:
            if 15 <= sea_temp <= 25:
                temp_score = 100.0
                reasons.append(ScoreReason(
                    type="weather",
                    message=f"Deniz sıcaklığı {sea_temp:.1f}°C optimal aralıkta (15-25°C)."
                ))
            elif sea_temp < 10 or sea_temp > 30:
                temp_score = 30.0
                reasons.append(ScoreReason(
                    type="weather",
                    message=f"Deniz sıcaklığı {sea_temp:.1f}°C uygun değil (optimal: 15-25°C)."
                ))
            else:
                # Linear penalty outside optimal range
                if sea_temp < 15:
                    temp_score = 30 + (sea_temp - 10) / 5 * 70
                else:
                    temp_score = 100 - (sea_temp - 25) / 5 * 70
                temp_score = max(30.0, min(100.0, temp_score))
            score = (score + temp_score) / 2
        
        # Wind speed (calm to moderate: 0-15 km/h optimal, >25 km/h negative)
        wind_speed = weather.get("windSpeed")
        if wind_speed is not None:
            wind_speed_kmh = wind_speed * 3.6  # m/s to km/h
            if wind_speed_kmh <= 15:
                wind_score = 100.0
                reasons.append(ScoreReason(
                    type="weather",
                    message=f"Rüzgar hızı {wind_speed_kmh:.1f} km/h uygun (sakin-orta)."
                ))
            elif wind_speed_kmh > 25:
                wind_score = 20.0
                reasons.append(ScoreReason(
                    type="weather",
                    message=f"Rüzgar hızı {wind_speed_kmh:.1f} km/h çok yüksek (optimal: <15 km/h)."
                ))
            else:
                wind_score = 100 - ((wind_speed_kmh - 15) / 10 * 80)
                wind_score = max(20.0, min(100.0, wind_score))
            score = (score + wind_score) / 2
        
        # Wave height (calm: <0.5m optimal, >2m negative)
        wave_height = weather.get("waveHeight")
        if wave_height is not None:
            if wave_height < 0.5:
                wave_score = 100.0
                reasons.append(ScoreReason(
                    type="weather",
                    message=f"Dalga yüksekliği {wave_height:.1f}m sakin (optimal: <0.5m)."
                ))
            elif wave_height > 2.0:
                wave_score = 20.0
                reasons.append(ScoreReason(
                    type="weather",
                    message=f"Dalga yüksekliği {wave_height:.1f}m çok yüksek (optimal: <0.5m)."
                ))
            else:
                wave_score = 100 - ((wave_height - 0.5) / 1.5 * 80)
                wave_score = max(20.0, min(100.0, wave_score))
            score = (score + wave_score) / 2
        
        # Pressure (stable: 1010-1020 hPa optimal, rapid changes negative)
        pressure = weather.get("pressure")
        if pressure is not None:
            if 1010 <= pressure <= 1020:
                pressure_score = 100.0
                reasons.append(ScoreReason(
                    type="weather",
                    message=f"Basınç {pressure:.0f} hPa stabil (optimal: 1010-1020 hPa)."
                ))
            elif pressure < 990 or pressure > 1040:
                pressure_score = 40.0
                reasons.append(ScoreReason(
                    type="weather",
                    message=f"Basınç {pressure:.0f} hPa aşırı (optimal: 1010-1020 hPa)."
                ))
            else:
                if pressure < 1010:
                    pressure_score = 40 + (pressure - 990) / 20 * 60
                else:
                    pressure_score = 100 - (pressure - 1020) / 20 * 60
                pressure_score = max(40.0, min(100.0, pressure_score))
            score = (score + pressure_score) / 2
        
        # UV index (indirect effect, moderate UV: 3-7 optimal)
        uvi = weather.get("uvi")
        if uvi is not None:
            if 3 <= uvi <= 7:
                uvi_score = 100.0
            elif uvi > 10:
                uvi_score = 60.0  # Very high UV can affect fish behavior
            else:
                uvi_score = 80.0  # Low or moderate UV is generally fine
            score = (score + uvi_score) / 2
        
        return round(score, 1), reasons
    
    def _score_time_of_day(self, current_time: int) -> tuple[float, list[ScoreReason]]:
        """Score time of day (0-100) based on species activity patterns."""
        reasons: list[ScoreReason] = []
        dt = datetime.fromtimestamp(current_time)
        hour = dt.hour
        minute = dt.minute
        time_decimal = hour + minute / 60.0
        
        # Species-specific active hours (general patterns for Mediterranean fish)
        # Most active: dawn (5-7), dusk (18-20), night (21-23)
        # Less active: midday (11-15)
        
        # Calculate distance to optimal times
        dawn_start, dawn_end = 5.0, 7.0
        dusk_start, dusk_end = 18.0, 20.0
        night_start, night_end = 21.0, 23.0
        
        # Check which period we're in
        if dawn_start <= time_decimal <= dawn_end:
            # Dawn period - peak activity
            score = 100.0
            reasons.append(ScoreReason(
                type="time",
                message=f"Saat {hour:02d}:{minute:02d} - Şafak saati, balık aktivitesi yüksek."
            ))
        elif dusk_start <= time_decimal <= dusk_end:
            # Dusk period - peak activity
            score = 100.0
            reasons.append(ScoreReason(
                type="time",
                message=f"Saat {hour:02d}:{minute:02d} - Alacakaranlık, balık aktivitesi yüksek."
            ))
        elif night_start <= time_decimal <= 24.0 or 0.0 <= time_decimal < 5.0:
            # Night period - good activity
            score = 85.0
            reasons.append(ScoreReason(
                type="time",
                message=f"Saat {hour:02d}:{minute:02d} - Gece saati, balık aktivitesi iyi."
            ))
        elif 11.0 <= time_decimal <= 15.0:
            # Midday - lower activity
            score = 50.0
            reasons.append(ScoreReason(
                type="time",
                message=f"Saat {hour:02d}:{minute:02d} - Öğle saati, balık aktivitesi düşük."
            ))
        else:
            # Transition periods - moderate activity
            score = 70.0
            reasons.append(ScoreReason(
                type="time",
                message=f"Saat {hour:02d}:{minute:02d} - Orta seviye balık aktivitesi."
            ))
        
        return round(score, 1), reasons


# Species profiles (can be loaded from JSON file)
SPECIES_PROFILES: dict[str, SpeciesProfile] = {
    "chipura": SpeciesProfile(
        id="chipura",
        name_tr="Çipura",
        name_en="Gilthead Seabream",
        preferred_depth_range=(5.0, 30.0),  # -5m to -30m
        optimal_band=(8.0, 20.0),  # -8m to -20m
        penalty_curve="quadratic"
    ),
    "levrek": SpeciesProfile(
        id="levrek",
        name_tr="Levrek",
        name_en="European Seabass",
        preferred_depth_range=(3.0, 25.0),  # -3m to -25m
        optimal_band=(5.0, 15.0),  # -5m to -15m
        penalty_curve="quadratic"
    ),
    "sargoz": SpeciesProfile(
        id="sargoz",
        name_tr="Sargoz",
        name_en="White Seabream",
        preferred_depth_range=(5.0, 35.0),  # -5m to -35m
        optimal_band=(10.0, 25.0),  # -10m to -25m (rocky zones)
        penalty_curve="quadratic"
    ),
    "karagoz": SpeciesProfile(
        id="karagoz",
        name_tr="Karagöz",
        name_en="Two-banded Seabream",
        preferred_depth_range=(5.0, 30.0),  # -5m to -30m
        optimal_band=(8.0, 20.0),  # -8m to -20m (rocky zones)
        penalty_curve="quadratic"
    ),
    "mirmir": SpeciesProfile(
        id="mirmir",
        name_tr="Mırmır",
        name_en="Sand Steenbras",
        preferred_depth_range=(3.0, 20.0),  # -3m to -20m (sandy, shallow-moderate)
        optimal_band=(5.0, 12.0),  # -5m to -12m
        penalty_curve="quadratic"
    ),
}


def get_species_profile(species_id: str) -> Optional[SpeciesProfile]:
    """Get species profile by ID."""
    return SPECIES_PROFILES.get(species_id.lower())


def load_profiles_from_json(json_path: Path) -> dict[str, SpeciesProfile]:
    """Load species profiles from JSON file (future: external config)."""
    # TODO: Implement JSON loading
    return SPECIES_PROFILES

