import React from 'react';

interface PixelCatLogoProps {
  size?: number; // final rendered size in px (square)
  showText?: boolean;
}

// Simple pixel-art cat head using crisp SVG rectangles
export const PixelCatLogo: React.FC<PixelCatLogoProps> = ({ size = 72, showText = true }) => {
  const cell = 4; // base pixel size
  const view = 64; // svg viewbox size

  return (
    <div className="flex items-center space-x-3 select-none">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${view} ${view}`}
        shapeRendering="crispEdges"
        aria-hidden
        className="image-rendering-pixelated"
      >
        {/* Background transparent */}

        {/* Ears (outer) */}
        <rect x={16} y={8} width={12} height={12} fill="#d9b07a" />
        <rect x={36} y={8} width={12} height={12} fill="#d9b07a" />
        {/* Ears (inner) */}
        <rect x={20} y={12} width={6} height={6} fill="#efb7a7" />
        <rect x={40} y={12} width={6} height={6} fill="#efb7a7" />

        {/* Head */}
        <rect x={12} y={16} width={40} height={34} fill="#f5d19c" />
        {/* Head shadow bottom */}
        <rect x={12} y={46} width={40} height={4} fill="#e5c18a" />

        {/* Outline (subtle) */}
        <rect x={12} y={16} width={40} height={1} fill="#3a2e22" />
        <rect x={12} y={49} width={40} height={1} fill="#3a2e22" />
        <rect x={12} y={16} width={1} height={34} fill="#3a2e22" />
        <rect x={51} y={16} width={1} height={34} fill="#3a2e22" />

        {/* Eyes */}
        <rect x={22} y={28} width={4} height={4} fill="#1a1a1a" />
        <rect x={38} y={28} width={4} height={4} fill="#1a1a1a" />

        {/* Nose */}
        <rect x={30} y={34} width={4} height={2} fill="#e86aa0" />

        {/* Mouth */}
        <rect x={30} y={36} width={1} height={2} fill="#4b3a2b" />
        <rect x={33} y={36} width={1} height={2} fill="#4b3a2b" />

        {/* Whiskers left */}
        <rect x={16} y={34} width={10} height={1} fill="#4b3a2b" />
        <rect x={16} y={37} width={10} height={1} fill="#4b3a2b" />

        {/* Whiskers right */}
        <rect x={38} y={34} width={10} height={1} fill="#4b3a2b" />
        <rect x={38} y={37} width={10} height={1} fill="#4b3a2b" />

        {/* Cheek blush */}
        <rect x={20} y={33} width={3} height={2} fill="#f2a4a4" />
        <rect x={41} y={33} width={3} height={2} fill="#f2a4a4" />
      </svg>

      {showText && (
        <div className="font-mono text-2xl text-gray-800 tracking-wider">pixcelbob</div>
      )}
    </div>
  );
};

