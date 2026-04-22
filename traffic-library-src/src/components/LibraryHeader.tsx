import React, { useEffect, useState } from 'react';
import {
  Search,
  Download,
  Bell,
  Plus,
  Flame,
  FlameKindling,
  Archive } from
'lucide-react';
type Brand = 'Postman Law' | 'Wettermark Keith';
interface LibraryHeaderProps {
  isLightMode: boolean;
  toggleTheme: () => void;
  brand: Brand;
  onBrandChange: (b: Brand) => void;
  brandCounts: Record<Brand, number>;
  totalInstructions: number;
  totalMarkets: number;
  archivedCount: number;
  showArchived: boolean;
  onToggleArchived: () => void;
}
export function LibraryHeader({
  isLightMode,
  toggleTheme,
  brand,
  onBrandChange,
  brandCounts,
  totalInstructions,
  totalMarkets,
  archivedCount,
  showArchived,
  onToggleArchived,
}: LibraryHeaderProps) {
  const quotes = [
  'I remember every version. Every mistake.',
  "Everything you've ever sent. Archived. By me. Obviously.",
  'People do crazy things... like forgetting to send traffic.',
  "It's all Greek to them. But not to me.",
  'I don\'t do "lost files." Try someone else.',
  "Megara doesn't forget. Megara doesn't forgive late sends."];

  const [quoteIdx, setQuoteIdx] = useState(0);
  const light = isLightMode;
  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIdx((prev) => (prev + 1) % quotes.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);
  return (
    <header className="w-full py-6 px-8 flex flex-col gap-5 relative z-10">
      <div
        className={`absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent ${light ? 'via-purple-400/30' : 'via-magic-gold/30'} to-transparent`}>
      </div>

      <div className="flex justify-between items-start">
        <div className="flex items-end gap-5">
          <div className="hidden lg:flex items-center gap-2 mb-2 opacity-40">
            <div
              className={`w-8 h-px ${light ? 'bg-purple-600' : 'bg-magic-gold'}`}>
            </div>
            <div
              className={`w-2 h-2 rotate-45 border ${light ? 'border-purple-600' : 'border-magic-gold'}`}>
            </div>
            <div
              className={`w-4 h-px ${light ? 'bg-purple-600' : 'bg-magic-gold'}`}>
            </div>
          </div>

          <h1
            className={`font-serif font-bold text-4xl tracking-wide ${light ? 'text-purple-800 drop-shadow-sm' : 'title-shimmer'}`}>
            
            Traffic Library
          </h1>

          <p
            key={quoteIdx}
            className={`font-serif italic text-base mb-1 transition-opacity duration-1000 ${light ? 'text-purple-600/70' : 'text-megara-light/60'}`}>
            
            "{quotes[quoteIdx]}"
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            className={`px-4 py-2 rounded border transition-all text-sm flex items-center gap-2 ${light ? 'border-purple-300 text-purple-700 hover:bg-purple-100' : 'border-megara-dark/40 text-megara-light/70 hover:bg-megara-dark/20 hover:text-megara-light'}`}>
            
            <Download size={16} /> Export CSV
          </button>
          <button
            className={`px-4 py-2 rounded border transition-all text-sm flex items-center gap-2 ${light ? 'bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100' : 'bg-magic-gold/10 border-magic-gold/40 text-magic-gold hover:bg-magic-gold/20 hover:shadow-glow-gold'}`}>
            
            <Bell size={16} /> Send Reminders
          </button>
          <button
            className={`px-4 py-2 rounded border transition-all text-sm flex items-center gap-2 ${light ? 'bg-purple-100 border-purple-300 text-purple-700 hover:bg-purple-200' : 'bg-megara-primary/20 border-megara-primary/50 text-megara-light hover:bg-megara-primary/30 hover:shadow-glow-purple'}`}>

            <Plus size={16} /> Import
          </button>
          <button
            onClick={() => {
              const actions = (typeof window !== 'undefined' && (window as any).MegaraLibraryActions) || {};
              if (typeof actions.restoreFromBackup === 'function') actions.restoreFromBackup();
            }}
            className={`px-4 py-2 rounded border transition-all text-sm flex items-center gap-2 ${light ? 'bg-emerald-50 border-emerald-400 text-emerald-800 hover:bg-emerald-100' : 'bg-emerald-900/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/30'}`}
            title="Restore trafficHistory from Firestore / localStorage backup">
            ↺ Restore Backup
          </button>
          <button
            onClick={() => {
              const actions = (typeof window !== 'undefined' && (window as any).MegaraLibraryActions) || {};
              if (typeof actions.wipeNonApril === 'function') actions.wipeNonApril();
            }}
            className={`px-4 py-2 rounded border transition-all text-sm flex items-center gap-2 ${light ? 'bg-orange-50 border-orange-400 text-orange-800 hover:bg-orange-100' : 'bg-orange-900/20 border-orange-500/40 text-orange-300 hover:bg-orange-900/30'}`}
            title="Delete all non-April traffic records. April PL + April WK stay.">
            ⚠ Wipe Non-April
          </button>
          <button
            onClick={() => {
              const actions = (typeof window !== 'undefined' && (window as any).MegaraLibraryActions) || {};
              if (typeof actions.cleanPlaceholders === 'function') actions.cleanPlaceholders();
            }}
            className={`px-4 py-2 rounded border transition-all text-sm flex items-center gap-2 ${light ? 'bg-rose-50 border-rose-300 text-rose-700 hover:bg-rose-100' : 'bg-rose-900/20 border-rose-500/40 text-rose-300 hover:bg-rose-900/30'}`}
            title="Remove Claude-injected placeholder traffic records from Firestore">
            🧹 Clean Placeholders
          </button>
          <button
            onClick={() => {
              const actions = (typeof window !== 'undefined' && (window as any).MegaraLibraryActions) || {};
              if (typeof actions.wipeBrand === 'function') actions.wipeBrand(brand);
            }}
            className={`px-4 py-2 rounded border transition-all text-sm flex items-center gap-2 ${light ? 'bg-red-50 border-red-400 text-red-800 hover:bg-red-100' : 'bg-red-900/30 border-red-500/50 text-red-300 hover:bg-red-900/50'}`}
            title={`Wipe ALL ${brand} traffic records from Firestore (nuclear option)`}>
            ☠ Wipe {brand === 'Postman Law' ? 'PL' : 'WK'}
          </button>

          <button
            onClick={toggleTheme}
            className={`ml-3 p-2.5 rounded-full transition-all relative group ${light ? 'text-amber-600 hover:bg-amber-100 hover:shadow-[0_0_20px_4px_rgba(217,119,6,0.2)]' : 'text-magic-gold hover:bg-white/10 hover:shadow-[0_0_20px_4px_rgba(255,215,0,0.3)]'}`}
            title="Toggle Illumination">
            
            {isLightMode ? <FlameKindling size={22} /> : <Flame size={22} />}
            <div
              className={`absolute inset-0 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity ${light ? 'bg-amber-400/20' : 'bg-magic-gold/10'}`}>
            </div>
          </button>
        </div>
      </div>

      <div
        className={`font-serif text-xs flex gap-2 tracking-wider uppercase ${light ? 'text-purple-500/60' : 'text-megara-light/40'}`}>
        
        <span>{totalInstructions} instructions</span> &middot; <span>2 brands</span> &middot;{' '}
        <span>{totalMarkets} markets</span>
      </div>

      <div className="flex gap-4 items-center">
        <div
          className={`flex rounded-t-lg border-b overflow-hidden backdrop-blur-sm ${light ? 'bg-white/60 border-purple-200' : 'bg-underworld-800/60 border-megara-dark/40'}`}>
          
          {(['Postman Law', 'Wettermark Keith'] as const).map((b) => {
            const active = brand === b;
            const activeClasses = light
              ? 'text-purple-800 border-purple-600 bg-purple-50'
              : 'text-megara-light border-magic-gold bg-magic-gold/5';
            const idleClasses = light
              ? 'text-purple-400 border-transparent hover:text-purple-600 hover:bg-purple-50/50'
              : 'text-megara-light/40 border-transparent hover:text-megara-light/70 hover:bg-white/5';
            return (
              <button
                key={b}
                onClick={() => onBrandChange(b)}
                className={`font-serif px-6 py-3 font-medium text-sm border-b-2 transition-colors ${active ? activeClasses : idleClasses}`}>
                {b}
                <span className="text-xs opacity-50 ml-1">({brandCounts[b]})</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex gap-4 items-center w-full">
        <div className="relative flex-1 group">
          <Search
            className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${light ? 'text-purple-400 group-focus-within:text-purple-600' : 'text-magic-teal/50 group-focus-within:text-magic-teal'}`}
            size={18} />
          
          <input
            type="text"
            placeholder="Search the archives — ISCIs, markets, buyers, incantations..."
            className={`w-full rounded-lg py-3 pl-12 pr-4 focus:outline-none transition-all backdrop-blur-sm ${light ? 'bg-white/70 border border-purple-200 text-purple-900 placeholder:text-purple-400/50 focus:border-purple-400 focus:shadow-[0_0_15px_2px_rgba(147,51,234,0.1)]' : 'bg-underworld-800/40 border border-megara-dark/25 text-megara-light placeholder:text-megara-light/30 focus:border-magic-teal/50 focus:shadow-[0_0_20px_2px_rgba(0,206,209,0.1)]'}`} />
          
          <div
            className={`absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity ${light ? 'via-purple-400/30' : 'via-magic-teal/20'}`}>
          </div>
        </div>
        <button
          onClick={onToggleArchived}
          className={`flex items-center gap-3 px-4 py-2.5 rounded-lg border text-sm backdrop-blur-sm transition-colors cursor-pointer ${light
            ? showArchived
              ? 'border-amber-400 bg-amber-50'
              : 'border-purple-200 bg-white/60 hover:border-purple-400'
            : showArchived
              ? 'border-magic-gold/60 bg-magic-gold/10'
              : 'border-megara-dark/25 bg-underworld-800/40 hover:border-magic-gold/40'}`}>
          <Archive
            size={16}
            className={light ? 'text-amber-600/70' : 'text-magic-gold/70'} />
          <span
            className={`text-xs ${light ? 'text-purple-600/60' : 'text-megara-light/60'}`}>
            {archivedCount} archived
          </span>
          <span className={light ? 'text-purple-300' : 'text-megara-light/20'}>
            |
          </span>
          <span
            className={`text-xs ${light ? 'text-purple-600/60' : 'text-megara-light/60'}`}>
            {totalInstructions} shown
          </span>
          {showArchived && (
            <span
              className={`text-[10px] font-bold tracking-widest uppercase ml-1 ${light ? 'text-amber-700' : 'text-magic-gold'}`}>
              ON
            </span>
          )}
        </button>
      </div>

      <div
        className={`absolute bottom-0 left-8 right-8 h-px bg-gradient-to-r from-transparent ${light ? 'via-purple-300/30' : 'via-megara-dark/30'} to-transparent`}>
      </div>
    </header>);

}