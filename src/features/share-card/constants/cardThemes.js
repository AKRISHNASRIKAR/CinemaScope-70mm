/**
 * cardThemes.js — data-driven skins for the CinemaScope Collector Card.
 *
 * One ShareCard component consumes these; the 3D preview reads the
 * material fields (edgeColor, clearcoat, iridescence, envIntensity).
 *
 * Design note: Gradients are baked directly into `cardBg` using deep, 
 * rich, near-black color stops. This ensures the iridescent/holo effects 
 * remain subtle, elegant, and perfectly readable, functioning as a 
 * premium background surface rather than an overwhelming overlay.
 *
 * Example usage:
 *   <div style={{ background: theme.cardBg, ... }}>
 *     ...card content...
 *   </div>
 */

export const CARD_THEMES = [
  {
    id: "classic",
    label: "Classic",
    // Soft radial spotlight with a warm, charcoal-brown undertone
    cardBg: "radial-gradient(120% 120% at 50% 0%, #1f1d19 0%, #0d0c0b 50%, #050504 100%)",
    frameColor: "rgba(201, 168, 67, 0.45)",
    ruleColor: "rgba(201, 168, 67, 0.30)",
    titleColor: "#f4f1e6",
    textColor: "rgba(255, 255, 255, 0.62)",
    faintColor: "rgba(255, 255, 255, 0.34)",
    accent: "#c9a843",
    starTrack: "rgba(255, 255, 255, 0.14)",
    posterFilter: "saturate(1.05) contrast(1.02)",
    grainOpacity: 0.055,
    foil: "soft",
    foilGradient: null,
    // 3D material
    edgeColor: "#4a3c1a",
    clearcoat: 0.45,
    iridescence: 0,
    envIntensity: 0.3,
  },
  {
    id: "noir",
    label: "Noir",
    // Rich, silky true-greyscale vignette
    cardBg: "radial-gradient(120% 120% at 50% 0%, #1a1a1a 0%, #080808 50%, #000000 100%)",
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
    foilGradient: null,
    edgeColor: "#2a2a2a",
    clearcoat: 0.25,
    iridescence: 0,
    envIntensity: 0.25,
  },
  {
    id: "holo",
    label: "Holographic",
    // A very dark, subtle oil-slick sweep. Transitions from dark bronze -> deep plum -> navy -> dark teal
    cardBg: "linear-gradient(115deg, #050505 0%, #1c1510 20%, #1f1118 45%, #131221 70%, #0f1c1f 90%, #050505 100%)",
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
    foilGradient: null,
    edgeColor: "#5a3f7e",
    clearcoat: 0.95,
    iridescence: 1,
    envIntensity: 1.15,
  },
  {
    id: "prism",
    label: "Prism",
    // A cool-toned, sleek sheen. Dark midnight blue fading into a deep crushed violet
    cardBg: "linear-gradient(145deg, #0d1a26 0%, #060a0f 35%, #050505 60%, #1a1024 100%)",
    frameColor: "rgba(160, 210, 255, 0.40)",
    ruleColor: "rgba(160, 210, 255, 0.24)",
    titleColor: "#f4f1e6",
    textColor: "rgba(255, 255, 255, 0.62)",
    faintColor: "rgba(255, 255, 255, 0.34)",
    accent: "#c9a843",
    starTrack: "rgba(255, 255, 255, 0.14)",
    posterFilter: "saturate(1.08) contrast(1.05)",
    grainOpacity: 0.045,
    foil: "spectral",
    foilGradient: null,
    edgeColor: "#3f4d8c",
    clearcoat: 1,
    iridescence: 1,
    envIntensity: 1.2,
  },
];

export const DEFAULT_THEME_ID = "classic";

export const getTheme = (id) =>
  CARD_THEMES.find((t) => t.id === id) ?? CARD_THEMES[0];