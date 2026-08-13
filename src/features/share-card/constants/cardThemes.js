/**
 * cardThemes.js — data-driven skins for the CinemaScope Collector Card.
 *
 * One ShareCard component consumes these; the 3D preview reads the
 * material fields (edgeColor, clearcoat, iridescence, envIntensity).
 * Colors stay inside the CinemaScope palette — gold is reserved for
 * ratings/accents, surfaces stay near-black.
 */

export const CARD_THEMES = [
  {
    id: "classic",
    label: "Classic",
    // HTML/CSS surfaces
    cardBg: "linear-gradient(165deg, #161513 0%, #0d0d0c 55%, #121110 100%)",
    frameColor: "rgba(201, 168, 67, 0.45)",
    ruleColor: "rgba(201, 168, 67, 0.30)",
    titleColor: "#f4f1e6",
    textColor: "rgba(255, 255, 255, 0.62)",
    faintColor: "rgba(255, 255, 255, 0.34)",
    accent: "#c9a843",
    starTrack: "rgba(255, 255, 255, 0.14)",
    posterFilter: "saturate(1.05) contrast(1.02)",
    grainOpacity: 0.055,
    foil: "soft", // "none" | "soft" | "spectral"
    // 3D material
    edgeColor: "#4a3c1a",
    clearcoat: 0.45,
    iridescence: 0,
    envIntensity: 0.3,
  },
  {
    id: "noir",
    label: "Noir",
    cardBg: "linear-gradient(165deg, #111111 0%, #060606 60%, #0c0c0c 100%)",
    frameColor: "rgba(255, 255, 255, 0.30)",
    ruleColor: "rgba(255, 255, 255, 0.16)",
    titleColor: "#ffffff",
    textColor: "rgba(255, 255, 255, 0.55)",
    faintColor: "rgba(255, 255, 255, 0.30)",
    accent: "#e4e4e4",
    starTrack: "rgba(255, 255, 255, 0.14)",
    posterFilter: "grayscale(1) contrast(1.18) brightness(0.95)",
    grainOpacity: 0.10,
    foil: "none",
    edgeColor: "#2a2a2a",
    clearcoat: 0.25,
    iridescence: 0,
    envIntensity: 0.25,
  },
  {
    id: "holo",
    label: "Holographic",
    cardBg: "linear-gradient(155deg, #14131a 0%, #0c0c10 50%, #101017 100%)",
    frameColor: "rgba(201, 168, 67, 0.50)",
    ruleColor: "rgba(201, 168, 67, 0.28)",
    titleColor: "#f4f1e6",
    textColor: "rgba(255, 255, 255, 0.62)",
    faintColor: "rgba(255, 255, 255, 0.34)",
    accent: "#c9a843",
    starTrack: "rgba(255, 255, 255, 0.14)",
    posterFilter: "saturate(1.12) contrast(1.03)",
    grainOpacity: 0.05,
    foil: "spectral",
    edgeColor: "#3a3550",
    clearcoat: 0.9,
    iridescence: 0.85,
    envIntensity: 0.85,
  },
];

export const DEFAULT_THEME_ID = "classic";

export const getTheme = (id) =>
  CARD_THEMES.find((t) => t.id === id) ?? CARD_THEMES[0];
