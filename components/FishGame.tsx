import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Fish, Bullet, Particle, FishType } from '../types';
import { Sparkles, Target, Coins } from 'lucide-react';

interface FishGameProps {
  balance: number;
  setBalance: React.Dispatch<React.SetStateAction<number>>;
  onGameEvent: (event: string) => void;
  goBack: () => void;
}

// Configuration
const CANVAS_WIDTH = window.innerWidth;
const CANVAS_HEIGHT = window.innerHeight;
const BET_SIZES = [10, 50, 100, 500, 1000];

const FishGame: React.FC<FishGameProps> = ({ balance, setBalance, onGameEvent, goBack }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [betIndex, setBetIndex] = useState(0);
  const betAmount = BET_SIZES[betIndex];
  
  // Game State Refs (for loop performance)
  const fishesRef = useRef<Fish[]>([]);
  const bulletsRef = useRef<Bullet[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const lastTimeRef = useRef<number>(0);
  const scoreRef = useRef<number>(0);

  // Helper to create fish
  const spawnFish = () => {
    const side = Math.random() > 0.5 ? 'left' : 'right';
    const y = Math.random() * (CANVAS_HEIGHT - 100) + 50;
    const typeRoll = Math.random();
    
    let type = FishType.SMALL;
    let hp = 10;
    let value = 20;
    let emoji = '🐠';
    let size = 30;
    let speed = 2 + Math.random();

    if (typeRoll > 0.98) {
      type = FishType.BOSS;
      hp = 500;
      value = 2000;
      emoji = '🐲'; // Dragon/Kirin
      size = 80;
      speed = 1.5;
    } else if (typeRoll > 0.9) {
      type = FishType.LARGE;
      hp = 100;
      value = 300;
      emoji = '🦈';
      size = 60;
      speed = 1.8;
    } else if (typeRoll > 0.7) {
      type = FishType.MEDIUM;
      hp = 40;
      value = 80;
      emoji = '🐡';
      size = 45;
      speed = 1.5;
    }

    const fish: Fish = {
      id: Math.random().toString(36).substr(2, 9),
      x: side === 'left' ? -size : CANVAS_WIDTH + size,
      y,
      vx: side === 'left' ? speed : -speed,
      vy: Math.sin(Date.now() / 1000) * 0.5, // Slight wave motion
      type,
      hp,
      maxHp: hp,
      value,
      emoji,
      width: size,
      height: size,
      angle: 0
    };
    fishesRef.current.push(fish);
  };

  const createExplosion = (x: number, y: number, color: string, text?: string) => {
    // Text particle
    if (text) {
      particlesRef.current.push({
        id: Math.random().toString(),
        x, y,
        vx: 0, vy: -1,
        life: 60,
        color: '#FFD700',
        text
      });
    }
    
    // Sparkles
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8;
      particlesRef.current.push({
        id: Math.random().toString(),
        x, y,
        vx: Math.cos(angle) * 3,
        vy: Math.sin(angle) * 3,
        life: 20 + Math.random() * 10,
        color
      });
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    // Determine input coordinates
    let clientX, clientY;
    if ('touches' in e) {
       clientX = e.touches[0].clientX;
       clientY = e.touches[0].clientY;
    } else {
       clientX = (e as React.MouseEvent).clientX;
       clientY = (e as React.MouseEvent).clientY;
    }

    // Check balance
    if (balance < betAmount) {
      onGameEvent("INSUFFICIENT FUNDS! ADD COINS!");
      return;
    }

    // Deduct bet
    setBalance(prev => prev - betAmount);

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Turret position (bottom center)
    const turretX = CANVAS_WIDTH / 2;
    const turretY = CANVAS_HEIGHT;

    // Calculate angle
    const dx = clientX - turretX;
    const dy = clientY - turretY;
    const angle = Math.atan2(dy, dx);

    // Create bullet
    const bullet: Bullet = {
      id: Math.random().toString(),
      x: turretX,
      y: turretY,
      vx: Math.cos(angle) * 15,
      vy: Math.sin(angle) * 15,
      power: betAmount, // Bullet power scales with bet
      cost: betAmount
    };

    bulletsRef.current.push(bullet);
  };

  // Main Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize handling
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    let frameId: number;

    const render = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      // const deltaTime = timestamp - lastTimeRef.current; // Unused but good for physics
      lastTimeRef.current = timestamp;

      // Clear
      ctx.fillStyle = '#050b14'; // Deep ocean blue/black
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Background Grid (Simulate depth)
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for(let x=0; x<canvas.width; x+=50) { ctx.moveTo(x,0); ctx.lineTo(x, canvas.height); }
      for(let y=0; y<canvas.height; y+=50) { ctx.moveTo(0,y); ctx.lineTo(canvas.width, y); }
      ctx.stroke();

      // Spawn Logic (approx every 1s)
      if (Math.random() < 0.03) spawnFish();

      // Update & Draw Fish
      fishesRef.current.forEach((fish, index) => {
        fish.x += fish.vx;
        fish.y += fish.vy + Math.sin(timestamp / 500 + Number(fish.id)) * 0.5; // Wiggle

        // Remove if off screen
        if ((fish.vx > 0 && fish.x > canvas.width + 100) || (fish.vx < 0 && fish.x < -100)) {
          fishesRef.current.splice(index, 1);
          return;
        }

        // Draw Fish
        ctx.save();
        ctx.translate(fish.x, fish.y);
        ctx.scale(fish.vx > 0 ? -1 : 1, 1); // Flip if moving left (assumes emoji faces left)
        ctx.font = `${fish.width}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(fish.emoji, 0, 0);
        
        // HP Bar for big fish
        if (fish.type === FishType.BOSS || fish.type === FishType.LARGE) {
            ctx.fillStyle = 'red';
            ctx.fillRect(-20, -30, 40, 5);
            ctx.fillStyle = '#00ff00';
            ctx.fillRect(-20, -30, 40 * (fish.hp / fish.maxHp), 5);
        }
        
        ctx.restore();
      });

      // Update & Draw Bullets
      for (let i = bulletsRef.current.length - 1; i >= 0; i--) {
        const b = bulletsRef.current[i];
        b.x += b.vx;
        b.y += b.vy;

        // Check off screen
        if (b.x < 0 || b.x > canvas.width || b.y < 0 || b.y > canvas.height) {
          bulletsRef.current.splice(i, 1);
          continue;
        }

        // Collision Detection
        let hit = false;
        for (let j = fishesRef.current.length - 1; j >= 0; j--) {
          const f = fishesRef.current[j];
          const dist = Math.hypot(b.x - f.x, b.y - f.y);
          if (dist < f.width / 1.5) {
            // HIT!
            hit = true;
            createExplosion(b.x, b.y, '#ffff00'); // Spark on hit
            
            // Damage calc (simple)
            // Critical hit chance?
            const isCrit = Math.random() < 0.1;
            const dmg = isCrit ? b.power * 2 : b.power;
            f.hp -= dmg;

            if (f.hp <= 0) {
              // FISH CAUGHT!
              const winAmount = f.value * (b.cost / 10); // Scale win by bet
              setBalance(prev => prev + winAmount);
              scoreRef.current += winAmount;
              createExplosion(f.x, f.y, '#00ff00', `+${Math.floor(winAmount)}`);
              fishesRef.current.splice(j, 1);
              
              if (f.type === FishType.BOSS) {
                  onGameEvent(`BOSS DEFEATED! HUGE WIN: ${winAmount}`);
              }
            }
            break; // Bullet hits one fish
          }
        }

        if (hit) {
          bulletsRef.current.splice(i, 1);
          continue;
        }

        // Draw Bullet
        ctx.beginPath();
        ctx.arc(b.x, b.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#00ffff'; // Neon cyan
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00ffff';
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Update & Draw Particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life--;

        if (p.life <= 0) {
          particlesRef.current.splice(i, 1);
          continue;
        }

        if (p.text) {
          ctx.save();
          ctx.font = 'bold 24px Arial';
          ctx.fillStyle = p.color;
          ctx.strokeStyle = 'black';
          ctx.lineWidth = 2;
          ctx.strokeText(p.text, p.x, p.y);
          ctx.fillText(p.text, p.x, p.y);
          ctx.restore();
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.fill();
        }
      }

      // Draw Turret Base
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height);
      ctx.beginPath();
      ctx.arc(0, 0, 40, Math.PI, 0);
      ctx.fillStyle = '#334155';
      ctx.fill();
      ctx.strokeStyle = '#00BFFF';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();

      frameId = requestAnimationFrame(render);
    };

    render(0);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(frameId);
    };
  }, [balance, betAmount, setBalance, onGameEvent]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      <canvas 
        ref={canvasRef} 
        onClick={handleCanvasClick}
        onTouchStart={handleCanvasClick}
        className="block w-full h-full cursor-crosshair touch-none"
      />
      
      {/* HUD - Top Bar */}
      <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
        <div className="flex items-center gap-2">
            <button onClick={goBack} className="pointer-events-auto bg-red-600/80 hover:bg-red-500 text-white px-4 py-1 rounded font-bold arcade-font text-sm border-2 border-red-400">
                EXIT
            </button>
            <div className="bg-slate-900/80 border border-slate-700 px-4 py-2 rounded-full flex items-center gap-2 text-kirin-gold font-bold text-xl shadow-[0_0_15px_rgba(255,215,0,0.3)]">
                <Coins className="w-5 h-5" />
                <span>{Math.floor(balance).toLocaleString()}</span>
            </div>
        </div>
        <div className="text-white/50 text-xs arcade-font">
            ONGAMES PLATFORM V2.0
        </div>
      </div>

      {/* HUD - Bottom Control Deck */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 pointer-events-none">
         <div className="bg-black/60 backdrop-blur-md p-2 rounded-2xl border border-white/10 flex items-center gap-4 pointer-events-auto">
            <button 
                onClick={() => setBetIndex(i => Math.max(0, i - 1))}
                className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-white hover:bg-slate-700 active:scale-95 transition"
            >
                -
            </button>
            <div className="flex flex-col items-center min-w-[80px]">
                <span className="text-[10px] text-gray-400 uppercase tracking-widest">BET</span>
                <span className="text-2xl font-black text-cyan-400 drop-shadow-[0_0_5px_rgba(0,255,255,0.8)]">{betAmount}</span>
            </div>
            <button 
                onClick={() => setBetIndex(i => Math.min(BET_SIZES.length - 1, i + 1))}
                className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-white hover:bg-slate-700 active:scale-95 transition"
            >
                +
            </button>
         </div>
         
         <div className="bg-black/60 backdrop-blur-md p-3 rounded-2xl border border-kirin-gold/30 pointer-events-auto cursor-pointer active:scale-95 transition hover:bg-kirin-gold/10">
            <div className="flex flex-col items-center">
                <Target className="w-6 h-6 text-kirin-gold" />
                <span className="text-[10px] text-kirin-gold font-bold">AUTO</span>
            </div>
         </div>
      </div>
    </div>
  );
};

export default FishGame;