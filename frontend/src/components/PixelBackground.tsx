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
      <div className="relative z-10 min-h-screen flex flex-col">
        <div className="flex-1 pb-24">
          {children}
        </div>

        {/* Grass at bottom */}
        <div 
          className="absolute bottom-0 w-full h-24 pixel-grass"
          style={{ backgroundColor: '#61A563' }}
        >
          {/* Grass blades */}
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute bottom-0 w-1 bg-green-600"
              style={{
                left: `${i * 3.33}%`,
                height: `${16 + Math.random() * 16}px`,
              }}
            />
          ))}
        </div>

        {/* Character sitting on grass */}
        <div className="absolute bottom-6 left-8 z-20">
          <div className="relative">
            {/* Character body */}
            <div className="w-8 h-12 bg-pink-300 border-2 border-pink-400 pixel-character">
              {/* Head */}
              <div className="absolute -top-6 left-1 w-6 h-6 bg-peach-200 border-2 border-peach-300 rounded-sm">
                {/* Hair */}
                <div className="absolute -top-2 -left-1 w-8 h-4 bg-amber-700 border border-amber-800 rounded-sm"></div>
                {/* Eyes */}
                <div className="absolute top-1 left-1 w-1 h-1 bg-black rounded-full"></div>
                <div className="absolute top-1 right-1 w-1 h-1 bg-black rounded-full"></div>
              </div>
              {/* Arms */}
              <div className="absolute top-2 -left-2 w-2 h-4 bg-peach-200 border border-peach-300 rounded-sm"></div>
              <div className="absolute top-2 -right-2 w-2 h-4 bg-peach-200 border border-peach-300 rounded-sm"></div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};