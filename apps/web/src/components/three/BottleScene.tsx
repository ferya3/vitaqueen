'use client';

import { useMemo, useRef } from 'react';
import { Canvas, useFrame, type ThreeElements } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * A procedurally generated bottle.
 *
 * No glTF download, no HDR environment map, no external asset of any kind:
 * the whole scene is ~40 lines of geometry and two lights. That keeps the
 * strict CSP happy, keeps the payload measured in kilobytes rather than
 * megabytes, and means the "3D" tier is genuinely cheaper than a 4K video.
 *
 * Replace `profile` with a real glTF once the brand bottle is modelled — the
 * component boundary is designed for that swap.
 */
function BottleMesh(props: ThreeElements['group']) {
  const group = useRef<THREE.Group>(null);
  const water = useRef<THREE.Mesh>(null);

  const { bottle, liquid } = useMemo(() => {
    // Radius profile from base to cap, in arbitrary units.
    const profile: Array<[number, number]> = [
      [0.0, -1.55], [0.52, -1.55], [0.56, -1.48], [0.58, -1.0],
      [0.58, 0.05], [0.56, 0.42], [0.5, 0.72], [0.36, 0.98],
      [0.26, 1.12], [0.25, 1.35], [0.3, 1.4], [0.3, 1.52], [0.0, 1.52],
    ];
    const points = profile.map(([x, y]) => new THREE.Vector2(x, y));
    const bottleGeometry = new THREE.LatheGeometry(points, 96);

    const liquidPoints = profile
      .filter(([, y]) => y <= 0.75)
      .map(([x, y]) => new THREE.Vector2(Math.max(0.001, x - 0.035), y));
    const liquidGeometry = new THREE.LatheGeometry(liquidPoints, 96);

    return { bottle: bottleGeometry, liquid: liquidGeometry };
  }, []);

  useFrame((state, delta) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime;
    group.current.rotation.y += delta * 0.22;
    group.current.position.y = Math.sin(t * 0.7) * 0.06;
    // Pointer tilt, damped so it never snaps.
    group.current.rotation.z +=
      (state.pointer.x * 0.12 - group.current.rotation.z) * 0.05;
    group.current.rotation.x +=
      (-state.pointer.y * 0.1 - group.current.rotation.x) * 0.05;
    if (water.current) {
      water.current.scale.y = 1 + Math.sin(t * 1.4) * 0.006;
    }
  });

  return (
    <group ref={group} {...props}>
      <mesh geometry={bottle}>
        <meshPhysicalMaterial
          transmission={0.96}
          thickness={0.55}
          roughness={0.08}
          ior={1.42}
          clearcoat={1}
          clearcoatRoughness={0.12}
          color="#eaf6fb"
          transparent
          opacity={0.92}
        />
      </mesh>
      <mesh ref={water} geometry={liquid}>
        <meshPhysicalMaterial
          transmission={0.85}
          thickness={1.1}
          roughness={0.05}
          ior={1.33}
          color="#38b6e6"
          transparent
          opacity={0.55}
        />
      </mesh>
      {/* Cap */}
      <mesh position={[0, 1.46, 0]}>
        <cylinderGeometry args={[0.31, 0.31, 0.22, 48]} />
        <meshStandardMaterial color="#0d2942" roughness={0.35} metalness={0.15} />
      </mesh>
    </group>
  );
}

/**
 * Deterministic pseudo-random source.
 *
 * `Math.random()` during render would make the scene impure — different on the
 * server and the client, and different between two runs when a bug needs
 * reproducing. A fixed seed gives the same scattered field every time and looks
 * exactly as random.
 */
function seededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0xffffffff;
  };
}

/** Slow-drifting droplets that give the scene depth without a particle engine. */
function Droplets({ count = 140 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);

  const geometry = useMemo(() => {
    const random = seededRandom(0x5eed);
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      positions[i * 3] = (random() - 0.5) * 7;
      positions[i * 3 + 1] = (random() - 0.5) * 6;
      positions[i * 3 + 2] = (random() - 0.5) * 4 - 1;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return g;
  }, [count]);

  useFrame((state, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * 0.03;
    const positions = ref.current.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < count; i += 1) {
      const y = positions.getY(i) + delta * 0.12;
      positions.setY(i, y > 3 ? -3 : y);
    }
    positions.needsUpdate = true;
    void state;
  });

  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial size={0.03} color="#9adcf5" transparent opacity={0.5} sizeAttenuation />
    </points>
  );
}

export default function BottleScene({ className }: { className?: string }) {
  return (
    <Canvas
      className={className}
      // `dpr` is capped: a 3× retina panel does not need 9× the fragments.
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      camera={{ position: [0, 0.1, 4.6], fov: 34 }}
      // The bottle is decorative; the headline carries the meaning.
      aria-hidden
      frameloop="always"
    >
      <ambientLight intensity={0.9} />
      <directionalLight position={[3, 5, 4]} intensity={2.1} color="#ffffff" />
      <directionalLight position={[-4, -1, -3]} intensity={1.1} color="#5cc8ef" />
      <BottleMesh position={[0, -0.05, 0]} scale={1.05} />
      <Droplets />
    </Canvas>
  );
}
