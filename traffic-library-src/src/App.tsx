import React, { useEffect, useMemo, useState, createContext } from 'react';
import { LibraryHeader } from './components/LibraryHeader';
import { CatalogCards } from './components/CatalogCards';
import { BookShelf } from './components/BookShelf';
import { BookOpen } from './components/BookOpen';
import { mockData, Instruction, Month, Brand } from './data/trafficData';
export const ThemeContext = createContext(false);
interface SoulParticle {
  id: number;
  left: string;
  bottom: string;
  size: number;
  type: 'soul-teal' | 'soul-purple' | 'soul-gold' | 'soul-ember';
  delay: string;
  duration: string;
}
export function App() {
  const [isLightMode, setIsLightMode] = useState(false);
  const [brand, setBrand] = useState<Brand>('Postman Law');
  const [showArchived, setShowArchived] = useState(true);
  const [selectedInstruction, setSelectedInstruction] =
  useState<Instruction | null>(null);
  useEffect(() => {
    if (isLightMode) {
      document.body.classList.add('light');
    } else {
      document.body.classList.remove('light');
    }
  }, [isLightMode]);
  const particles = useMemo<SoulParticle[]>(() => {
    const types: SoulParticle['type'][] = [
    'soul-teal',
    'soul-purple',
    'soul-gold',
    'soul-ember'];

    return Array.from({
      length: 60
    }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}vw`,
      bottom: `${-10 + Math.random() * 20}px`,
      size: 1 + Math.random() * 4,
      type: types[i % types.length],
      delay: `${Math.random() * 20}s`,
      duration: `${8 + Math.random() * 18}s`
    }));
  }, []);
  // Brand counts across ALL data (for the header tabs)
  const brandCounts = {
    'Postman Law': mockData.filter((i) => i.brand === 'Postman Law').length,
    'Wettermark Keith': mockData.filter((i) => i.brand === 'Wettermark Keith').length,
  };
  // Filter to the currently-selected brand — brands have different rules and
  // the two are never reconciled in one view. Archived records (more than two
  // broadcast months old, so e.g. December 2025 when current month is April
  // 2026) are hidden unless the user toggles Show Archived.
  const brandOnly = mockData.filter((i) => i.brand === brand);
  const brandData = showArchived
    ? brandOnly
    : brandOnly.filter((i) => !(i as any).archived);
  const archivedCount = brandOnly.filter((i) => (i as any).archived).length;
  // Derive month order from whatever months are present, newest first. The
  // upstream hardcoded ['April','March','December'] and dropped everything
  // else — real data spans any month of the year.
  const MONTH_NAMES: Month[] = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
  ];
  const presentMonths = Array.from(new Set(brandData.map((i) => i.month))) as Month[];
  const monthOrder: Month[] = MONTH_NAMES.filter((m) => presentMonths.includes(m)).reverse();
  const groupedByMonth = brandData.reduce(
    (acc, inst) => {
      if (!acc[inst.month]) acc[inst.month] = [];
      acc[inst.month].push(inst);
      return acc;
    },
    {} as Record<string, Instruction[]>
  );
  const sortedMonths = monthOrder.filter((m) => groupedByMonth[m]?.length > 0);
  const totalMarkets = new Set(brandData.map((i) => i.market)).size;
  const light = isLightMode;
  return (
    <ThemeContext.Provider value={isLightMode}>
      <div
        className={`min-h-screen w-full flex flex-col relative overflow-hidden font-sans transition-colors duration-700 ${light ? 'bg-[#f5eef8]' : ''}`}>
        
        {/* Background layers — absolute (not fixed) so they stay bound to the
            library's own frame when it's embedded in a host app's content
            column instead of owning the whole viewport. */}
        <div
          className={`absolute inset-0 pointer-events-none z-0 transition-all duration-700 ${light ? 'bg-[radial-gradient(ellipse_at_top,#f8f0fc,#ede4f3,#e0d4ec)]' : 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-underworld-800 via-underworld-900 to-black'}`}>
        </div>

        {/* Vignette */}
        <div
          className={`absolute inset-0 pointer-events-none z-[1] ${light ? 'library-vignette-light' : 'library-vignette'}`}>
        </div>

        {/* Bottom fog */}
        <div className="absolute inset-0 pointer-events-none z-[1] library-fog"></div>

        {/* Ambient light pools */}
        <div
          className={`absolute top-0 left-1/4 w-96 h-96 rounded-full blur-[120px] pointer-events-none z-0 transition-colors duration-700 ${light ? 'bg-purple-300/20' : 'bg-megara-primary/5'}`}>
        </div>
        <div
          className={`absolute top-1/3 right-1/4 w-80 h-80 rounded-full blur-[100px] pointer-events-none z-0 transition-colors duration-700 ${light ? 'bg-pink-200/20' : 'bg-magic-teal/5'}`}>
        </div>
        <div
          className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-64 rounded-full blur-[80px] pointer-events-none z-0 transition-colors duration-700 ${light ? 'bg-amber-200/15' : 'bg-magic-gold/3'}`}>
        </div>

        {/* Soul particles */}
        {particles.map((p) =>
        <div
          key={p.id}
          className={`soul-particle ${p.type}`}
          style={
          {
            left: p.left,
            bottom: p.bottom,
            width: `${p.size}px`,
            height: `${p.size}px`,
            '--delay': p.delay,
            '--duration': p.duration
          } as React.CSSProperties
          } />

        )}

        <LibraryHeader
          isLightMode={isLightMode}
          toggleTheme={() => setIsLightMode(!isLightMode)}
          brand={brand}
          onBrandChange={setBrand}
          brandCounts={brandCounts}
          totalInstructions={brandData.length}
          totalMarkets={totalMarkets}
          archivedCount={archivedCount}
          showArchived={showArchived}
          onToggleArchived={() => setShowArchived((p) => !p)} />


        <CatalogCards
          instructions={brandData}
          months={sortedMonths}
          light={light} />


        <main className="flex-1 overflow-y-auto hide-scrollbar flex flex-col relative z-10">
          <div className="px-8 pb-32 flex-1 relative">
            <div
              className={`absolute inset-0 pointer-events-none opacity-[0.06] flex justify-between px-16`}>
              
              <div
                className={`w-20 h-full bg-gradient-to-b ${light ? 'from-purple-400/30 via-purple-300/10' : 'from-megara-dark/50 via-megara-dark/20'} to-transparent border-x ${light ? 'border-purple-300/20' : 'border-megara-dark/30'}`}>
              </div>
              <div
                className={`w-20 h-full bg-gradient-to-b ${light ? 'from-purple-400/30 via-purple-300/10' : 'from-megara-dark/50 via-megara-dark/20'} to-transparent border-x ${light ? 'border-purple-300/20' : 'border-megara-dark/30'}`}>
              </div>
            </div>

            <div className="max-w-6xl mx-auto relative z-10">
              {sortedMonths.map((month) =>
              <div key={month} id={`month-${month}`}>
                  <BookShelf
                  month={month}
                  instructions={groupedByMonth[month]}
                  onBookClick={setSelectedInstruction}
                  light={light} />
                
                </div>
              )}
            </div>
          </div>
        </main>

        <BookOpen
          instruction={selectedInstruction}
          onClose={() => setSelectedInstruction(null)}
          light={light} />
        
      </div>
    </ThemeContext.Provider>);

}