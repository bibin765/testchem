import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';

// Floating cubes component
function FloatingCubes({ messageType = 'default', count = 8 }) {
  const groupRef = useRef();
  
  const cubes = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      initialPosition: [
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 15, 
        (Math.random() - 0.5) * 10 - 3
      ],
      speed: 0.3 + Math.random() * 0.5,
      size: 0.8 + Math.random() * 1.2,
      rotationSpeed: 0.005 + Math.random() * 0.01,
      phase: Math.random() * Math.PI * 2
    }));
  }, [count]);
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.children.forEach((mesh, i) => {
        const cube = cubes[i];
        const time = state.clock.elapsedTime * cube.speed;
        
        // Floating motion patterns
        mesh.position.x = cube.initialPosition[0] + Math.sin(time + cube.phase) * 3;
        mesh.position.y = cube.initialPosition[1] + Math.cos(time * 0.7 + cube.phase) * 2;
        mesh.position.z = cube.initialPosition[2] + Math.sin(time * 0.5 + cube.phase) * 1.5;
        
        // Rotation
        mesh.rotation.x += cube.rotationSpeed;
        mesh.rotation.y += cube.rotationSpeed * 1.3;
        mesh.rotation.z += cube.rotationSpeed * 0.7;
      });
    }
  });
  
  const getColor = () => {
    if (messageType === 'teacher') return '#ff6b9d'; // Bright pink
    if (messageType === 'student') return '#00ff88'; // Bright green
    return '#00d4ff'; // Bright cyan
  };
  
  return (
    <group ref={groupRef}>
      {cubes.map((cube) => (
        <mesh key={cube.id} position={cube.initialPosition}>
          <boxGeometry args={[cube.size, cube.size, cube.size]} />
          <meshBasicMaterial color={getColor()} wireframe transparent opacity={0.3} />
        </mesh>
      ))}
    </group>
  );
}

// Main Three.js background component
export default function ThreeBackground({ 
  messageType = 'default', 
  contentType = null
}) {
  const cubeCount = messageType === 'teacher' ? 12 : 8;
  
  return (
    <div 
      className="absolute inset-0 pointer-events-none" 
      style={{ 
        zIndex: 1
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 8], fov: 75 }}
        style={{ background: 'transparent', width: '100%', height: '100%' }}
      >
        <ambientLight intensity={0.8} />
        <FloatingCubes messageType={messageType} count={cubeCount} />
      </Canvas>
    </div>
  );
}