/**
 * cardLayout.js — geometry shared by the HTML card and the 3D card.
 *
 * The card is authored in `em`, with 1em = cardWidth / EM_DIVISOR, so a
 * single layout renders identically at 300px in the modal, 540px for the
 * WebGL textures and 620–740px on the export stage.
 *
 * The stamp is a separate plane in the 3D scene (it has to animate on
 * its own), so its anchor lives here rather than being duplicated.
 * Anchoring from the card's TOP matters: the poster's top edge is at a
 * fixed offset, while its bottom edge moves with the optional caption.
 */

export const EM_DIVISOR = 20;      // card width in em
export const CARD_ASPECT = 5 / 7;  // width / height

export const STAMP_TOP_EM = 21.8;
export const STAMP_RIGHT_EM = 0.95;
