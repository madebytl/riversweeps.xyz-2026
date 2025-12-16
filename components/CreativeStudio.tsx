import React, { useState } from 'react';
import { generateCasinoImage, editCasinoImage } from '../services/geminiService';
import { Wand2, Image as ImageIcon, Download, Loader2, ArrowLeft } from 'lucide-react';

interface CreativeStudioProps {
    goBack: () => void;
    onGameEvent: (msg: string) => void;
}

const CreativeStudio: React.FC<CreativeStudioProps> = ({ goBack, onGameEvent }) => {
    const [activeTab, setActiveTab] = useState<'gen' | 'edit'>('gen');
    const [prompt, setPrompt] = useState('');
    const [size, setSize] = useState<'1K' | '2K' | '4K'>('1K');
    const [currentImage, setCurrentImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        setLoading(true);
        setError('');
        try {
            const result = await generateCasinoImage(prompt, size);
            if (result) {
                setCurrentImage(result);
                onGameEvent("Generated a new masterpiece!");
            } else {
                setError("No image returned. Try a different prompt.");
            }
        } catch (e) {
            setError("Generation failed. System overloaded.");
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = async () => {
        if (!prompt.trim() || !currentImage) return;
        setLoading(true);
        setError('');
        try {
            const result = await editCasinoImage(currentImage, prompt);
            if (result) {
                setCurrentImage(result);
                onGameEvent("Image modified successfully!");
            } else {
                setError("Edit failed. Try rephrasing.");
            }
        } catch (e) {
            setError("Edit failed. System overloaded.");
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setCurrentImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="min-h-screen bg-[#050b14] flex flex-col items-center p-4 relative">
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-50"></div>
             
             {/* Header */}
             <div className="z-10 w-full max-w-4xl flex justify-between items-center mb-8 bg-slate-900/80 p-4 rounded-2xl border border-kirin-blue/30 backdrop-blur-md">
                <button onClick={goBack} className="flex items-center gap-2 text-gray-400 hover:text-white transition">
                    <ArrowLeft className="w-5 h-5" /> LOBBY
                </button>
                <h1 className="text-3xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-kirin-blue arcade-font">
                    NANO BANANA STUDIO
                </h1>
                <div className="w-8"></div> {/* Spacer */}
             </div>

             <div className="z-10 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Control Panel */}
                <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl h-fit">
                    <div className="flex gap-2 mb-6 p-1 bg-black rounded-xl">
                        <button 
                            onClick={() => setActiveTab('gen')}
                            className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${activeTab === 'gen' ? 'bg-kirin-blue text-black shadow-[0_0_15px_rgba(0,191,255,0.5)]' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            <Wand2 className="w-4 h-4" /> GENERATE
                        </button>
                        <button 
                            onClick={() => setActiveTab('edit')}
                            className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${activeTab === 'edit' ? 'bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.5)]' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            <ImageIcon className="w-4 h-4" /> EDIT
                        </button>
                    </div>

                    <div className="space-y-6">
                        {activeTab === 'gen' && (
                            <div>
                                <label className="block text-xs text-kirin-blue font-bold uppercase mb-2">Image Size</label>
                                <div className="grid grid-cols-3 gap-2 mb-4">
                                    {(['1K', '2K', '4K'] as const).map((s) => (
                                        <button
                                            key={s}
                                            onClick={() => setSize(s)}
                                            className={`py-2 rounded border font-mono text-sm ${size === s ? 'border-kirin-blue bg-kirin-blue/20 text-kirin-blue' : 'border-slate-700 text-gray-500'}`}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'edit' && (
                            <div>
                                <label className="block text-xs text-purple-400 font-bold uppercase mb-2">Source Image</label>
                                {currentImage ? (
                                    <div className="relative group rounded-lg overflow-hidden border border-slate-600 mb-4">
                                        <img src={currentImage} alt="Source" className="w-full h-32 object-cover opacity-50" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <label className="cursor-pointer bg-black/70 text-white px-4 py-2 rounded-full hover:bg-black text-xs font-bold border border-white/20">
                                                CHANGE IMAGE
                                                <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                                            </label>
                                        </div>
                                    </div>
                                ) : (
                                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-700 rounded-lg cursor-pointer hover:border-purple-500 hover:bg-slate-800 transition mb-4">
                                        <ImageIcon className="w-8 h-8 text-gray-500 mb-2" />
                                        <span className="text-xs text-gray-400">UPLOAD IMAGE TO EDIT</span>
                                        <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                                    </label>
                                )}
                            </div>
                        )}

                        <div>
                            <label className="block text-xs text-gray-400 font-bold uppercase mb-2">
                                {activeTab === 'gen' ? 'Describe your vision' : 'Edit Instructions'}
                            </label>
                            <textarea 
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                className="w-full bg-black border border-slate-700 rounded-xl p-4 text-white focus:outline-none focus:border-kirin-blue h-32 resize-none placeholder:text-gray-700"
                                placeholder={activeTab === 'gen' ? "A neon cyber-dragon playing poker..." : "Add a retro filter, remove background..."}
                            />
                        </div>

                        <button 
                            onClick={activeTab === 'gen' ? handleGenerate : handleEdit}
                            disabled={loading || !prompt.trim() || (activeTab === 'edit' && !currentImage)}
                            className={`w-full py-4 rounded-xl font-black text-lg shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                                activeTab === 'gen' 
                                ? 'bg-gradient-to-r from-kirin-blue to-blue-600 hover:from-blue-400 hover:to-blue-500 text-black' 
                                : 'bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-500 hover:to-purple-700 text-white'
                            }`}
                        >
                            {loading ? <Loader2 className="animate-spin" /> : <Wand2 fill="currentColor" />}
                            {activeTab === 'gen' ? 'GENERATE ART' : 'APPLY MAGIC'}
                        </button>
                        
                        {error && <div className="text-red-500 text-center text-sm font-bold animate-pulse">{error}</div>}
                    </div>
                </div>

                {/* Viewport */}
                <div className="bg-black border-2 border-slate-800 rounded-3xl p-2 shadow-2xl flex items-center justify-center relative min-h-[500px] overflow-hidden">
                    {/* Grid Background */}
                    <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                    
                    {currentImage ? (
                        <div className="relative group w-full h-full flex items-center justify-center">
                            <img src={currentImage} alt="Generated" className="max-w-full max-h-full rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.8)]" />
                            <a 
                                href={currentImage} 
                                download="game-vault-art.png"
                                className="absolute bottom-4 right-4 bg-white text-black p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-200"
                            >
                                <Download className="w-5 h-5" />
                            </a>
                        </div>
                    ) : (
                        <div className="text-center text-slate-700">
                            <Wand2 className="w-16 h-16 mx-auto mb-4 opacity-20" />
                            <p className="font-bold text-xl uppercase tracking-widest opacity-30">Studio Ready</p>
                        </div>
                    )}
                    
                    {loading && (
                        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-20">
                            <Loader2 className="w-12 h-12 text-kirin-blue animate-spin mb-4" />
                            <p className="text-kirin-blue font-mono animate-pulse">PROCESSING NEURAL DATA...</p>
                        </div>
                    )}
                </div>
             </div>
        </div>
    );
};

export default CreativeStudio;