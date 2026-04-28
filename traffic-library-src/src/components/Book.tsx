import React, { useContext } from 'react';
import { motion } from 'framer-motion';
import { Instruction, marketBgColors, marketColors } from '../data/trafficData';
import { ThemeContext } from '../App';
interface BookProps {
  instruction: Instruction;
  onClick: () => void;
}
export function Book({ instruction, onClick }: BookProps) {
  const light = useContext(ThemeContext);
  const isSent = instruction.status === 'sent';
  const isciCount = parseInt(instruction.iscis) || 5;
  const heightClass = isciCount > 8 ? 'h-48' : isciCount > 5 ? 'h-44' : 'h-40';
  const darkBookColors: Record<string, string> = {
    TV: 'from-[#2a1540] to-[#1a0d2e]',
    Radio: 'from-[#1a2040] to-[#0d1530]',
    'Streaming Audio': 'from-[#1a3030] to-[#0d2020]',
    Cable: 'from-[#2a1a30] to-[#1a1020]',
    OOH: 'from-[#2a2a1a] to-[#1a1a0d]'
  };
  const lightBookColors: Record<string, string> = {
    TV: 'from-[#e8daf0] to-[#d4c0e0]',
    Radio: 'from-[#d5dff0] to-[#c0cfe0]',
    'Streaming Audio': 'from-[#d0e8e8] to-[#bcd8d8]',
    Cable: 'from-[#e0d5e8] to-[#d0c0d8]',
    OOH: 'from-[#e8e5d0] to-[#d8d5c0]'
  };
  const bookGradient = light ?
  lightBookColors[instruction.mediaType] || lightBookColors['TV'] :
  darkBookColors[instruction.mediaType] || darkBookColors['TV'];
  return (
    <motion.div
      whileHover={{
        y: -14,
        scale: 1.04
      }}
      whileTap={{
        scale: 0.98
      }}
      onClick={onClick}
      className={`
        relative w-14 ${heightClass} cursor-pointer group
        rounded-l-sm rounded-r-md
        flex flex-col items-center justify-between py-3
        bg-gradient-to-b ${bookGradient}
        ${light ? '' : isSent ? 'book-glow-sent' : 'book-glow-pending'}
        ${light ? 'shadow-[2px_2px_8px_rgba(0,0,0,0.1),-1px_0_3px_rgba(0,0,0,0.05)]' : ''}
      `}
      style={light ? {} : undefined}>
      
      {/* Leather texture */}
      <div
        className={`absolute inset-0 rounded-l-sm rounded-r-md ${light ? 'opacity-10' : 'opacity-20'} bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(255,255,255,0.03)_2px,rgba(255,255,255,0.03)_4px)]`}>
      </div>

      {/* Spine ridges */}
      <div
        className={`absolute left-1 top-4 bottom-4 w-px ${light ? 'bg-black/10' : 'bg-white/10'}`}>
      </div>
      <div
        className={`absolute right-1.5 top-4 bottom-4 w-px ${light ? 'bg-black/5' : 'bg-black/30'}`}>
      </div>

      {/* Top gilded edge */}
      <div
        className={`w-10 h-0.5 rounded-full mb-1 relative z-10 ${light ? 'bg-gradient-to-r from-transparent via-purple-400/40 to-transparent' : 'bg-gradient-to-r from-transparent via-magic-gold/40 to-transparent'}`}>
      </div>

      {/* Market Color Band */}
      <div
        className={`w-full h-3 ${marketBgColors[instruction.market]} opacity-90 shadow-inner relative z-10`}>
        
        <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent"></div>
      </div>

      {/* Spine Text */}
      <div className="flex-1 flex items-center justify-center writing-vertical-rl text-orientation-mixed rotate-180 relative z-10">
        <span
          className={`font-serif text-[10px] font-bold tracking-[0.2em] whitespace-nowrap ${light ? 'text-purple-900/80' : 'text-megara-light/90'}`}>
          
          {instruction.market.toUpperCase()}
        </span>
      </div>

      {/* Status gem */}
      {isSent ?
      <div
        className={`w-2.5 h-2.5 rounded-full mt-2 mb-1 relative z-10 ${light ? 'bg-green-500 shadow-[0_0_6px_1px_rgba(34,197,94,0.4)]' : 'bg-magic-teal shadow-[0_0_8px_2px_rgba(0,206,209,0.5)]'}`}>
        
          <div className="absolute inset-0.5 rounded-full bg-white/30"></div>
        </div> :

      <div
        className={`w-2.5 h-2.5 rounded-full mt-2 mb-1 relative z-10 ${light ? 'bg-purple-400 shadow-[0_0_4px_1px_rgba(147,51,234,0.3)]' : 'bg-megara-primary/60 shadow-[0_0_6px_1px_rgba(200,80,192,0.3)]'}`}>
        
          <div className="absolute inset-0.5 rounded-full bg-white/20"></div>
        </div>
      }

      {/* Bottom gilded edge */}
      <div
        className={`w-10 h-0.5 rounded-full mt-1 relative z-10 ${light ? 'bg-gradient-to-r from-transparent via-purple-400/30 to-transparent' : 'bg-gradient-to-r from-transparent via-magic-gold/30 to-transparent'}`}>
      </div>

      {/* Hover glow */}
      <div
        className="absolute inset-0 rounded-l-sm rounded-r-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          boxShadow: light ?
          isSent ?
          '0 0 20px 4px rgba(34,197,94,0.2)' :
          '0 0 18px 3px rgba(147,51,234,0.2)' :
          isSent ?
          '0 0 25px 5px rgba(0,206,209,0.3), inset 0 0 15px rgba(0,206,209,0.1)' :
          '0 0 20px 4px rgba(200,80,192,0.25), inset 0 0 12px rgba(200,80,192,0.1)'
        }}>
      </div>

      {/* Tooltip */}
      <div
        className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-max px-4 py-2.5 rounded-lg text-xs opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 backdrop-blur-sm ${light ? 'bg-white/95 border border-purple-200 text-purple-900 shadow-lg' : 'bg-underworld-900/95 border border-megara-primary/30 text-megara-light shadow-[0_0_20px_rgba(200,80,192,0.2)]'}`}>
        
        <div
          className={`font-bold text-sm ${marketColors[instruction.market]}`}>
          
          {instruction.market}
        </div>
        <div
          className={`mt-0.5 ${light ? 'text-purple-600/60' : 'text-megara-light/60'}`}>
          
          Est: {instruction.estimate}
        </div>
        <div
          className={`mt-0.5 ${light ? 'text-purple-500/50' : 'text-megara-light/40'}`}>
          
          {instruction.iscis} &middot; {instruction.dateRange}
        </div>
        <div
          className={`mt-1 text-[10px] font-medium ${isSent ? light ? 'text-green-600' : 'text-magic-teal' : light ? 'text-purple-500' : 'text-megara-primary/70'}`}>
          
          {instruction.status.toUpperCase()}
        </div>
      </div>
    </motion.div>);

}