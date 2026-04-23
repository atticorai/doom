import React from 'react';
import { motion } from 'framer-motion';
import { Instruction, MediaType } from '../data/trafficData';
import { Book } from './Book';
interface BookShelfProps {
  month: string;
  instructions: Instruction[];
  onBookClick: (instruction: Instruction) => void;
  light?: boolean;
}
export function BookShelf({
  month,
  instructions,
  onBookClick,
  light = false
}: BookShelfProps) {
  if (instructions.length === 0) return null;
  const groupedByMedia = instructions.reduce(
    (acc, inst) => {
      if (!acc[inst.mediaType]) acc[inst.mediaType] = [];
      acc[inst.mediaType].push(inst);
      return acc;
    },
    {} as Record<string, Instruction[]>
  );
  const mediaOrder: MediaType[] = [
  'TV',
  'Radio',
  'Streaming Audio',
  'Cable',
  'Digital',
  'Display',
  'OOH'];

  // Show the known-order types first, then anything else the data pipe
  // surfaces (custom / combined media strings) so nothing hides just
  // because it wasn't in the hardcoded list.
  const knownMedia = mediaOrder.filter((m) => groupedByMedia[m]?.length > 0);
  const extraMedia = Object.keys(groupedByMedia).filter((m) => !mediaOrder.includes(m as MediaType) && groupedByMedia[m]?.length > 0);
  const sortedMedia = [...knownMedia, ...extraMedia];
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 20
      }}
      animate={{
        opacity: 1,
        y: 0
      }}
      transition={{
        duration: 0.5
      }}
      className="mb-20 relative">
      
      {/* Month Header */}
      <div className="flex items-center gap-4 mb-8 px-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-2 h-2 rotate-45 ${light ? 'bg-purple-500/60' : 'bg-magic-gold/60'}`}>
          </div>
          <div
            className={`w-6 h-px ${light ? 'bg-purple-400/40' : 'bg-magic-gold/40'}`}>
          </div>
        </div>
        <h2
          className={`font-serif font-bold text-3xl ${light ? 'text-purple-800 drop-shadow-sm' : 'text-magic-gold drop-shadow-[0_0_12px_rgba(255,215,0,0.3)]'}`}>
          
          {month}
        </h2>
        <span
          className={`font-serif text-xs tracking-wider uppercase ${light ? 'text-purple-500/50' : 'text-megara-light/40'}`}>
          
          ({instructions.length}{' '}
          {instructions.length === 1 ? 'instruction' : 'instructions'})
        </span>
        <div
          className={`flex-1 h-px bg-gradient-to-r ${light ? 'from-purple-400/30 via-purple-300/10' : 'from-magic-gold/30 via-magic-gold/10'} to-transparent`}>
        </div>
        <div className="flex items-center gap-3">
          <div
            className={`w-6 h-px ${light ? 'bg-purple-300/20' : 'bg-magic-gold/20'}`}>
          </div>
          <div
            className={`w-1.5 h-1.5 rotate-45 ${light ? 'bg-purple-400/30' : 'bg-magic-gold/30'}`}>
          </div>
        </div>
      </div>

      {sortedMedia.map((mediaType, shelfIdx) => {
        const mediaInstructions = groupedByMedia[mediaType];
        const marketCount = new Set(mediaInstructions.map((i) => i.market)).size;
        return (
          <motion.div
            key={mediaType}
            initial={{
              opacity: 0,
              x: -10
            }}
            animate={{
              opacity: 1,
              x: 0
            }}
            transition={{
              delay: shelfIdx * 0.1,
              duration: 0.4
            }}
            className="mb-12 relative">
            
            {/* Brass nameplate */}
            <div
              className={`absolute -top-5 left-8 border px-5 py-1.5 rounded z-10 ${light ? 'bg-gradient-to-b from-purple-200 to-purple-300 border-purple-300/60 shadow-md' : 'brass-plate border-yellow-500/50 shadow-[0_2px_10px_rgba(218,165,32,0.3)]'}`}>
              
              <h3
                className={`font-serif text-xs font-bold tracking-widest uppercase drop-shadow-md ${light ? 'text-purple-800' : 'text-yellow-100'}`}>

                {mediaType === 'Cable' ? 'TV/Cable' : mediaType}
                <span
                  className={`opacity-50 normal-case ml-2 font-sans text-[10px] ${light ? 'text-purple-600' : ''}`}>
                  
                  {marketCount} {marketCount === 1 ? 'market' : 'markets'}
                </span>
              </h3>
              <div
                className={`absolute top-1/2 -translate-y-1/2 left-1.5 w-2 h-2 rounded-full border shadow-inner ${light ? 'bg-gradient-to-br from-purple-200 to-purple-400 border-purple-400/50' : 'bg-gradient-to-br from-yellow-300 to-yellow-700 border-yellow-600/50'}`}>
              </div>
              <div
                className={`absolute top-1/2 -translate-y-1/2 right-1.5 w-2 h-2 rounded-full border shadow-inner ${light ? 'bg-gradient-to-br from-purple-200 to-purple-400 border-purple-400/50' : 'bg-gradient-to-br from-yellow-300 to-yellow-700 border-yellow-600/50'}`}>
              </div>
            </div>

            {/* Shelf back wall */}
            <div
              className={`absolute inset-x-0 top-4 bottom-7 rounded-t-sm ${light ? 'bg-gradient-to-b from-purple-100/40 to-white/20 border-t border-purple-200/30' : 'bg-gradient-to-b from-underworld-900/80 to-underworld-800/40 border-t border-megara-dark/10'}`}>
            </div>

            {/* Books */}
            <div className="flex items-end gap-1 px-12 pt-10 pb-1 min-h-[210px] relative z-10 overflow-x-auto hide-scrollbar">
              {mediaInstructions.map((instruction, bookIdx) =>
              <motion.div
                key={instruction.id}
                initial={{
                  opacity: 0,
                  y: 20
                }}
                animate={{
                  opacity: 1,
                  y: 0
                }}
                transition={{
                  delay: shelfIdx * 0.1 + bookIdx * 0.03
                }}>
                
                  <Book
                  instruction={instruction}
                  onClick={() => onBookClick(instruction)} />
                
                </motion.div>
              )}
            </div>

            {/* Physical Shelf */}
            <div className="shelf-wood h-8 w-full rounded-sm relative z-0">
              <div
                className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent to-transparent ${light ? 'via-purple-300/30' : 'via-megara-dark/40'}`}>
              </div>
              <div className="absolute top-full left-4 right-4 h-12 bg-black/20 blur-md rounded-[100%]"></div>
            </div>

            {/* Ambient glow */}
            <div
              className={`absolute -bottom-4 left-1/4 right-1/4 h-8 blur-xl rounded-full shelf-ambient pointer-events-none ${light ? 'bg-purple-400/5' : 'bg-magic-teal/5'}`}>
            </div>
          </motion.div>);

      })}
    </motion.div>);

}