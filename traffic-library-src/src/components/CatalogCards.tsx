import React from 'react';
import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';
import { Month, Instruction } from '../data/trafficData';
interface CatalogCardsProps {
  instructions: Instruction[];
  months: Month[];
  light?: boolean;
}
const monthDewey: Record<string, string> = {
  April: '001.04',
  March: '001.03',
  December: '001.12'
};
export function CatalogCards({
  instructions,
  months,
  light = false
}: CatalogCardsProps) {
  const scrollToMonth = (month: string) => {
    const el = document.getElementById(`month-${month}`);
    if (el)
    el.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  };
  return (
    <div className="relative z-10 px-8 pb-6">
      <div className="flex gap-3 flex-wrap">
        {months.map((month, i) => {
          const count = instructions.filter(
            (inst) => inst.month === month
          ).length;
          return (
            <motion.button
              key={month}
              initial={{
                opacity: 0,
                y: 10
              }}
              animate={{
                opacity: 1,
                y: 0
              }}
              transition={{
                delay: i * 0.06
              }}
              onClick={() => scrollToMonth(month)}
              className={`relative group flex flex-col w-32 rounded-t-sm rounded-b-md overflow-hidden transition-all ${light ? 'bg-white/70 border border-purple-200 hover:border-purple-400 hover:bg-white hover:shadow-[0_0_15px_rgba(147,51,234,0.15)]' : 'bg-underworld-800/80 border border-megara-dark/30 hover:border-magic-teal/40 hover:bg-underworld-700/50 hover:shadow-glow-teal'}`}>
              
              <div
                className={`h-1.5 w-full transition-colors ${light ? 'bg-purple-300/50 group-hover:bg-purple-400/70' : 'bg-magic-teal/30 group-hover:bg-magic-teal/60'}`}>
              </div>
              <div className="px-3 py-2.5 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span
                    className={`font-mono text-[10px] font-bold tracking-wider ${light ? 'text-purple-400 group-hover:text-purple-600' : 'text-magic-teal/40 group-hover:text-magic-teal/70'}`}>
                    
                    {monthDewey[month] || '001'}
                  </span>
                  <Calendar
                    size={14}
                    className={`transition-colors ${light ? 'text-purple-300 group-hover:text-purple-500' : 'text-magic-teal/30 group-hover:text-magic-teal/60'}`} />
                  
                </div>
                <span
                  className={`font-serif text-sm font-medium text-left transition-colors ${light ? 'text-purple-700/70 group-hover:text-purple-800' : 'text-megara-light/60 group-hover:text-megara-light/80'}`}>
                  
                  {month}
                </span>
                <span
                  className={`text-[10px] font-mono ${light ? 'text-purple-400/50' : 'text-megara-light/25'}`}>
                  
                  {count} {count === 1 ? 'scroll' : 'scrolls'}
                </span>
              </div>
              <div
                className={`absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent to-transparent ${light ? 'via-purple-200/40' : 'via-megara-dark/20'}`}>
              </div>
            </motion.button>);

        })}
      </div>
    </div>);

}