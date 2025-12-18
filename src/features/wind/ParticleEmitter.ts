/**
 * Particle emitter for wind flow visualization.
 * Manages particle lifecycle, advection, and trail tracking.
 */

import { VectorField } from "./VectorField";
import { lonLatToMercator, mercatorToLonLat } from "./projection";

export interface Particle {
  // Position in Mercator normalized coordinates (0..1)
  x: number;
  y: number;
  
  // Age in frames
  age: number;
  
  // Trail of last K positions (for rendering)
  trail: Array<{ x: number; y: number }>;
  
  // Current velocity (for smooth rendering)
  vx: number;
  vy: number;
}

export interface ParticleEmitterConfig {
  originLat: number;
  originLon: number;
  vectorField: VectorField;
  maxAge: number; // Maximum age in frames (e.g., 120 frames ≈ 2s at 60fps)
  trailLength: number; // Number of trail points to keep
  particleCount: number; // Number of particles to emit
  jitterRadius: number; // Random jitter radius in Mercator normalized units (e.g., 0.001)
  speedMultiplier: number; // Multiplier for wind speed (e.g., 0.5 for slower animation)
  dt: number; // Time step in seconds (typically 1/60 for 60fps)
}

export class ParticleEmitter {
  private particles: Particle[] = [];
  private config: ParticleEmitterConfig;
  private isActive: boolean = true;
  private frameCount: number = 0;

  constructor(config: ParticleEmitterConfig) {
    this.config = config;
    this.initializeParticles();
  }

  private initializeParticles(): void {
    const { originLat, originLon, particleCount, jitterRadius, trailLength } = this.config;
    
    // Convert origin to Mercator
    const originMerc = lonLatToMercator(originLon, originLat);
    
    // Create particles with random jitter
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * jitterRadius;
      const x = originMerc.x + Math.cos(angle) * radius;
      const y = originMerc.y + Math.sin(angle) * radius;
      
      this.particles.push({
        x,
        y,
        age: Math.floor(Math.random() * 10), // Stagger initial ages
        trail: [{ x, y }],
        vx: 0,
        vy: 0,
      });
    }
  }

  /**
   * Update all particles for one frame.
   * Returns true if emitter is still active, false if all particles are dead.
   */
  update(): boolean {
    if (!this.isActive) {
      return false;
    }

    this.frameCount++;
    const { vectorField, maxAge, trailLength, speedMultiplier, dt } = this.config;
    const bbox = vectorField.getBbox();

    let activeCount = 0;

    for (const particle of this.particles) {
      particle.age++;

      // Check if particle is too old
      if (particle.age > maxAge) {
        continue;
      }

      // Convert Mercator position to lat/lon
      const { lat, lon } = mercatorToLonLat(particle.x, particle.y);

      // Sample wind vector at particle position
      const wind = vectorField.sample(lat, lon);

      // Advect particle (convert m/s to Mercator units per second)
      // At equator: 1° longitude ≈ 111km, 1° latitude ≈ 111km
      // Mercator normalized: 1 unit = 360° longitude = ~40,000km
      // For latitude, Mercator projection distorts, but approximate:
      // 1 Mercator unit (y) ≈ 180° latitude ≈ 20,000km
      // So: 1 m/s ≈ (1 / 111000) degrees/sec
      // For longitude: (1 / 111000) / 360 Mercator units/sec
      // For latitude: (1 / 111000) / 180 Mercator units/sec (approximate)
      const metersPerDegreeLon = 111000 * Math.cos((lat * Math.PI) / 180);
      const metersPerDegreeLat = 111000;
      const mercatorUnitsPerDegreeLon = 1 / 360;
      const mercatorUnitsPerDegreeLat = 1 / 180; // Approximate for Mercator

      // Convert wind u/v (m/s) to Mercator units/sec
      const dx = ((wind.u * dt * speedMultiplier) / metersPerDegreeLon) * mercatorUnitsPerDegreeLon;
      const dy = ((wind.v * dt * speedMultiplier) / metersPerDegreeLat) * mercatorUnitsPerDegreeLat;

      // Update velocity (for rendering - store in Mercator units/sec)
      particle.vx = dx / dt;
      particle.vy = dy / dt;

      // Update position
      particle.x += dx;
      particle.y += dy;

      // Check if particle is out of bounds
      const [west, south, east, north] = bbox;
      if (lon < west || lon > east || lat < south || lat > north) {
        // Respawn near origin (only if still within animation time)
        if (this.frameCount < maxAge) {
          const originMerc = lonLatToMercator(this.config.originLon, this.config.originLat);
          const angle = Math.random() * Math.PI * 2;
          const radius = Math.random() * this.config.jitterRadius;
          particle.x = originMerc.x + Math.cos(angle) * radius;
          particle.y = originMerc.y + Math.sin(angle) * radius;
          particle.age = 0;
          particle.trail = [{ x: particle.x, y: particle.y }];
        } else {
          continue; // Particle is dead
        }
      }

      // Update trail
      particle.trail.push({ x: particle.x, y: particle.y });
      if (particle.trail.length > trailLength) {
        particle.trail.shift();
      }

      activeCount++;
    }

    // Check if emitter should be deactivated
    if (this.frameCount > maxAge && activeCount === 0) {
      this.isActive = false;
      return false;
    }

    return true;
  }

  /**
   * Get all active particles.
   */
  getParticles(): Particle[] {
    return this.particles.filter((p) => p.age <= this.config.maxAge);
  }

  /**
   * Check if emitter is still active.
   */
  getIsActive(): boolean {
    return this.isActive;
  }

  /**
   * Force stop the emitter.
   */
  stop(): void {
    this.isActive = false;
  }
}

