interface SphereBackgroundProps {
  className?: string;
  intensity?: number;
  color?: string;
  size?: number;
  blur?: number;
}

export function SphereBackground({
  className = "",
  intensity = 0.15,
  color = "79, 70, 229", // Primary color in RGB
  size = 300,
  blur = 40,
}: SphereBackgroundProps) {
  return (
    <div
      className={`absolute pointer-events-none animate-float ${className}`}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(
          circle at 30% 30%,
          rgba(${color}, ${intensity}),
          rgba(${color}, ${intensity * 0.3}) 50%,
          transparent 70%
        )`,
        borderRadius: "50%",
        filter: `blur(${blur}px)`,
        zIndex: -1,
      }}
    />
  );
}

export function SphereBackgroundGroup() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {/* Top left sphere */}
      <SphereBackground
        className="top-[-20%] left-[-10%]"
        intensity={0.05}
        size={400}
      />
      
      {/* Bottom right sphere */}
      <SphereBackground
        className="bottom-[-20%] right-[-10%]"
        intensity={0.05}
        size={400}
      />
      
      {/* Additional decorative spheres */}
      <SphereBackground
        className="top-[30%] right-[20%]"
        intensity={0.03}
        size={200}
        color="99, 102, 241" // Slightly different color for variety
      />
      
      <SphereBackground
        className="bottom-[10%] left-[30%]"
        intensity={0.03}
        size={150}
        color="99, 102, 241"
      />
    </div>
  );
} 