import React from 'react';

export const PixelBackground: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: '#345391' }}>
      {/* Stars */}
      <div className="absolute inset-0">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white pixel-star"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 60}%`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      {/* Moon */}
      <div className="absolute top-8 right-8 w-16 h-16 rounded-full bg-yellow-200 border-4 border-yellow-300 pixel-glow">
        <div className="absolute top-2 left-2 w-2 h-2 bg-yellow-400 rounded-full"></div>
        <div className="absolute top-4 right-3 w-1 h-1 bg-yellow-400 rounded-full"></div>
        <div className="absolute bottom-3 left-4 w-1 h-1 bg-yellow-400 rounded-full"></div>
      </div>

      {/* Main content area */}
      <div className="relative z-10 min-h-screen">
        {children}
      </div>

      {/* Pixel clouds at bottom */}
      <div className="absolute bottom-0 w-full h-32 pointer-events-none">
        {/* Cloud 1 - Left */}
        <div className="absolute bottom-8 left-[5%] opacity-30">
          <div className="relative">
            <div className="w-16 h-3 bg-white"></div>
            <div className="absolute top-[-6px] left-2 w-12 h-3 bg-white"></div>
            <div className="absolute top-[-10px] left-4 w-8 h-3 bg-white"></div>
          </div>
        </div>

        {/* Cloud 2 - Center Left */}
        <div className="absolute bottom-12 left-[25%] opacity-20">
          <div className="relative">
            <div className="w-20 h-4 bg-white"></div>
            <div className="absolute top-[-8px] left-3 w-14 h-4 bg-white"></div>
            <div className="absolute top-[-12px] left-6 w-10 h-4 bg-white"></div>
          </div>
        </div>

        {/* Cloud 3 - Center Right */}
        <div className="absolute bottom-10 right-[30%] opacity-25">
          <div className="relative">
            <div className="w-18 h-3 bg-white"></div>
            <div className="absolute top-[-6px] left-2 w-14 h-3 bg-white"></div>
            <div className="absolute top-[-10px] left-5 w-10 h-3 bg-white"></div>
          </div>
        </div>

        {/* Cloud 4 - Right */}
        <div className="absolute bottom-6 right-[8%] opacity-30">
          <div className="relative">
            <div className="w-16 h-3 bg-white"></div>
            <div className="absolute top-[-6px] left-2 w-12 h-3 bg-white"></div>
            <div className="absolute top-[-10px] left-4 w-8 h-3 bg-white"></div>
          </div>
        </div>
      </div>

      {/* Pixel treasure chests in corners */}
      {/* Left chest */}
      <div className="absolute bottom-4 left-4 z-20 pointer-events-none">
        <div className="relative w-10 h-10">
          {/* Chest body */}
          <div className="absolute bottom-0 w-10 h-7 bg-amber-700 border-2 border-amber-900"></div>
          {/* Chest lid */}
          <div className="absolute top-0 w-10 h-4 bg-amber-600 border-2 border-amber-900"></div>
          {/* Lock */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-2 h-3 bg-yellow-400 border border-yellow-600"></div>
          {/* Keyhole */}
          <div className="absolute top-5 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-amber-900"></div>
        </div>
      </div>

      {/* Right chest */}
      <div className="absolute bottom-4 right-4 z-20 pointer-events-none">
        <div className="relative w-10 h-10">
          {/* Chest body */}
          <div className="absolute bottom-0 w-10 h-7 bg-amber-700 border-2 border-amber-900"></div>
          {/* Chest lid */}
          <div className="absolute top-0 w-10 h-4 bg-amber-600 border-2 border-amber-900"></div>
          {/* Lock */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-2 h-3 bg-yellow-400 border border-yellow-600"></div>
          {/* Keyhole */}
          <div className="absolute top-5 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-amber-900"></div>
        </div>
      </div>

      {/* Floating fireflies */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-yellow-300 rounded-full pixel-firefly"
            style={{
              left: `${15 + Math.random() * 70}%`,
              top: `${40 + Math.random() * 40}%`,
              animationDelay: `${Math.random() * 4}s`,
              opacity: 0.7,
            }}
          />
        ))}
      </div>

    </div>
  );
};