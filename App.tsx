import React, { useState, useCallback, useEffect, useRef } from 'react';
import { PaperCardData } from './types';
import { DraggablePaper } from './components/DraggablePaper';
import { TypewriterConsole } from './components/TypewriterConsole';
import { DEFAULT_CARD_WIDTH } from './constants';

const App: React.FC = () => {
  const [cards, setCards] = useState<PaperCardData[]>([]);
  const [topZIndex, setTopZIndex] = useState(10);
  
  // Machine positioning state
  // We initialize closer to bottom center, but dependent on window size.
  // Using a callback to set initial state to avoid SSR issues if this were an SSR app, 
  // though simple check is fine here.
  const [machinePos, setMachinePos] = useState({ 
    x: typeof window !== 'undefined' ? window.innerWidth / 2 - (window.innerWidth < 768 ? 175 : 220) : 0, 
    y: typeof window !== 'undefined' ? window.innerHeight - 400 : 0 
  });
  const [isDraggingMachine, setIsDraggingMachine] = useState(false);
  const [machineDragOffset, setMachineDragOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // Re-center on first mount just in case
    const width = window.innerWidth < 768 ? 350 : 440;
    setMachinePos({
      x: window.innerWidth / 2 - (width / 2),
      y: window.innerHeight - 380
    });
  }, []);

  // --- Machine Dragging Logic (Mouse) ---
  const handleMachineMouseDown = (e: React.MouseEvent) => {
    // If user clicks on an input, button or textarea, do NOT start drag
    const target = e.target as HTMLElement;
    if (target.closest('button, textarea, input')) {
      return;
    }
    
    setIsDraggingMachine(true);
    setMachineDragOffset({
      x: e.clientX - machinePos.x,
      y: e.clientY - machinePos.y
    });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDraggingMachine) {
      setMachinePos({
        x: e.clientX - machineDragOffset.x,
        y: e.clientY - machineDragOffset.y
      });
    }
  }, [isDraggingMachine, machineDragOffset]);

  const handleMouseUp = useCallback(() => {
    setIsDraggingMachine(false);
  }, []);

  // --- Machine Dragging Logic (Touch) ---
  const handleMachineTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button, textarea, input')) {
      return;
    }
    
    const touch = e.touches[0];
    setIsDraggingMachine(true);
    setMachineDragOffset({
      x: touch.clientX - machinePos.x,
      y: touch.clientY - machinePos.y
    });
  };

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (isDraggingMachine) {
      // Prevent scrolling
      if (e.cancelable) e.preventDefault();
      
      const touch = e.touches[0];
      setMachinePos({
        x: touch.clientX - machineDragOffset.x,
        y: touch.clientY - machineDragOffset.y
      });
    }
  }, [isDraggingMachine, machineDragOffset]);

  const handleTouchEnd = useCallback(() => {
    setIsDraggingMachine(false);
  }, []);

  useEffect(() => {
    if (isDraggingMachine) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      // Passive: false is required to call preventDefault
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleTouchEnd);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDraggingMachine, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);
  // -----------------------------

  const handlePrint = (text: string) => {
    // Determine machine width based on screen width (matching component CSS)
    const machineWidth = window.innerWidth < 768 ? 350 : 440;
    
    // Calculate spawn position based on current machine position
    // Center of the machine
    const machineCenterX = machinePos.x + (machineWidth / 2);
    
    // We want paper to spawn centered to the machine
    const centerX = machineCenterX - (DEFAULT_CARD_WIDTH / 2);
    
    // Spawn paper "above" the machine so it slides out nicely.
    // Machine height is approx 300-350px. Paper slot is at the top.
    const targetY = machinePos.y - 180;

    const newCard: PaperCardData = {
      id: crypto.randomUUID(),
      text,
      x: centerX,
      y: targetY,
      rotation: (Math.random() * 4) - 2, // Slight variation
      timestamp: Date.now(),
      isTyping: true,
    };

    setCards(prev => [...prev, newCard]);
  };

  const handleUpdateCard = useCallback((id: string, updates: Partial<PaperCardData>) => {
    setCards(prev => prev.map(card => card.id === id ? { ...card, ...updates } : card));
  }, []);

  const handleDeleteCard = useCallback((id: string) => {
    setCards(prev => prev.filter(card => card.id !== id));
  }, []);

  const handleClearAll = () => {
    if (window.confirm("Clear all messages?")) {
      setCards([]);
    }
  };

  const handleFocus = useCallback((id: string) => {
    setTopZIndex(prev => {
      const newZ = prev + 1;
      setCards(prevCards => 
        prevCards.map(c => c.id === id ? { ...c } : c)
      );
      return newZ;
    });
    
    setCards(prev => {
      const card = prev.find(c => c.id === id);
      if (!card) return prev;
      const others = prev.filter(c => c.id !== id);
      return [...others, card];
    });
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#d4d8e0]">
      {/* Realistic Desk Mat Background */}
      <div className="absolute inset-0 pointer-events-none opacity-60"
           style={{
             background: `
               radial-gradient(circle at 50% 50%, #ffffff 0%, #d4d8e0 60%, #9ca3af 100%)
             `
           }}>
      </div>
      <div className="absolute inset-0 pointer-events-none opacity-10"
           style={{
             backgroundImage: `linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`,
             backgroundSize: '50px 50px',
           }}>
      </div>

      {/* App Title */}
      <div className="absolute top-12 left-1/2 transform -translate-x-1/2 opacity-30 pointer-events-none select-none text-center mix-blend-multiply">
         <h1 className="font-['VT323'] text-6xl text-slate-800 tracking-tighter">HOPX.io</h1>
         <p className="text-lg tracking-[0.4em] text-slate-600 mt-[-5px] font-bold uppercase">wang.finance</p>
      </div>

      {/* Author Badge */}
      <a 
        href="https://x.com/hopxio"
        target="_blank"
        rel="noreferrer"
        className="absolute top-5 right-5 z-[100] flex items-center gap-2.5 bg-slate-200/30 hover:bg-white/50 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20 shadow-sm transition-all group cursor-pointer no-underline"
      >
         <span className="font-['VT323'] text-xl text-slate-700/80 group-hover:text-slate-900 transition-colors mt-0.5">@hopxio</span>
      </a>

      {/* Card Rendering Area */}
      <div className="absolute inset-0 w-full h-full pointer-events-none">
        {cards.map((card, index) => (
          <DraggablePaper
            key={card.id}
            data={card}
            // Ensure cards are interactive even though container is pointer-events-none
            // But actually DraggablePaper needs pointer-events-auto wrapper if parent is none
            // In CSS DraggablePaper has pointer-events-auto
            zIndex={index + 10}
            onUpdate={handleUpdateCard}
            onDelete={handleDeleteCard}
            onFocus={() => handleFocus(card.id)}
          />
        ))}
      </div>

      {/* Draggable Machine Console */}
      <div 
        className="absolute z-50 cursor-grab active:cursor-grabbing"
        style={{
          left: machinePos.x,
          top: machinePos.y,
          touchAction: 'none' // Critical for touch dragging support
        }}
        onMouseDown={handleMachineMouseDown}
        onTouchStart={handleMachineTouchStart}
      >
        <TypewriterConsole 
          onPrint={handlePrint}
          onClearAll={handleClearAll}
        />
      </div>
    </div>
  );
};

export default App;