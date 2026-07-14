import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, Sphere, Torus, Box, Stars } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";

function AnimatedSphere() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.2;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.3;
    }
  });

  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={2}>
      <Sphere ref={meshRef} args={[1.5, 64, 64]} position={[0, 0, 0]}>
        <MeshDistortMaterial
          color="#6366f1"
          attach="material"
          distort={0.4}
          speed={2}
          roughness={0.2}
          metalness={0.8}
        />
      </Sphere>
    </Float>
  );
}

function FloatingGeometry() {
  const torusRef = useRef<THREE.Mesh>(null);
  const boxRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (torusRef.current) {
      torusRef.current.rotation.x = state.clock.elapsedTime * 0.5;
      torusRef.current.rotation.y = state.clock.elapsedTime * 0.3;
    }
    if (boxRef.current) {
      boxRef.current.rotation.x = state.clock.elapsedTime * 0.4;
      boxRef.current.rotation.z = state.clock.elapsedTime * 0.2;
    }
  });

  return (
    <>
      <Float speed={3} rotationIntensity={2} floatIntensity={1}>
        <Torus ref={torusRef} args={[0.8, 0.3, 16, 32]} position={[-3, 2, -2]}>
          <meshStandardMaterial color="#8b5cf6" wireframe />
        </Torus>
      </Float>
      <Float speed={2.5} rotationIntensity={1.5} floatIntensity={1.5}>
        <Box ref={boxRef} args={[0.8, 0.8, 0.8]} position={[3, -1, -2]}>
          <meshStandardMaterial color="#06b6d4" wireframe />
        </Box>
      </Float>
      <Float speed={1.5} rotationIntensity={1} floatIntensity={2}>
        <Torus args={[0.5, 0.2, 16, 32]} position={[2.5, 2.5, -3]}>
          <meshStandardMaterial color="#ec4899" wireframe />
        </Torus>
      </Float>
      <Float speed={2} rotationIntensity={2} floatIntensity={1}>
        <Box args={[0.6, 0.6, 0.6]} position={[-2.5, -2, -1]}>
          <meshStandardMaterial color="#10b981" wireframe />
        </Box>
      </Float>
    </>
  );
}

const PARTICLE_COUNT = 500;
const particlePositions = new Float32Array(PARTICLE_COUNT * 3);
for (let i = 0; i < PARTICLE_COUNT; i++) {
  particlePositions[i * 3] = (Math.random() - 0.5) * 20;
  particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 20;
  particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 20;
}

function ParticleField() {
  const particlesRef = useRef<THREE.Points>(null);

  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = state.clock.elapsedTime * 0.05;
      particlesRef.current.rotation.x = state.clock.elapsedTime * 0.03;
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[particlePositions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial size={0.03} color="#a78bfa" sizeAttenuation transparent opacity={0.8} />
    </points>
  );
}

export default function Scene3D() {
  return (
    <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", zIndex: 0 }}>
      <Canvas camera={{ position: [0, 0, 6], fov: 60 }}>
        <ambientLight intensity={0.3} />
        <directionalLight position={[5, 5, 5]} intensity={1} color="#ffffff" />
        <pointLight position={[-5, -5, -5]} intensity={0.5} color="#8b5cf6" />
        <pointLight position={[5, -5, 5]} intensity={0.5} color="#06b6d4" />
        <AnimatedSphere />
        <FloatingGeometry />
        <ParticleField />
        <Stars radius={50} depth={50} count={1000} factor={4} saturation={0} fade speed={1} />
      </Canvas>
    </div>
  );
}
