import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere } from '@react-three/drei';
import * as THREE from 'three';

const GlobeMesh = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.001;
    }
  });
  
  return (
    <Sphere ref={meshRef} args={[1, 64, 64]}>
      <meshPhongMaterial
        attach="material"
        color="#4F46E5"
        opacity={0.8}
        transparent
        wireframe
      />
    </Sphere>
  );
};

export const Globe: React.FC = () => (
  <Canvas style={{ height: '400px' }}>
    <ambientLight intensity={0.5} />
    <pointLight position={[10, 10, 10]} />
    <GlobeMesh />
  </Canvas>
); 