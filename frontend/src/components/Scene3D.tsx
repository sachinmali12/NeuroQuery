import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';

// 3D Elements component inside the Canvas
const Elements3D: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);
  const sphereRef = useRef<THREE.Mesh>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const ring3Ref = useRef<THREE.Mesh>(null);

  // Generate particles manually for precise styling and light weight
  const particlesCount = 280;
  const positions = useMemo(() => {
    const arr = new Float32Array(particlesCount * 3);
    for (let i = 0; i < particlesCount * 3; i++) {
      // Random position in a sphere shell
      arr[i] = (Math.random() - 0.5) * 12;
    }
    return arr;
  }, []);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    // 1. Slow automatic rotation
    if (sphereRef.current) {
      sphereRef.current.rotation.y = time * 0.15;
      sphereRef.current.rotation.x = time * 0.08;
    }
    if (ring1Ref.current) {
      ring1Ref.current.rotation.z = time * 0.25;
      ring1Ref.current.rotation.x = time * 0.05;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.z = -time * 0.18;
      ring2Ref.current.rotation.y = time * 0.08;
    }
    if (ring3Ref.current) {
      ring3Ref.current.rotation.z = time * 0.12;
      ring3Ref.current.rotation.x = -time * 0.1;
    }

    // 2. Mouse interaction - smooth tilting
    if (groupRef.current) {
      const targetX = state.pointer.y * 0.25;
      const targetY = state.pointer.x * 0.25;
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetX, 0.05);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetY, 0.05);
    }
  });

  return (
    <group ref={groupRef}>
      {/* 1. Core Rotating Holographic Sphere */}
      <mesh ref={sphereRef}>
        <sphereGeometry args={[1.4, 28, 28]} />
        <meshStandardMaterial
          color="#6366f1"
          emissive="#4338ca"
          emissiveIntensity={0.6}
          wireframe
          transparent
          opacity={0.35}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Subtle interior glow sphere */}
      <mesh>
        <sphereGeometry args={[0.9, 16, 16]} />
        <meshBasicMaterial
          color="#a855f7"
          transparent
          opacity={0.12}
        />
      </mesh>

      {/* 2. Concentric database orbit rings */}
      {/* Ring 1 - Indigo */}
      <mesh ref={ring1Ref} rotation={[Math.PI / 3, 0, 0]}>
        <torusGeometry args={[2.0, 0.015, 8, 80]} />
        <meshBasicMaterial
          color="#4f46e5"
          transparent
          opacity={0.7}
        />
      </mesh>

      {/* Ring 2 - Purple */}
      <mesh ref={ring2Ref} rotation={[Math.PI / 4, Math.PI / 4, 0]}>
        <torusGeometry args={[2.5, 0.012, 8, 80]} />
        <meshBasicMaterial
          color="#a855f7"
          transparent
          opacity={0.5}
        />
      </mesh>

      {/* Ring 3 - Teal/Neon Blue */}
      <mesh ref={ring3Ref} rotation={[-Math.PI / 6, Math.PI / 3, 0]}>
        <torusGeometry args={[3.0, 0.01, 8, 80]} />
        <meshBasicMaterial
          color="#06b6d4"
          transparent
          opacity={0.4}
        />
      </mesh>

      {/* 3. Embedded Float Points Field */}
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.035}
          color="#818cf8"
          transparent
          opacity={0.65}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
};

// Main Canvas wrapper component
export const Scene3D: React.FC = () => {
  return (
    <div className="absolute inset-0 z-0 w-full h-full pointer-events-none select-none overflow-hidden bg-transparent">
      <Canvas
        camera={{ position: [0, 0, 6.5], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.2} />
        
        {/* Neon Gradient Point Lights */}
        <pointLight position={[5, 5, 5]} intensity={1.5} color="#4f46e5" />
        <pointLight position={[-5, -5, 5]} intensity={1.2} color="#a855f7" />
        <pointLight position={[0, 0, -5]} intensity={0.8} color="#06b6d4" />
        
        <Elements3D />
        
        {/* Soft background stars field */}
        <Stars
          radius={120}
          depth={50}
          count={1200}
          factor={4}
          saturation={0.5}
          fade
          speed={0.8}
        />
      </Canvas>
    </div>
  );
};

export default Scene3D;
