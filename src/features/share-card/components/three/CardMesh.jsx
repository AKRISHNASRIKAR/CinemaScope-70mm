/* eslint-disable react/no-unknown-property -- react-three-fiber JSX props */
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import { EM_DIVISOR, STAMP_TOP_EM, STAMP_RIGHT_EM } from "../../constants/cardLayout";

/**
 * CardMesh — the physical collector card.
 *
 * A RoundedBox body provides thickness and softly bevelled edges;
 * the front/back faces are planes textured with the rasterized HTML
 * card (see TextureSource), floated a hair off the body. The stamp
 * is its own small plane hovering above the face so it can land with
 * a physical "thunk" and catch light independently.
 */
export const CARD_W = 2.5;
export const CARD_H = 3.5;
export const CARD_T = 0.045;
const EM = CARD_W / EM_DIVISOR; // world units per card `em` (ShareCard font base)

function useCanvasTexture(canvas) {
  const texture = useMemo(() => {
    if (!canvas) return null;
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  }, [canvas]);
  useEffect(() => () => texture?.dispose(), [texture]);
  return texture;
}

/** Stamp plane — animates scale/height on selection like a real stamp. */
const StampMesh = ({ canvas, rotateDeg = 0, reduced, emScale }) => {
  const texture = useCanvasTexture(canvas);
  const mesh = useRef();
  const progress = useRef(1);

  // Restart the impact animation whenever a new stamp texture arrives
  useEffect(() => {
    progress.current = reduced ? 1 : 0;
  }, [canvas, reduced]);

  useFrame((_, delta) => {
    const m = mesh.current;
    if (!m) return;
    progress.current = Math.min(1, progress.current + delta / 0.42);
    const p = progress.current;
    // Approach (0→0.62): big + high + fading in. Impact settle (0.62→1).
    let scale, z;
    if (p < 0.62) {
      const t = p / 0.62;
      const e = 1 - Math.pow(1 - t, 3); // easeOutCubic
      scale = 1.6 - (1.6 - 0.94) * e;
      z = 0.55 * (1 - e);
      m.material.opacity = Math.min(1, t * 2);
    } else {
      const t = (p - 0.62) / 0.38;
      scale = 0.94 + 0.06 * t;
      z = 0;
      m.material.opacity = 1;
    }
    m.scale.setScalar(scale);
    m.position.z = CARD_T / 2 + 0.012 + z;
  });

  if (!texture) return null;
  // The stamp was rasterized at a known px-per-em scale, so its size in
  // card `em` is exact — no guessing from the texture's aspect ratio.
  const w = (canvas.width / emScale) * EM;
  const h = (canvas.height / emScale) * EM;
  // Mirror the HTML placement (STAMP_TOP_EM / STAMP_RIGHT_EM), measured
  // from the card's top-right corner so both previews agree.
  const x = CARD_W / 2 - STAMP_RIGHT_EM * EM - w / 2;
  const y = CARD_H / 2 - STAMP_TOP_EM * EM - h / 2;

  return (
    <mesh renderOrder={2} ref={mesh} position={[x, y, CARD_T / 2 + 0.012]} rotation={[0, 0, -THREE.MathUtils.degToRad(rotateDeg)]}>
      <planeGeometry args={[w, h]} />
      {/* alphaTest drops the fully transparent surround so the plane reads
          as ink on the card rather than a decal on a dark plate. Kept low
          so the stamp still fades in during its landing animation. */}
      <meshBasicMaterial map={texture} transparent alphaTest={0.02} depthWrite={false} toneMapped={false} />
    </mesh>
  );
};

const FaceMaterial = ({ map, theme }) => (
  <meshPhysicalMaterial
    map={map}
    transparent
    roughness={0.58}
    metalness={0.05}
    envMapIntensity={0.2}
  />
);

const CardMesh = ({ frontCanvas, backCanvas, stampCanvas, stampRotate, stampEmScale, theme, reduced }) => {
  const frontTex = useCanvasTexture(frontCanvas);
  const backTex = useCanvasTexture(backCanvas);

  return (
    <group>
      {/* Body — thickness + bevelled edge */}
      <RoundedBox args={[CARD_W, CARD_H, CARD_T]} radius={0.035} smoothness={4} creaseAngle={0.4}>
        <meshStandardMaterial
          color={theme.edgeColor}
          metalness={0.55}
          roughness={0.38}
          envMapIntensity={theme.envIntensity}
        />
      </RoundedBox>

      {/* Front face */}
      {frontTex && (
        <mesh renderOrder={1} position={[0, 0, CARD_T / 2 + 0.002]}>
          <planeGeometry args={[CARD_W, CARD_H]} />
          <FaceMaterial map={frontTex} theme={theme} />
        </mesh>
      )}

      {/* Back face — rotated π so it reads correctly when flipped */}
      {backTex && (
        <mesh renderOrder={1} position={[0, 0, -(CARD_T / 2 + 0.002)]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[CARD_W, CARD_H]} />
          <FaceMaterial map={backTex} theme={theme} />
        </mesh>
      )}

      {/* Stamp — floats above the face, lands on selection */}
      {stampCanvas && (
        <StampMesh canvas={stampCanvas} rotateDeg={stampRotate} reduced={reduced} emScale={stampEmScale} />
      )}
    </group>
  );
};

export default CardMesh;
