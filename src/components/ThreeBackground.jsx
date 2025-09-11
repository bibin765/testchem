import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';

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

// Simple avatar made from primitives
function Character({ side = 'left', active = false, color = '#ffffff' }) {
  const groupRef = useRef();
  const headRef = useRef();
  const bodyRef = useRef();
  const leftArmRef = useRef();
  const rightArmRef = useRef();
  const { viewport } = useThree();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const leftMargin = 2.8; // Increased margin to move left character more towards center
    const rightMargin = 0; // Keep original margin for right character
    const sidebarWidth = 5.0; // Approximate world units for 320px sidebar
    const baseX = side === 'left' 
      ? -viewport.width / 2 + leftMargin 
      : viewport.width / 2 - rightMargin - sidebarWidth; // Keep right character in original position
    const baseY = -viewport.height / 2 + 1.2; // near bottom
    const targetScale = active ? 1 : 0.85;
    const targetOpacity = active ? 1 : 0.35;

    if (groupRef.current) {
      groupRef.current.position.x = baseX + (active ? Math.sin(t * 0.8) * 0.1 : 0);
      groupRef.current.position.y = baseY + (active ? Math.sin(t * 1.6) * 0.12 : 0);
      // Smooth scale toward target
      const s = groupRef.current.scale.x;
      const ns = s + (targetScale - s) * 0.08;
      groupRef.current.scale.set(ns, ns, ns);
    }

    const setOpacity = (ref) => {
      if (ref.current && ref.current.material) {
        ref.current.material.opacity += (targetOpacity - ref.current.material.opacity) * 0.1;
      }
    };

    setOpacity(headRef);
    setOpacity(bodyRef);
    setOpacity(leftArmRef);
    setOpacity(rightArmRef);

    // Gentle arm sway when active
    if (leftArmRef.current && rightArmRef.current) {
      const sway = active ? Math.sin(t * 2.0) * 0.25 : 0;
      leftArmRef.current.rotation.z = 0.2 + sway;
      rightArmRef.current.rotation.z = -0.2 - sway;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, -1]}>
      {/* Head */}
      <mesh ref={headRef} position={[0, 1.2, 0]}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial color={color} transparent opacity={0.9} roughness={0.7} metalness={0.0} />
      </mesh>
      {/* Body */}
      <mesh ref={bodyRef} position={[0, 0.1, 0]}>
        <capsuleGeometry args={[0.35, 1.2, 4, 12]} />
        <meshStandardMaterial color={color} transparent opacity={0.9} roughness={0.8} metalness={0.0} />
      </mesh>
      {/* Arms */}
      <mesh ref={leftArmRef} position={[-0.6, 0.4, 0]}>
        <capsuleGeometry args={[0.12, 0.8, 4, 12]} />
        <meshStandardMaterial color={color} transparent opacity={0.9} roughness={0.8} metalness={0.0} />
      </mesh>
      <mesh ref={rightArmRef} position={[0.6, 0.4, 0]}>
        <capsuleGeometry args={[0.12, 0.8, 4, 12]} />
        <meshStandardMaterial color={color} transparent opacity={0.9} roughness={0.8} metalness={0.0} />
      </mesh>
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
    <>
      {/* Background Layer - Cubes and Characters */}
      <div 
        className="fixed inset-0 pointer-events-none" 
        style={{ 
          zIndex: 1
        }}
      >
        <Canvas
          camera={{ position: [0, 0, 8], fov: 75 }}
          style={{ background: 'transparent', width: '100%', height: '100%', pointerEvents: 'none' }}
        >
          <ambientLight intensity={0.9} />
          <directionalLight position={[3, 4, 5]} intensity={0.8} />
          <FloatingCubes messageType={messageType} count={cubeCount} />
          {/* Show only the active character to avoid stacking */}
          {messageType === 'teacher' ? (
            <Character 
              side="left" 
              active={true} 
              color="#ff6b9d" // Pink for teacher
            />
          ) : (
            <Character 
              side="right" 
              active={true} 
              color="#00ff88" // Green for student
            />
          )}
        </Canvas>
      </div>
    </>
  );
}