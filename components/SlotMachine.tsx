import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Coins, Play, Zap, Volume2, VolumeX } from 'lucide-react';

interface SlotMachineProps {
  balance: number;
  setBalance: React.Dispatch<React.SetStateAction<number>>;
  jackpot: number;
  setJackpot: React.Dispatch<React.SetStateAction<number>>;
  onGameEvent: (event: string) => void;
  goBack: () => void;
}

const SYMBOLS = ['🍒', '🍋', '🍇', '💎', '7️⃣', '🐲'];
const WEIGHTS = [30, 25, 20, 15, 8, 2]; // Probabilities (higher index = rarer)

const SlotMachine: React.FC<SlotMachineProps> = ({ balance, setBalance, jackpot, setJackpot, onGameEvent, goBack }) => {
  const [reels, setReels] = useState<string[]>(['7️⃣', '7️⃣', '7️⃣']);
  const [spinning, setSpinning] = useState(false);
  const [bet, setBet] = useState(100);
  const [win, setWin] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [winningIndices, setWinningIndices] = useState<number[]>([]);
  
  // Audio Context Ref
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Ref to track latest jackpot for the closure in setInterval/finishSpin
  const jackpotRef = useRef(jackpot);
  useEffect(() => {
    jackpotRef.current = jackpot;
  }, [jackpot]);

  // Initialize Audio Context on first interaction
  const initAudio = () => {
    if (isMuted) return null;
    if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  const playSound = useCallback((type: 'spin' | 'stop' | 'win' | 'jackpot') => {
    if (isMuted) return;
    const ctx = initAudio();
    if (!ctx) return;

    const now = ctx.currentTime;
    
    // Create main oscillator for standard sounds
    // We only connect it if we are going to use it for spin/stop/jackpot
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'spin') {
        // Mechanical tick
        osc.type = 'square';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.05);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
    } else if (type === 'stop') {
        // Heavy thud
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.1);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
    } else if (type === 'win') {
        // Bright Arpeggio
        // We don't use the default 'osc' here, so we disconnect it to be clean and avoid leaks, 
        // though it wasn't started so it wouldn't play anyway.
        osc.disconnect(); 
        gain.disconnect();

        const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C E G C E
        notes.forEach((freq, i) => {
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.connect(g);
            g.connect(ctx.destination);
            o.type = 'sine';
            o.frequency.value = freq;
            g.gain.setValueAtTime(0, now + i * 0.08);
            g.gain.linearRampToValueAtTime(0.1, now + i * 0.08 + 0.02);
            g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.4);
            o.start(now + i * 0.08);
            o.stop(now + i * 0.08 + 0.5);
        });
    } else if (type === 'jackpot') {
        // Siren / Alarm
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.linearRampToValueAtTime(1200, now + 0.2);
        osc.frequency.linearRampToValueAtTime(600, now + 0.4);
        osc.frequency.linearRampToValueAtTime(1200, now + 0.6);
        osc.frequency.linearRampToValueAtTime(600, now + 0.8);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0, now + 1.2);
        osc.start(now);
        osc.stop(now + 1.2);
    }
  }, [isMuted]);

  const getRandomSymbol = () => {
    // Simple weighted random
    const totalWeight = WEIGHTS.reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;
    for (let i = 0; i < SYMBOLS.length; i++) {
        if (random < WEIGHTS[i]) return SYMBOLS[i];
        random -= WEIGHTS[i];
    }
    return SYMBOLS[0];
  };

  const spin = () => {
    if (spinning) return;
    // Try to resume context if it was suspended (browser policy)
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
    }
    
    if (balance < bet) {
        onGameEvent("BROKE? ASK THE PIT BOSS FOR LUCK!");
        return;
    }

    setBalance(prev => prev - bet);
    setWinningIndices([]); // Reset highlighting
    
    // Progressive Jackpot Contribution (10% of bet)
    const contribution = Math.floor(bet * 0.1);
    setJackpot(prev => prev + contribution);

    setSpinning(true);
    setWin(0);

    // Animation simulation
    let interval: ReturnType<typeof setInterval>;
    let counter = 0;
    
    interval = setInterval(() => {
        setReels([getRandomSymbol(), getRandomSymbol(), getRandomSymbol()]);
        playSound('spin'); // Tick sound
        counter++;
        if (counter > 20) { // Stop after ~2.0 seconds
            clearInterval(interval);
            finishSpin();
        }
    }, 80); 
  };

  const finishSpin = () => {
    const finalReels = [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()];
    setReels(finalReels);
    setSpinning(false);
    playSound('stop'); // Clunk sound
    
    // Check Win Logic
    let payout = 0;
    let newWinningIndices: number[] = [];
    
    // 3 match
    if (finalReels[0] === finalReels[1] && finalReels[1] === finalReels[2]) {
        newWinningIndices = [0, 1, 2];
        const symbolIndex = SYMBOLS.indexOf(finalReels[0]);
        // Base multiplier * rarity factor
        const multiplier = (symbolIndex + 1) * 10; 
        
        if (finalReels[0] === '🐲') {
             // GRAND JACKPOT WIN
             const wonJackpot = jackpotRef.current;
             onGameEvent(`GRAND JACKPOT!!! WON ${wonJackpot.toLocaleString()}`);
             payout = wonJackpot;
             setJackpot(50000); // Reset to seed amount
             playSound('jackpot');
        } else {
             payout = bet * multiplier;
             onGameEvent(`BIG WIN! ${finalReels[0]} TRIPLE!`);
             playSound('win');
        }
    } 
    // 2 match cases
    else if (finalReels[0] === finalReels[1]) {
        payout = Math.floor(bet * 1.5);
        playSound('win');
        newWinningIndices = [0, 1];
    } else if (finalReels[1] === finalReels[2]) {
        payout = Math.floor(bet * 1.5);
        playSound('win');
        newWinningIndices = [1, 2];
    } else if (finalReels[0] === finalReels[2]) {
        payout = Math.floor(bet * 1.5);
        playSound('win');
        newWinningIndices = [0, 2];
    }

    if (payout > 0) {
        setWin(payout);
        setBalance(prev => prev + payout);
        setWinningIndices(newWinningIndices);
    }
  };

  return (
    <div className="min-h-screen bg-[#050b14] flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-vault-purple/20 via-black to-black animate-pulse-fast"></div>
        
        <div className="z-10 w-full max-w-md bg-slate-900 border-4 border-vault-purple/50 rounded-3xl p-6 shadow-[0_0_50px_rgba(139,92,246,0.2)]">
            {/* Jackpot Ticker */}
            <div className="relative overflow-hidden bg-gradient-to-b from-purple-900 via-purple-700 to-purple-900 p-3 rounded-xl border-4 border-fuchsia-400 mb-6 w-full text-center shadow-[0_0_20px_rgba(168,85,247,0.6)]">
                {/* Shine effect */}
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_infinite]"></div>
                <div className="text-fuchsia-300 font-bold text-[10px] tracking-[0.3em] mb-1 uppercase animate-pulse">OnGames Grand</div>
                <div className="text-4xl font-black text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] font-mono tracking-tighter">
                    ${jackpot.toLocaleString()}
                </div>
            </div>

            {/* Header */}
            <div className="flex justify-between items-center mb-4">
                <button onClick={goBack} className="text-gray-400 hover:text-white text-sm">← LOBBY</button>
                <div className="text-vault-purple font-bold text-xl drop-shadow-md arcade-font">DRAGON SLOTS</div>
                <button 
                  onClick={() => setIsMuted(!isMuted)} 
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-800 hover:bg-slate-700 text-gray-300"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
            </div>

            {/* Reels Container */}
            <div className="flex justify-center gap-2 mb-8 bg-black p-4 rounded-xl border-t-4 border-b-4 border-slate-700 shadow-inner relative">
                {/* Visual Payline - lights up on win */}
                <div className={`absolute top-1/2 left-0 w-full h-[4px] -translate-y-1/2 z-20 pointer-events-none transition-all duration-300 ${winningIndices.length > 0 ? 'bg-fuchsia-400 shadow-[0_0_15px_#d946ef] opacity-80' : 'bg-red-500/30 opacity-50'}`}></div>
                
                {reels.map((symbol, idx) => {
                    const isWinning = winningIndices.includes(idx);
                    return (
                        <div key={idx} className={`w-24 h-32 bg-gradient-to-b from-white to-gray-200 rounded-lg flex items-center justify-center text-6xl shadow-lg relative overflow-hidden border-2 transition-all duration-300 ${isWinning ? 'border-fuchsia-400 shadow-[0_0_30px_rgba(217,70,239,0.8)] z-10 scale-105' : 'border-gray-300'}`}>
                           <div className={`${spinning ? 'animate-slot-scroll' : 'animate-slot-land'}`}>
                             {symbol}
                           </div>
                           {/* Shiny reflection */}
                           <div className="absolute top-0 left-0 w-full h-1/2 bg-white/30 skew-y-12 pointer-events-none"></div>
                        </div>
                    );
                })}
            </div>

            {/* Win Display */}
            <div className="h-16 flex items-center justify-center mb-4">
                {win > 0 && (
                    <div className="text-4xl font-black text-green-400 animate-bounce drop-shadow-[0_0_10px_rgba(0,255,0,0.8)]">
                        +{win.toLocaleString()}
                    </div>
                )}
                {win === 0 && !spinning && <div className="text-gray-500 text-sm">SPIN TO WIN</div>}
                {spinning && <div className="text-vault-purple text-sm animate-pulse">GOOD LUCK...</div>}
            </div>

            {/* Controls */}
            <div className="grid grid-cols-2 gap-4">
                 <div className="bg-slate-800 p-3 rounded-xl flex flex-col items-center justify-center border border-slate-700">
                    <span className="text-xs text-gray-400">BALANCE</span>
                    <div className="flex items-center gap-1 text-kirin-gold font-bold">
                        <Coins className="w-4 h-4" />
                        {balance.toLocaleString()}
                    </div>
                 </div>
                 
                 <div className="bg-slate-800 p-3 rounded-xl flex flex-col items-center justify-center border border-slate-700">
                    <span className="text-xs text-gray-400">BET</span>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setBet(b => Math.max(10, b - 10))} className="text-gray-400 hover:text-white">-</button>
                        <span className="text-white font-bold">{bet}</span>
                        <button onClick={() => setBet(b => b + 10)} className="text-gray-400 hover:text-white">+</button>
                    </div>
                 </div>

                 <button 
                    onClick={spin}
                    disabled={spinning}
                    className="col-span-2 bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-500 hover:to-purple-700 text-white font-black text-2xl py-6 rounded-2xl shadow-lg active:translate-y-1 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 border-b-4 border-purple-900"
                 >
                    {spinning ? <Zap className="animate-spin" /> : <Play fill="currentColor" />}
                    SPIN
                 </button>
            </div>
        </div>
    </div>
  );
};

export default SlotMachine;