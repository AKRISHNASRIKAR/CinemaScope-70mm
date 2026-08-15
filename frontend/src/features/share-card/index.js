/**
 * share-card — CinemaScope Collector Card feature module.
 *
 * Public surface is intentionally tiny: pages mount ShareCardButton
 * and everything else (modal, export pipeline, three.js preview)
 * loads lazily behind it.
 *
 * `serializeCardData` is the forward-looking contract a future
 * backend can persist to power /card/:id — no persistence exists in V1.
 */
export { default as ShareCardButton } from "./components/ShareCardButton";
export { serializeCardData } from "./utils/shareCard";
