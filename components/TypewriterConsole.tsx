import React, { useState } from 'react';
import { TypewriterState } from '../types';
import { polishTextToVintage } from '../services/geminiService';
import { Sparkles, Printer, Trash2, MessageSquare, BatteryMedium, Signal } from 'lucide-react';

interface TypewriterConsoleProps {
  onPrint: (text: string) => void;
  onClearAll: () => void;
}

// Synthesize a "Message Sent" swoosh sound using Web Audio API
const playPrintSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();
    const t = ctx.currentTime;

    // We create a clean sine wave sweep (The "Woosh")
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = 'sine';
    
    // Frequency Sweep: Start low-ish and sweep up quickly
    osc.frequency.setValueAtTime(180, t); 
    osc.frequency.exponentialRampToValueAtTime(800, t + 0.25); // Smooth upward sweep
    
    // Envelope: Fast attack, smooth decay
    gainNode.gain.setValueAtTime(0, t);
    gainNode.gain.linearRampToValueAtTime(0.2, t + 0.02); // Quick fade in
    gainNode.gain.exponentialRampToValueAtTime(0.001, t + 0.4); // Natural fade out
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start(t);
    osc.stop(t + 0.5);

    // Optional: A very subtle second layer for "airiness"
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(300, t);
    osc2.frequency.exponentialRampToValueAtTime(600, t + 0.1);
    
    gain2.gain.setValueAtTime(0, t);
    gain2.gain.linearRampToValueAtTime(0.05, t + 0.02);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    
    osc2.start(t);
    osc2.stop(t + 0.3);

  } catch (e) {
    console.error("Audio play failed", e);
  }
};

