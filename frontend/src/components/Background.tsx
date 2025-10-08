import React, { useEffect, useRef } from 'react';

// Canvas-based pixel city background with twinkling stars, parallax buildings,
// occasional plane, CRT scanlines, and vignette. Accepts children layered on top.
export function PixelBackground({ children }: { children?: React.ReactNode }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Array<{ x: number; y: number; size: number; blinkSpeed: number; blinkPhase: number }>>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      if (starsRef.current.length === 0) {
        for (let i = 0; i < 80; i++) {
          starsRef.current.push({
            x: Math.random() * canvas.width,
            y: Math.random() * (canvas.height * 0.4),
            size: Math.random() > 0.7 ? 2 : 1,
            blinkSpeed: 0.02 + Math.random() * 0.03,
            blinkPhase: Math.random() * Math.PI * 2,
          });
        }
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    let frame = 0;
    let buildingOffset = 0;
    let planeX = canvas.width + 100;
    let planeY = 150;
    let planeActive = false;
    let nextPlaneSpawn = Math.random() * 600 + 400;

    const drawPixelRect = (x: number, y: number, width: number, height: number, color: string) => {
      ctx.fillStyle = color;
      ctx.fillRect(Math.floor(x), Math.floor(y), Math.floor(width), Math.floor(height));
    };

    const drawBuilding = (x: number, baseY: number, width: number, height: number, windowColor: string) => {
      drawPixelRect(x, baseY - height, width, height, '#1a1a2e');
      const windowWidth = 3;
      const windowHeight = 4;
      const windowSpacing = 8;
      for (let wy = 0; wy < height - 10; wy += windowSpacing) {
        for (let wx = 4; wx < width - 4; wx += windowSpacing) {
          if (Math.random() > 0.3) {
            drawPixelRect(x + wx, baseY - height + wy + 6, windowWidth, windowHeight, windowColor);
          }
        }
      }
      if (Math.random() > 0.5) {
        drawPixelRect(x + width / 2 - 1, baseY - height - 8, 2, 8, '#F0A3C3');
      }
    };

    const drawPlane = (x: number, y: number) => {
      drawPixelRect(x, y, 32, 8, '#E6E6FA');
      drawPixelRect(x - 8, y + 2, 8, 4, '#B0C4DE');
      drawPixelRect(x + 8, y - 6, 12, 6, '#D8BFD8');
      drawPixelRect(x + 8, y + 8, 12, 6, '#D8BFD8');
      drawPixelRect(x + 28, y - 8, 8, 8, '#DDA0DD');
      drawPixelRect(x + 32, y + 2, 4, 4, '#D8BFD8');
      drawPixelRect(x - 4, y + 3, 2, 2, '#87CEEB');
      drawPixelRect(x + 4, y + 3, 2, 2, '#4A4A4A');
      drawPixelRect(x + 10, y + 3, 2, 2, '#4A4A4A');
      drawPixelRect(x + 16, y + 3, 2, 2, '#4A4A4A');
      if (Math.floor(frame / 8) % 2 === 0) {
        drawPixelRect(x + 36, y + 3, 3, 2, '#FFD700');
      }
    };

    const animate = () => {
      frame++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#0f0e33');
      gradient.addColorStop(0.4, '#1a1a4e');
      gradient.addColorStop(1, '#2d1b69');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      starsRef.current.forEach((star) => {
        star.blinkPhase += star.blinkSpeed;
        const opacity = (Math.sin(star.blinkPhase) + 1) / 2;
        const brightness = Math.floor(opacity * 255);
        ctx.fillStyle = `rgb(${brightness}, ${brightness}, ${255})`;
        drawPixelRect(star.x, star.y, star.size, star.size, ctx.fillStyle as string);
      });

      drawPixelRect(canvas.width - 100, 60, 40, 40, '#ffd700');
      drawPixelRect(canvas.width - 90, 70, 8, 8, '#1a1a4e');
      drawPixelRect(canvas.width - 75, 80, 6, 6, '#1a1a4e');

      if (!planeActive && frame >= nextPlaneSpawn) {
        planeActive = true;
        planeX = canvas.width + 100;
        planeY = 100 + Math.random() * 150;
      }
      if (planeActive) {
        drawPlane(planeX, planeY);
        planeX -= 3;
        if (planeX < -100) {
          planeActive = false;
          nextPlaneSpawn = frame + Math.random() * 600 + 400;
        }
      }

      const farBuildingY = canvas.height * 0.65;
      buildingOffset += 0.5;
      for (let i = -2; i < 10; i++) {
        const x = i * 120 - ((buildingOffset * 0.3) % 120);
        const heightVariation = 60 + (i % 3) * 40;
        drawBuilding(x, farBuildingY, 80, heightVariation, '#DDA0DD');
      }

      const midBuildingY = canvas.height * 0.75;
      for (let i = -2; i < 10; i++) {
        const x = i * 140 - ((buildingOffset * 0.6) % 140);
        const heightVariation = 100 + (i % 4) * 50;
        drawBuilding(x, midBuildingY, 100, heightVariation, '#B0E0E6');
      }

      const nearBuildingY = canvas.height * 0.9;
      for (let i = -2; i < 8; i++) {
        const x = i * 180 - (buildingOffset % 180);
        const heightVariation = 150 + (i % 3) * 80;
        drawBuilding(x, nearBuildingY, 140, heightVariation, '#FFB6C1');
      }

      const charX = 60;
      const charY = canvas.height - 140;
      const scale = 2.5;
      drawPixelRect(charX + 20 * scale, charY + 24 * scale, 24 * scale, 3 * scale, '#555555');
      drawPixelRect(charX + 22 * scale, charY + 18 * scale, 20 * scale, 8 * scale, '#333333');
      drawPixelRect(charX + 24 * scale, charY + 20 * scale, 16 * scale, 5 * scale, '#00ff00');
      drawPixelRect(charX + 8 * scale, charY, 8 * scale, 8 * scale, '#ffcc99');
      drawPixelRect(charX + 10 * scale, charY + 2 * scale, 2 * scale, 2 * scale, '#000000');
      drawPixelRect(charX + 14 * scale, charY + 2 * scale, 2 * scale, 2 * scale, '#000000');
      drawPixelRect(charX + 6 * scale, charY + 8 * scale, 12 * scale, 12 * scale, '#4169e1');
      const armFrame = Math.floor(frame / 15) % 2;
      if (armFrame === 0) {
        drawPixelRect(charX + 18 * scale, charY + 12 * scale, 6 * scale, 2 * scale, '#ffcc99');
        drawPixelRect(charX + 4 * scale, charY + 14 * scale, 6 * scale, 2 * scale, '#ffcc99');
      } else {
        drawPixelRect(charX + 18 * scale, charY + 14 * scale, 6 * scale, 2 * scale, '#ffcc99');
        drawPixelRect(charX + 4 * scale, charY + 12 * scale, 6 * scale, 2 * scale, '#ffcc99');
      }
      drawPixelRect(0, canvas.height - 30, canvas.width, 30, '#16213e');
      for (let x = 0; x < canvas.width; x += 8) {
        drawPixelRect(x, canvas.height - 30, 1, 1, '#0f3460');
      }
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      for (let y = 0; y < canvas.height; y += 4) {
        ctx.fillRect(0, y, canvas.width, 2);
      }
      const vignette = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        canvas.width * 0.3,
        canvas.width / 2,
        canvas.height / 2,
        canvas.width * 0.8,
      );
      vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vignette.addColorStop(1, 'rgba(0, 0, 0, 0.5)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      requestAnimationFrame(animate);
    };

    animate();
    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <div className="relative isolate w-full min-h-[100dvh] overflow-hidden">
      <div className="absolute inset-0 z-0 w-full h-full overflow-hidden pointer-events-none" aria-hidden>
        <canvas ref={canvasRef} className="w-full h-full" style={{ imageRendering: 'pixelated' }} />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.08), rgba(0, 0, 0, 0.08) 1px, transparent 1px, transparent 2px)',
            animation: 'flicker 0.15s infinite',
          }}
        />
      </div>
      <style>{
        `@keyframes flicker { 0% { opacity: 0.97; } 50% { opacity: 1; } 100% { opacity: 0.97; } }`
      }</style>
      <div className="relative z-10 min-h-screen">{children}</div>
    </div>
  );
}
