import { ContactShadows, Float } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";

function Sculpture() {
  return (
    <Float speed={1.2} rotationIntensity={0.25} floatIntensity={0.4}>
      <mesh>
        <torusKnotGeometry args={[1.02, 0.24, 180, 16]} />
        <meshStandardMaterial
          color="#e4c27a"
          metalness={0.92}
          roughness={0.18}
          emissive="#6d5424"
          emissiveIntensity={0.45}
        />
      </mesh>
      <mesh>
        <icosahedronGeometry args={[1.78, 1]} />
        <meshBasicMaterial color="#8ec9d6" wireframe transparent opacity={0.28} />
      </mesh>
    </Float>
  );
}

export default function AetherScene() {
  return (
    <Canvas
      className="scene"
      camera={{ position: [0, 0.15, 6.2], fov: 38 }}
      dpr={[1, 1.6]}
      gl={{ antialias: true, alpha: true }}
    >
      <color attach="background" args={["#101218"]} />
      <ambientLight intensity={0.45} />
      <spotLight position={[4, 5, 4]} intensity={40} color="#f0d7a2" angle={0.45} penumbra={0.8} />
      <pointLight position={[-3.2, -1.2, 2]} intensity={10} color="#7ec8d8" />
      <Sculpture />
      <ContactShadows position={[0, -1.7, 0]} opacity={0.45} scale={8} blur={2.2} far={3.5} />
      <EffectComposer>
        <Bloom mipmapBlur luminanceThreshold={0.55} intensity={0.7} />
      </EffectComposer>
    </Canvas>
  );
}
