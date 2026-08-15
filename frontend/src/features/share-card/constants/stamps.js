/**
 * stamps.js — curated approval stamps for the Collector Card.
 *
 * Inks are deliberately muted, desaturated "rubber stamp" tones —
 * they read as physical ink, not UI badges. `rotate` is the settled
 * resting angle on the card.
 */

export const STAMPS = [
  { id: "absolute-cinema", label: "Absolute Cinema", ink: "#c9a843", rotate: -7 },
  { id: "masterpiece",     label: "Masterpiece",     ink: "#c9a843", rotate: -8 },
  { id: "must-watch",      label: "Must Watch",      ink: "#c9a843", rotate: 6 },
  { id: "hidden-gem",      label: "Hidden Gem",      ink: "#c9a843", rotate: -6 },
  { id: "cinemascope-pick",label: "CinemaScope Pick",ink: "#c9a843", rotate: 5 },
  { id: "comfort-film",    label: "Comfort Film",    ink: "#c9a843", rotate: -5 },
];

export const getStamp = (id) => STAMPS.find((s) => s.id === id) ?? null;
