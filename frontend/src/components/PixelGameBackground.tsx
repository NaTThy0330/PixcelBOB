import React from 'react';

// New pixel-art animated background with parallax cityscape, blinking lights,
// step-based sprite typing, and CRT scanline overlay. Keeps children content on top.
export const PixelGameBackground: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="relative w-full min-h-[100dvh] overflow-hidden bg-[#1a1f3a] image-rendering-pixelated">
      {/* Sky gradient */}
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(180deg, #0e1330 0%, #1a1f3a 50%, #221a3a 100%)'
      }} />

      {/* Stars layer */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(60)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white pixel-star"
            style={{
              left: `${(i * 17) % 100}%`,
              top: `${(i * 29) % 60}%`,
              animationDelay: `${(i % 10) * 0.3}s`,
            }}
          />
        ))}
      </div>

      {/* Parallax city layers */}
      <div className="absolute inset-x-0 parallax-layer parallax-slow overflow-hidden" style={{ bottom: '24vh', height: '22vh' }}>
        {/* Far skyline silhouette (looped) */}
        <div className="parallax-track absolute bottom-0 inset-x-0 flex gap-2 px-4">
          {[...Array(24)].map((_, i) => (
            <div key={`far-a-${i}`} className="bg-[#1c2246] border border-[#2a3168]" style={{ width: 28, height: 24 + ((i * 7) % 44) }} />
          ))}
          {[...Array(24)].map((_, i) => (
            <div key={`far-b-${i}`} className="bg-[#1c2246] border border-[#2a3168]" style={{ width: 28, height: 24 + ((i * 7) % 44) }} />
          ))}
        </div>
      </div>

      <div className="absolute inset-x-0 parallax-layer parallax-mid overflow-hidden" style={{ bottom: '14vh', height: '28vh' }}>
        {/* Mid buildings with blinking windows (looped) */}
        <div className="parallax-track absolute bottom-0 inset-x-0 flex gap-3 px-6">
          {[...Array(18)].map((_, i) => (
            <div key={`mid-a-${i}`} className="relative bg-[#222a59] border-2 border-[#2f3780]" style={{ width: 40, height: 36 + ((i * 11) % 72) }}>
              {[...Array(16)].map((__, w) => (
                <div key={w} className="absolute window-blink" style={{
                  width: 2, height: 2,
                  left: 6 + (w % 4) * 8,
                  top: 8 + Math.floor(w / 4) * 8,
                  backgroundColor: '#ffe37a',
                  animationDelay: `${((i + w) % 7) * 0.35}s`,
                }} />
              ))}
            </div>
          ))}
          {[...Array(18)].map((_, i) => (
            <div key={`mid-b-${i}`} className="relative bg-[#222a59] border-2 border-[#2f3780]" style={{ width: 40, height: 36 + ((i * 11) % 72) }}>
              {[...Array(16)].map((__, w) => (
                <div key={w} className="absolute window-blink" style={{
                  width: 2, height: 2,
                  left: 6 + (w % 4) * 8,
                  top: 8 + Math.floor(w / 4) * 8,
                  backgroundColor: '#ffe37a',
                  animationDelay: `${((i + w) % 7) * 0.35}s`,
                }} />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 parallax-layer parallax-fast overflow-hidden" style={{ height: '16vh' }}>
        {/* Foreground low buildings (looped) */}
        <div className="parallax-track absolute bottom-0 inset-x-0 flex gap-4 px-8">
          {[...Array(14)].map((_, i) => (
            <div key={`near-a-${i}`} className="bg-[#2a356f] border-2 border-[#3a4595]" style={{ width: 44, height: 18 + ((i * 13) % 44) }} />
          ))}
          {[...Array(14)].map((_, i) => (
            <div key={`near-b-${i}`} className="bg-[#2a356f] border-2 border-[#3a4595]" style={{ width: 44, height: 18 + ((i * 13) % 44) }} />
          ))}
        </div>
      </div>

      {/* Pixel character typing on a laptop */}
      <div className="absolute z-20" style={{ bottom: '12vh', left: '6vw' }}>
        <div className="relative sprite-typing-step">
          {/* Body (scaled slightly larger for visibility) */}
          <div className="w-10 h-14 bg-pink-300 border-2 border-pink-400">
            {/* Head */}
            <div className="absolute -top-7 left-1 w-8 h-8 bg-yellow-50 border-2 border-yellow-400 rounded-sm">
              <div className="absolute -top-2 -left-1 w-9 h-3 bg-amber-700 border border-amber-800 rounded-sm"></div>
              {/* Eyes blinking */}
              <div className="absolute top-1 left-1 w-1 h-1 bg-black rounded-full eye-blink"></div>
              <div className="absolute top-1 right-1 w-1 h-1 bg-black rounded-full eye-blink" style={{ animationDelay: '0.2s' }}></div>
            </div>
            {/* Arms typing step-based */}
            <div className="absolute top-3 -left-2 w-2 h-4 bg-yellow-50 border border-yellow-400 rounded-sm arm-step"></div>
            <div className="absolute top-3 -right-2 w-2 h-4 bg-yellow-50 border border-yellow-400 rounded-sm arm-step" style={{ animationDelay: '.12s' }}></div>
          </div>
          {/* Laptop */}
          <div className="absolute top-0 left-8 w-7 h-5 bg-gray-300 border-2 border-gray-500">
            <div className="absolute inset-0 bg-blue-600/30 laptop-glow"></div>
          </div>
        </div>
      </div>

      {/* CRT overlay with scanlines and vignette */}
      <div className="absolute inset-0 pointer-events-none crt-overlay" />

      {/* Content */}
      <div className="relative z-20 min-h-screen">
        {children}
      </div>
    </div>
  );
};
