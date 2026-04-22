import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Edit2,
  Eye,
  Printer,
  Send,
  Trash2,
  Copy,
  ChevronDown } from
'lucide-react';
import { Instruction, marketColors } from '../data/trafficData';
import {
  playBookOpenSound,
  playBookCloseSound,
  playSendSound } from
'../utils/sounds';
interface BookOpenProps {
  instruction: Instruction | null;
  onClose: () => void;
  light?: boolean;
}
function generateIsciRows(instruction: Instruction) {
  const market = instruction.market;
  const prefix =
  market === 'Chicago' ?
  'CHI' :
  market === 'Cincinnati' ?
  'CIN' :
  market === 'Denver' ?
  'DEN' :
  'MSP';
  const brand = instruction.brand === 'Postman Law' ? 'PL' : 'WK';
  if (instruction.mediaType === 'OOH') {
    return [
    {
      dates: instruction.dateRange,
      code: `${prefix}${brand}OOH001 - Billboard_Main`,
      length: 'Static',
      pct: '34%',
      notes: 'All Week'
    },
    {
      dates: instruction.dateRange,
      code: `${prefix}${brand}OOH002 - Digital_Board`,
      length: 'Digital',
      pct: '33%',
      notes: 'All Week'
    },
    {
      dates: instruction.dateRange,
      code: `${prefix}${brand}OOH003 - Transit_Shelter`,
      length: 'Static',
      pct: '33%',
      notes: 'All Week'
    }];

  }
  const isTV =
  instruction.mediaType === 'TV' || instruction.mediaType === 'Cable';
  const suffix = isTV ? 'T' : instruction.mediaType === 'Radio' ? 'R' : 'S';
  const spots = [
  {
    name: 'Why Postman_60',
    length: ':60',
    pct: '50%'
  },
  {
    name: 'Supreme Court_60',
    length: ':60',
    pct: '50%'
  },
  {
    name: "Warren's Story_30",
    length: ':30',
    pct: '25%'
  },
  {
    name: 'Local Lawyers_30',
    length: ':30',
    pct: '25%'
  },
  {
    name: 'Legal Firepower_30',
    length: ':30',
    pct: '25%'
  },
  {
    name: 'Justice & Representation_30',
    length: ':30',
    pct: '25%'
  },
  {
    name: "Warren's Story_15",
    length: ':15',
    pct: '25%'
  },
  {
    name: 'Local Lawyers_15',
    length: ':15',
    pct: '25%'
  }];

  const isciCount = parseInt(instruction.iscis) || 8;
  return spots.slice(0, isciCount).map((spot, i) => ({
    dates: instruction.dateRange,
    code: `${prefix}${brand}${2660000 + i}${suffix} - ${spot.name}`,
    length: spot.length,
    pct: spot.pct,
    notes: spot.length === ':15' ? ':15 A' : 'All Week'
  }));
}
export function BookOpen({
  instruction,
  onClose,
  light = false
}: BookOpenProps) {
  // Play book open sound when instruction changes to non-null
  useEffect(() => {
    if (instruction) {
      playBookOpenSound();
    }
  }, [instruction]);
  if (!instruction) return null;
  const isciRows = generateIsciRows(instruction);
  const marketAbbr =
  instruction.market === 'Chicago' ?
  'CHI' :
  instruction.market === 'Cincinnati' ?
  'CIN' :
  instruction.market === 'Denver' ?
  'DEN' :
  'MSP';
  const handleClose = () => {
    playBookCloseSound();
    onClose();
  };
  const handleSend = () => {
    playSendSound();
  };
  return (
    <AnimatePresence>
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm p-6 ${light ? 'bg-black/40' : 'bg-black/70'}`}
        onClick={handleClose}>
        
        <motion.div
          initial={{
            scale: 0.85,
            opacity: 0,
            rotateY: -15
          }}
          animate={{
            scale: 1,
            opacity: 1,
            rotateY: 0
          }}
          exit={{
            scale: 0.85,
            opacity: 0,
            rotateY: 15
          }}
          transition={{
            type: 'spring',
            damping: 22,
            stiffness: 180
          }}
          className={`w-full max-w-6xl h-[85vh] flex rounded-lg overflow-hidden ${light ? 'shadow-[0_0_40px_rgba(147,51,234,0.1),0_25px_50px_rgba(0,0,0,0.2)]' : 'shadow-[0_0_60px_rgba(200,80,192,0.15),0_25px_50px_rgba(0,0,0,0.5)]'}`}
          onClick={(e) => e.stopPropagation()}>
          
          {/* LEFT PAGE — PDF */}
          <div className="flex-1 bg-white overflow-y-auto relative">
            <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-gray-300 to-transparent z-10 pointer-events-none"></div>

            <div className="px-10 pt-8 pb-8">
              <div className="text-center mb-6">
                <div className="inline-block border-2 border-gray-800 px-5 py-1.5">
                  <span className="font-bold text-gray-900 tracking-wider text-lg uppercase">
                    {instruction.brand.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-[140px_1fr] gap-y-2.5 text-sm max-w-2xl mb-8">
                <span className="font-bold text-gray-700">Agency:</span>
                <span className="text-gray-900">Blackacre Services</span>
                <span className="font-bold text-gray-700">Client:</span>
                <span className="text-purple-600 font-medium">
                  {instruction.brand}
                </span>
                <span className="font-bold text-gray-700">Market:</span>
                <span className="text-gray-900 font-medium">
                  {instruction.market} ({marketAbbr})
                </span>
                <span className="font-bold text-gray-700">Buyer:</span>
                <span className="text-purple-600 font-medium">
                  {instruction.buyer}
                </span>
                <span className="font-bold text-gray-700">Media:</span>
                <span className="text-green-600 font-medium">
                  {instruction.mediaType}
                </span>
                <span className="font-bold text-gray-700">
                  Broadcast Month:
                </span>
                <span className="text-red-500 font-medium">
                  {instruction.month}
                </span>
                <span className="font-bold text-gray-700">Flight Dates:</span>
                <span className="text-gray-900 font-medium">
                  {instruction.dateRange}
                </span>
                <span className="font-bold text-gray-700">
                  Version / Links:
                </span>
                <span className="text-gray-900">
                  Version 1 / {marketAbbr} Assets
                </span>
                <span className="font-bold text-gray-700">Comments:</span>
                <span className="text-gray-600 text-xs leading-relaxed">
                  If you buy has no bookends, run as standalones, if you have
                  stand alones run Legal Firepower :15
                </span>
              </div>

              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-300">
                    <th className="text-left py-2.5 px-3 text-gray-500 font-semibold uppercase text-[10px] tracking-wider w-24">
                      Flight Dates
                    </th>
                    <th className="text-left py-2.5 px-3 text-gray-500 font-semibold uppercase text-[10px] tracking-wider">
                      ISCI Codes & Title
                    </th>
                    <th className="text-left py-2.5 px-3 text-gray-500 font-semibold uppercase text-[10px] tracking-wider w-16">
                      Length
                    </th>
                    <th className="text-left py-2.5 px-3 text-gray-500 font-semibold uppercase text-[10px] tracking-wider w-12">
                      %
                    </th>
                    <th className="text-left py-2.5 px-3 text-gray-500 font-semibold uppercase text-[10px] tracking-wider w-20">
                      Notes
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-green-100 border-b border-green-200">
                    <td
                      colSpan={5}
                      className="py-1.5 px-3 font-bold text-gray-800 uppercase text-xs">
                      
                      All Week
                    </td>
                  </tr>
                  {isciRows.map((row, i) =>
                  <tr
                    key={i}
                    className={`border-b border-gray-100 ${i % 2 === 0 ? 'bg-green-50/40' : 'bg-white'} hover:bg-green-50 transition-colors`}>
                    
                      <td className="py-2 px-3 text-gray-600 font-mono text-xs">
                        {row.dates}
                      </td>
                      <td className="py-2 px-3 text-gray-900 font-mono text-xs">
                        {row.code}
                      </td>
                      <td className="py-2 px-3 text-gray-700 font-mono text-xs">
                        {row.length}
                      </td>
                      <td className="py-2 px-3 text-gray-700 font-mono text-xs">
                        {row.pct}
                      </td>
                      <td className="py-2 px-3 text-gray-500 text-xs">
                        {row.notes}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* BOOK SPINE */}
          <div
            className={`w-4 flex-shrink-0 ${light ? 'bg-gradient-to-r from-purple-200 via-purple-300 to-purple-200 shadow-[inset_0_0_8px_rgba(0,0,0,0.15)]' : 'bg-gradient-to-r from-underworld-700 via-underworld-900 to-underworld-700 shadow-[inset_0_0_10px_rgba(0,0,0,0.8)]'}`}>
          </div>

          {/* RIGHT PAGE — Actions */}
          <div
            className={`w-80 flex flex-col relative overflow-hidden ${light ? 'bg-[#f8f0fc]' : 'bg-underworld-800'}`}>
            
            <div
              className={`absolute inset-0 opacity-5 pointer-events-none ${light ? 'bg-[radial-gradient(circle_at_30%_50%,rgba(147,51,234,0.2),transparent_70%)]' : 'bg-[radial-gradient(circle_at_30%_50%,rgba(200,80,192,0.3),transparent_70%)]'}`}>
            </div>

            <div
              className={`absolute top-4 right-4 w-12 h-12 border-t-2 border-r-2 rounded-tr-lg ${light ? 'border-purple-300/30' : 'border-megara-dark/30'}`}>
            </div>
            <div
              className={`absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 rounded-br-lg ${light ? 'border-purple-300/30' : 'border-megara-dark/30'}`}>
            </div>

            <div className="p-4 flex justify-end relative z-10">
              <button
                onClick={handleClose}
                className={`p-2 rounded-full transition-colors ${light ? 'text-purple-400 hover:text-purple-700 hover:bg-purple-100' : 'text-megara-light/60 hover:text-megara-light hover:bg-white/10'}`}>
                
                <X size={20} />
              </button>
            </div>

            <div
              className={`px-6 pb-6 border-b relative z-10 ${light ? 'border-purple-200/40' : 'border-megara-dark/20'}`}>
              
              <span
                className={`font-serif text-2xl font-bold ${marketColors[instruction.market]}`}>
                
                {instruction.market}
              </span>
              <div className="mt-2 space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs px-2 py-0.5 rounded font-mono ${light ? 'bg-purple-100 text-purple-700' : 'bg-underworld-700 text-megara-light/70'}`}>
                    
                    Est {instruction.estimate.split('+')[0].trim()}
                  </span>
                  <span
                    className={`text-xs ${light ? 'text-purple-500/50' : 'text-megara-light/40'}`}>
                    
                    {instruction.version}
                  </span>
                </div>
                <div
                  className={`text-xs ${light ? 'text-purple-600/50' : 'text-megara-light/50'}`}>
                  
                  {instruction.iscis} &middot; {instruction.dateRange}
                </div>
                <div
                  className={`text-xs ${light ? 'text-purple-600/50' : 'text-megara-light/50'}`}>
                  
                  {instruction.buyer}
                </div>
                {instruction.status === 'sent' &&
                <span
                  className={`inline-block text-[10px] px-2 py-0.5 rounded border mt-1 ${light ? 'bg-green-50 text-green-600 border-green-200' : 'bg-green-900/40 text-green-400 border-green-700/50'}`}>
                  
                    sent
                  </span>
                }
              </div>
            </div>

            <div className="flex-1 px-6 py-6 flex flex-col gap-3 relative z-10">
              <h3
                className={`font-serif text-lg mb-2 tracking-wide ${light ? 'text-purple-700' : 'text-magic-gold/80'}`}>
                
                Actions
              </h3>

              <button
                className={`w-full py-2.5 px-4 rounded border text-sm flex items-center gap-3 transition-colors group ${light ? 'border-purple-200 text-purple-700 hover:bg-purple-100' : 'border-megara-dark/40 text-megara-light hover:bg-megara-dark/20'}`}>
                
                <Edit2
                  size={16}
                  className="text-megara-primary group-hover:scale-110 transition-transform" />
                {' '}
                Edit
              </button>
              <button
                className={`w-full py-2.5 px-4 rounded border text-sm flex items-center gap-3 transition-colors group font-medium ${light ? 'border-purple-300 bg-purple-50 text-purple-700 hover:bg-purple-100' : 'border-magic-teal/40 bg-magic-teal/10 text-magic-teal hover:bg-magic-teal/20'}`}>
                
                <Eye
                  size={16}
                  className="group-hover:scale-110 transition-transform" />
                {' '}
                View
              </button>
              <button
                className={`w-full py-2.5 px-4 rounded border text-sm flex items-center gap-3 transition-colors group ${light ? 'border-purple-200 text-purple-700 hover:bg-purple-100' : 'border-megara-dark/40 text-megara-light hover:bg-megara-dark/20'}`}>
                
                <Printer
                  size={16}
                  className={`group-hover:scale-110 transition-transform ${light ? 'text-amber-600' : 'text-magic-gold'}`} />
                {' '}
                Print
              </button>
              <button
                onClick={handleSend}
                className={`w-full py-2.5 px-4 rounded border text-sm flex items-center gap-3 transition-colors group ${light ? 'border-purple-200 text-purple-700 hover:bg-purple-100' : 'border-megara-dark/40 text-megara-light hover:bg-megara-dark/20'}`}>
                
                <Send
                  size={16}
                  className="text-megara-primary group-hover:scale-110 transition-transform group-hover:translate-x-0.5" />
                {' '}
                Send
              </button>
              <button
                className={`w-full py-2.5 px-4 rounded border text-sm flex items-center gap-3 transition-colors group ${light ? 'border-purple-200 text-purple-700 hover:bg-purple-100' : 'border-megara-dark/40 text-megara-light hover:bg-megara-dark/20'}`}>
                
                <Copy
                  size={16}
                  className={`group-hover:scale-110 transition-transform ${light ? 'text-purple-400' : 'text-megara-light/60'}`} />
                {' '}
                Copy to...
                <ChevronDown
                  size={14}
                  className={`ml-auto ${light ? 'text-purple-300' : 'text-megara-light/40'}`} />
                
              </button>
            </div>

            <div className="px-6 pb-6 relative z-10">
              <button
                className={`w-full py-2.5 px-4 rounded border text-sm flex items-center justify-center gap-2 transition-colors ${light ? 'border-red-200 text-red-500 hover:bg-red-50' : 'border-red-900/40 text-red-400 hover:bg-red-900/20'}`}>
                
                <Trash2 size={16} /> Delete
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>);

}