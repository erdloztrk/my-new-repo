/**
 * Bait suggestions per fish species
 * Simple mapping - editable constants
 */

export interface BaitSuggestion {
  primary: string[];
  secondary: string[];
  notes?: string;
}

export const BAIT_SUGGESTIONS: Record<string, BaitSuggestion> = {
  seabass: {
    primary: ["Canlı yem (sardalya, hamsi)", "Yapay yem (popper, stickbait)"],
    secondary: ["Jig", "Sırtı"],
    notes: "Sabah erken ve akşam saatlerinde daha aktif",
  },
  white_sea_bream: {
    primary: ["Canlı yem (karides, sübye)", "Yapay yem (soft bait)"],
    secondary: ["Dip oltası", "Kalamar"],
    notes: "Temkinli tür, sessiz yaklaşım gerekli",
  },
  common_two_banded_sea_bream: {
    primary: ["Canlı yem (karides, sübye)", "Yapay yem (soft bait)"],
    secondary: ["Dip oltası", "Kalamar"],
    notes: "Sargozla benzer, iki siyah bant ayırt edici",
  },
  gilthead_seabream: {
    primary: ["Canlı yem (karides, sübye)", "Yapay yem (soft bait)"],
    secondary: ["Dip oltası", "Kalamar"],
    notes: "Sakin denizde daha iyi avlanır",
  },
  sand_steenbras: {
    primary: ["Canlı yem (karides, sübye)", "Dip oltası"],
    secondary: ["Yapay yem (soft bait)", "Kalamar"],
    notes: "Kumluk zeminlerde, dipte titreşim/ses/kokuya hassas",
  },
};

/**
 * Get bait suggestion for a species
 */
export function getBaitSuggestion(speciesId: string): BaitSuggestion | null {
  return BAIT_SUGGESTIONS[speciesId] || null;
}

