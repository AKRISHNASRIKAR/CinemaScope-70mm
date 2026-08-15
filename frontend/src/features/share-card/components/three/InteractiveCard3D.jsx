/* eslint-disable react/no-unknown-property -- react-three-fiber JSX props */
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { easing } from "maath";
import CardMesh from "./CardMesh";

/**
 * InteractiveCard3D — the premium 3D preview of the Collector Card.
 *
 * Entire file (three + fiber + drei) lives in a lazy chunk that only
 * loads when the share modal decides to show the 3D preview — the
 * rest of CinemaScope never pays for it.
 *
 * `pointer` is a mutable ref ({ x, y, active } in -1…1 from center)
 * updated by the modal's wrapper div — no per-frame React state.
 */

/** Local, network-free studio environment for clearcoat reflections. */
const StudioEnvironment = () => {
  const { gl, scene } = useThree();
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const envMap = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envMap;
    // RoomEnvironment is a bright studio box; at full strength its
    // reflection washes a broad white band across the card face. Dim it
    // to a hint of sheen — the card should read matte and cinematic.
    scene.environmentIntensity = 0.12;
    return () => {
      scene.environment = null;
      envMap.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);
  return null;
};

/** Spring-damped rotation: pointer-driven on desktop, idle sway otherwise. */
const CardRig = ({ pointer, flipped, reduced, coarse, children }) => {
  const group = useRef();
  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    let tx = 0;
    let ty = flipped ? Math.PI : 0;
    if (!reduced) {
      if (!coarse && pointer.current.active) {
        // ≈ ±6° — physical, not gimmicky
        tx = pointer.current.y * -0.105;
        ty += pointer.current.x * 0.105;
      } else {
        const t = state.clock.elapsedTime;
        tx = Math.sin(t * 0.5) * 0.03;
        ty += Math.sin(t * 0.32) * 0.05;
      }
    }
    easing.dampE(g.rotation, [tx, ty, 0], 0.22, delta);
  });
  return <group ref={group}>{children}</group>;
};

/**
 * Warm key light that trails the pointer — the moving foil sheen.
 * At rest it parks off to the upper left so the card catches a raking
 * highlight; parking it dead-centre blooms the poster.
 */
const REST = [-1.9, 1.7, 3.2];

const SheenLight = ({ pointer }) => {
  const light = useRef();
  useFrame((_, delta) => {
    const l = light.current;
    if (!l) return;
    const target = pointer.current.active
      ? [pointer.current.x * 2.4, pointer.current.y * -2.4 + 0.6, 3.2]
      : REST;
    easing.damp3(l.position, target, 0.18, delta);
  });
  return <pointLight ref={light} position={REST} intensity={1.2} distance={10} decay={2} color="#fff3d6" />;
};

const InteractiveCard3D = ({
  frontCanvas,
  backCanvas,
  stampCanvas,
  stampRotate,
  stampEmScale,
  theme,
  flipped,
  pointer,
  reduced,
  coarse,
  onToggleFlip,
}) => (
  <Canvas
    dpr={[1, coarse ? 1.25 : 1.75]}
    camera={{ position: [0, 0, 6.5], fov: 35 }}
    gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
    // Neutral exposure — the card art carries its own contrast; blowing
    // out the poster is the fastest way to make this look like a game UI.
    onCreated={({ gl }) => { gl.toneMappingExposure = 0.9; }}
    style={{ touchAction: "pan-y", cursor: "pointer" }}
    onClick={onToggleFlip}
    aria-hidden
  >
    <StudioEnvironment />
    <ambientLight intensity={0.5} />
    <directionalLight position={[3, 4, 5]} intensity={0.3} />
    <directionalLight position={[-4, -2, 3]} intensity={0.25} color="#c9a843" />
    <SheenLight pointer={pointer} />
    <CardRig pointer={pointer} flipped={flipped} reduced={reduced} coarse={coarse}>
      <CardMesh
        frontCanvas={frontCanvas}
        backCanvas={backCanvas}
        stampCanvas={stampCanvas}
        stampRotate={stampRotate}
        stampEmScale={stampEmScale}
        theme={theme}
        reduced={reduced}
      />
    </CardRig>
  </Canvas>
);

export default InteractiveCard3D;