export const TypewriterConsole: React.FC<TypewriterConsoleProps> = ({ onPrint, onClearAll }) => {
  const [input, setInput] = useState('');
  const [state, setState] = useState<TypewriterState>(TypewriterState.IDLE);

  const handlePolish = async () => {
    if (!input.trim()) return;
    
    setState(TypewriterState.THINKING);
    const polished = await polishTextToVintage(input);
    setInput(polished);
    setState(TypewriterState.IDLE);
  };

  const handlePrint = () => {
    if (!input.trim()) return;
    playPrintSound(); // Play sound effect
    onPrint(input);
    setInput('');
  };

  return (
    // Container wraps the device
    // Removed fixed positioning/margins so the parent can handle dragging
    <div className="relative pointer-events-auto transition-transform duration-300">
      
      {/* Realistic Device Container */}
      <div 
        className="relative w-[350px] md:w-[440px] bg-gradient-to-b from-lime-500 to-lime-600 rounded-[3rem] p-6 shadow-2xl border-t border-white/30"
        style={{
          boxShadow: `
            0 50px 60px -20px rgba(0,0,0,0.6),
            inset 0 2px 10px rgba(255,255,255,0.4),
            inset 0 -10px 20px rgba(0,0,0,0.2)
          `
        }}
      >
        {/* Texture overlay */}
        <div className="absolute inset-0 rounded-[3rem] bg-[url('https://www.transparenttextures.com/patterns/noise-lines.png')] opacity-20 pointer-events-none mix-blend-overlay"></div>

        {/* Paper Exit Slot - Visual Only (Top Center) */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-64 h-5 bg-gray-900 rounded-full shadow-inner border-b border-gray-700 z-0"></div>
        
        {/* Glossy Highlight on Top Edge */}
        <div className="absolute top-2 left-10 right-10 h-1 bg-gradient-to-r from-transparent via-white/60 to-transparent rounded-full blur-[1px]"></div>

        {/* Inner Bezel/Frame */}
        <div className="relative bg-[#8ec93e] rounded-3xl p-4 shadow-[inset_0_4px_8px_rgba(0,0,0,0.3),0_2px_4px_rgba(255,255,255,0.2)] border border-lime-700/20">
          
          {/* Top Panel (Brand & Indicators) */}
          <div className="flex justify-between items-end mb-3 px-2">
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_5px_red]"></div>
                <span className="text-[10px] font-black tracking-widest text-lime-900 uppercase font-['VT323']">Auto-Feed</span>
              </div>
              <div className="text-lime-800/60 text-[9px] font-bold tracking-[0.2em] uppercase mt-0.5">Series 9000</div>
            </div>
            <div className="flex items-center gap-1 opacity-60 text-lime-900">
              <Signal size={14} />
              <span className="text-xs font-['VT323']">5G</span>
            </div>
          </div>

          {/* The Screen (LCD) */}
          <div className="bg-[#0d160d] rounded-xl p-1 pb-0 shadow-[inset_0_0_20px_rgba(0,0,0,1)] border-b-2 border-white/10 relative overflow-hidden">
            {/* Screen Scanlines */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_2px,3px_100%] pointer-events-none"></div>
            
            <div className="relative z-20 p-2">
              <div className="flex justify-between text-[#1a5c1a] text-xs mb-1 font-['VT323'] border-b border-[#1a5c1a]/30 pb-1">
                <div className="flex gap-2 items-center">
                  <MessageSquare size={12} />
                  <span>COMPOSE_MODE</span>
                </div>
                <BatteryMedium size={12} />
              </div>

              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="w-full h-20 bg-transparent resize-none outline-none font-['VT323'] text-xl text-[#4aff4a] placeholder-[#1a5c1a] uppercase tracking-wider leading-tight"
                placeholder="TYPE MESSAGE HERE..."
                spellCheck={false}
                style={{ textShadow: '0 0 5px rgba(74, 255, 74, 0.5)' }}
              />
            </div>
            
            {/* Loading Overlay */}
            {state === TypewriterState.THINKING && (
              <div className="absolute inset-0 bg-[#0d160d]/95 z-30 flex flex-col items-center justify-center">
                 <span className="text-[#4aff4a] font-['VT323'] text-lg animate-pulse">AI REWRITING...</span>
                 <div className="w-32 h-1 bg-[#1a5c1a] mt-2">
                   <div className="h-full bg-[#4aff4a] animate-progress"></div>
                 </div>
              </div>
            )}
          </div>

          {/* Control Panel / Buttons */}
          <div className="mt-5 grid grid-cols-5 gap-3 items-center">
            
            {/* Action Button: Magic */}
            <button
              onClick={handlePolish}
              disabled={state !== TypewriterState.IDLE || !input.trim()}
              className="col-span-1 aspect-square rounded-full bg-zinc-800 shadow-[0_4px_0_#000,0_5px_10px_rgba(0,0,0,0.5)] active:shadow-none active:translate-y-1 transition-all border-t border-zinc-600 flex items-center justify-center group relative overflow-hidden"
              title="AI Retro-fy"
            >
               <div className="absolute inset-0 bg-gradient-to-tr from-transparent to-white/10 rounded-full"></div>
               <Sparkles size={18} className="text-gray-400 group-hover:text-yellow-300 transition-colors" />
            </button>

             {/* Action Button: Clear */}
            <button
              onClick={onClearAll}
              className="col-span-1 aspect-square rounded-full bg-zinc-800 shadow-[0_4px_0_#000,0_5px_10px_rgba(0,0,0,0.5)] active:shadow-none active:translate-y-1 transition-all border-t border-zinc-600 flex items-center justify-center group relative overflow-hidden"
              title="Trash"
            >
               <div className="absolute inset-0 bg-gradient-to-tr from-transparent to-white/10 rounded-full"></div>
               <Trash2 size={18} className="text-gray-400 group-hover:text-red-400 transition-colors" />
            </button>

            {/* Decorative Grill */}
            <div className="col-span-1 flex flex-col items-center gap-1 px-2">
              <div className="w-full h-1 bg-lime-900/20 rounded-full"></div>
              <div className="w-full h-1 bg-lime-900/20 rounded-full"></div>
              <div className="w-full h-1 bg-lime-900/20 rounded-full"></div>
              <div className="w-full h-1 bg-lime-900/20 rounded-full"></div>
            </div>

            {/* Big Print Button */}
            <button
              onClick={handlePrint}
              disabled={state !== TypewriterState.IDLE || !input.trim()}
              className="col-span-2 h-14 bg-orange-600 rounded-lg shadow-[0_5px_0_#9a3412,0_8px_15px_rgba(0,0,0,0.4)] active:shadow-none active:translate-y-[5px] transition-all border-t border-orange-400 flex items-center justify-center gap-2 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/20 to-transparent"></div>
              <span className="font-['VT323'] text-2xl text-orange-950 font-bold drop-shadow-sm mt-1">PRINT</span>
              <Printer size={20} className="text-orange-950 mb-0.5" />
            </button>

          </div>
        </div>

        {/* Bottom branding sticker */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/80 px-3 py-0.5 rounded text-[10px] text-lime-500 font-['Noto_Serif_SC'] font-bold tracking-widest border border-lime-500/30 shadow-sm whitespace-nowrap">
          王哥哥
        </div>

      </div>
      
      {/* Reflection on desk */}
      <div className="absolute -bottom-4 left-10 right-10 h-8 bg-lime-500/30 blur-xl rounded-full z-[-1]"></div>
    </div>
  );
};