import React, { useState, useEffect, useRef } from 'react';
import { PaperCardData, Coordinates } from '../types';
import { X } from 'lucide-react';

interface DraggablePaperProps {
  data: PaperCardData;
  onUpdate: (id: string, updates: Partial<PaperCardData>) => void;
  onDelete: (id: string) => void;
  zIndex: number;
  onFocus: () => void;
}

// Reverted to clean white thermal paper
const PAPER_COLOR = '#ffffff';

export const DraggablePaper: React.FC<DraggablePaperProps> = ({
  data,
  onUpdate,
  onDelete,
  zIndex,
  onFocus,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<Coordinates>({ x: 0, y: 0 });
  const [displayedText, setDisplayedText] = useState('');
  
  // Refs for typing animation
  const textIndex = useRef(0);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Typing effect logic
  useEffect(() => {
    if (data.isTyping) {
      setDisplayedText('');
      textIndex.current = 0;
      
      const typeNextChar = () => {
        if (textIndex.current < data.text.length) {
          setDisplayedText((prev) => prev + data.text.charAt(textIndex.current));
          textIndex.current++;
          
          // Dynamic typing speed adjustment:
          // Short text (<50 chars): 30-80ms per char (Detailed, rhythmic)
          // Medium text (50-150 chars): 15-40ms per char (Brisk)
          // Long text (>150 chars): 5-20ms per char (Fast thermal print)
          const length = data.text.length;
          let minDelay = 30;
          let variance = 50;

          if (length > 150) {
            minDelay = 5;
            variance = 15;
          } else if (length > 50) {
            minDelay = 15;
            variance = 25;
          }
          
          const delay = Math.random() * variance + minDelay;
          typingTimeout.current = setTimeout(typeNextChar, delay);
        } else {
          // Finished typing
          onUpdate(data.id, { isTyping: false });
        }
      };
      
      // Start typing
      typingTimeout.current = setTimeout(typeNextChar, 100);
    } else {
      setDisplayedText(data.text);
    }

    return () => {
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.isTyping, data.text]);

  // --- Mouse Handlers ---
  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFocus();
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - data.x,
      y: e.clientY - data.y,
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      onUpdate(data.id, {
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // --- Touch Handlers ---
  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    onFocus();
    const touch = e.touches[0];
    setIsDragging(true);
    setDragOffset({
      x: touch.clientX - data.x,
      y: touch.clientY - data.y,
    });
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (isDragging) {
      // Prevent scrolling
      if (e.cancelable) e.preventDefault();
      const touch = e.touches[0];
      onUpdate(data.id, {
        x: touch.clientX - dragOffset.x,
        y: touch.clientY - dragOffset.y,
      });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDragging, dragOffset]);

  // Calculate printing progress for extrusion effect
  // 0 = Start (paper hidden), 1 = End (paper fully printed up to hold point)
  const progress = data.text.length > 0 ? displayedText.length / data.text.length : 0;
  
  // Determine translateY based on state
  // If typing: Interpolate from 100% (hidden) to 15% (holding point) based on progress
  // If done: Use animation class to eject to 0%
  const typingTranslateY = 100 - (progress * 85); 

  // Format timestamp
  const dateObj = new Date(data.timestamp);
  const dateStr = dateObj.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' });
  const timeStr = dateObj.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

  return (
    <div
      className={`absolute cursor-move select-none ${data.isTyping ? 'pointer-events-none' : 'pointer-events-auto'}`}
      style={{
        left: data.x,
        top: data.y,
        zIndex: zIndex,
        width: '280px',
        // Apply Rotation and Scale on the container
        transform: `rotate(${data.rotation}deg) scale(${isDragging ? 1.02 : 1})`,
        transition: 'transform 0.2s ease-out', 
        touchAction: 'none' // Important for mobile drag
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      <style>{`
        @keyframes ejecting {
          0% {
            transform: translateY(15%);
          }
          50% {
            /* Bounce up slightly to simulate release tension */
            transform: translateY(-5%);
          }
          100% {
            transform: translateY(0);
          }
        }
      `}</style>

      {/* Animation Wrapper: Separated to avoid transform conflicts */}
      <div
        style={{
          transform: data.isTyping 
            ? `translateY(${typingTranslateY}%)` 
            : undefined,
          animation: !data.isTyping 
            ? 'ejecting 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards' 
            : 'none',
          // Add a small transition to smooth out the stepped movement of typing
          transition: data.isTyping ? 'transform 0.1s linear' : 'none',
          transformOrigin: 'bottom center',
        }}
      >
        {/* Visual Paper Card */}
        <div 
          className="relative shadow-md"
          style={{
            backgroundColor: PAPER_COLOR,
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
          }}
        >
          
          {/* Top Serrated Edge */}
          <div 
            className="absolute -top-1.5 left-0 w-full h-3" 
            style={{
               backgroundColor: PAPER_COLOR,
               maskImage: 'radial-gradient(circle at 5px 0, transparent 5px, black 5.5px)',
               maskSize: '10px 10px',
               maskRepeat: 'repeat-x',
               maskPosition: 'bottom',
               WebkitMaskImage: 'radial-gradient(circle at 5px 0, transparent 5px, black 5.5px)',
               WebkitMaskSize: '10px 10px',
               WebkitMaskRepeat: 'repeat-x',
               WebkitMaskPosition: 'bottom',
            }}
          ></div>

          {/* Paper Content */}
          <div className="px-5 py-6 relative overflow-hidden">
            
            {/* Delete Button (Only show when not typing) */}
            {!data.isTyping && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(data.id);
                }}
                // Added touchEnd propagation stop for mobile
                onTouchEnd={(e) => {
                  e.stopPropagation();
                  onDelete(data.id);
                }}
                className="absolute top-2 right-2 text-gray-400 hover:text-red-600 transition-colors z-10 mix-blend-multiply"
              >
                <X size={14} />
              </button>
            )}

            {/* Header Info */}
            <div className="flex flex-col items-center border-b border-dashed border-gray-400/50 pb-3 mb-4 opacity-70 font-mono text-[10px] text-gray-600">
              <span className="uppercase tracking-widest font-bold text-[11px] text-gray-800">Pager Message</span>
              <div className="flex justify-between w-full mt-1.5 px-1 text-[9px] tracking-tight">
                 <span>ID: {data.id.slice(0,6).toUpperCase()}</span>
                 <span className="font-semibold">{dateStr} {timeStr}</span>
              </div>
            </div>

            {/* Message Body */}
            <div 
              className="font-['Special_Elite'] font-['Noto_Serif_SC'] text-lg leading-relaxed text-gray-900 break-words whitespace-pre-wrap min-h-[2.5rem]" 
              style={{ textShadow: '0 0 1px rgba(0,0,0,0.1)' }}
            >
              {displayedText}
              {data.isTyping && (
                <span className="inline-block w-2.5 h-4 bg-gray-800 ml-0.5 animate-pulse align-middle opacity-80"></span>
              )}
            </div>

            {/* Footer Barcode-ish look */}
            <div className="mt-5 pt-3 border-t border-gray-400/30 flex justify-between items-end opacity-50 text-gray-700">
               <div className="h-3 w-20 bg-current opacity-30" style={{ maskImage: 'linear-gradient(90deg, black 50%, transparent 50%)', maskSize: '3px 100%' }}></div>
               <span className="text-[8px] font-mono tracking-wide">END OF TRANSMISSION</span>
            </div>
          </div>

          {/* Bottom Serrated Edge */}
          <div 
            className="absolute -bottom-1.5 left-0 w-full h-3" 
            style={{
               backgroundColor: PAPER_COLOR,
               maskImage: 'radial-gradient(circle at 5px 10px, transparent 5px, black 5.5px)',
               maskSize: '10px 10px',
               maskRepeat: 'repeat-x',
               maskPosition: 'top',
               WebkitMaskImage: 'radial-gradient(circle at 5px 10px, transparent 5px, black 5.5px)',
               WebkitMaskSize: '10px 10px',
               WebkitMaskRepeat: 'repeat-x',
               WebkitMaskPosition: 'top',
            }}
          ></div>
        </div>
      </div>
    </div>
  );
};