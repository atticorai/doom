export type MediaType = 'TV' | 'Radio' | 'Streaming Audio' | 'Cable' | 'OOH';
export type Market = 'Chicago' | 'Cincinnati' | 'Denver' | 'Minneapolis';
export type Month = 'December' | 'March' | 'April';
export type Brand = 'Postman Law' | 'Wettermark Keith';

export interface Instruction {
  id: string;
  brand: Brand;
  market: Market;
  mediaType: MediaType;
  month: Month;
  estimate: string;
  version: string;
  iscis: string;
  dateRange: string;
  buyer: string;
  status: 'sent' | 'pending';
}

const baseMockData: Instruction[] = [
// Postman Law - April - TV
{
  id: '1',
  brand: 'Postman Law',
  market: 'Chicago',
  mediaType: 'TV',
  month: 'April',
  estimate: '2609 + 2610 + 2611 + 2612 + 2613 + 2614',
  version: 'v1',
  iscis: '10 ISCIs',
  dateRange: '3/30 - 4/26',
  buyer: 'Lynn Cortelezzi',
  status: 'sent'
},
{
  id: '2',
  brand: 'Postman Law',
  market: 'Cincinnati',
  mediaType: 'TV',
  month: 'April',
  estimate: '2617 + 2618 + 2619 + 2620 + 2621 + 2622',
  version: 'v1',
  iscis: '10 ISCIs',
  dateRange: '3/30 - 4/26',
  buyer: 'Lynn Cortelezzi',
  status: 'sent'
},
{
  id: '3',
  brand: 'Postman Law',
  market: 'Denver',
  mediaType: 'TV',
  month: 'April',
  estimate: '2625 + 2626 + 2627 + 2628 + 2629 + 2630',
  version: 'v1',
  iscis: '10 ISCIs',
  dateRange: '3/30 - 4/26',
  buyer: 'Lynn Cortelezzi',
  status: 'sent'
},
{
  id: '4',
  brand: 'Postman Law',
  market: 'Minneapolis',
  mediaType: 'TV',
  month: 'April',
  estimate: '2601 + 2602 + 2603 + 2605 + 2606 + 2633',
  version: 'v1',
  iscis: '10 ISCIs',
  dateRange: '3/30 - 4/26',
  buyer: 'Ken Lazar',
  status: 'sent'
},

// Postman Law - April - Radio
{
  id: '5',
  brand: 'Postman Law',
  market: 'Chicago',
  mediaType: 'Radio',
  month: 'April',
  estimate: '2615',
  version: 'v1',
  iscis: '8 ISCIs',
  dateRange: '3/30 - 4/26',
  buyer: 'Lynn Cortelezzi',
  status: 'sent'
},
{
  id: '6',
  brand: 'Postman Law',
  market: 'Cincinnati',
  mediaType: 'Radio',
  month: 'April',
  estimate: '2623',
  version: 'v1',
  iscis: '8 ISCIs',
  dateRange: '3/30 - 4/26',
  buyer: 'Lynn Cortelezzi',
  status: 'sent'
},
{
  id: '7',
  brand: 'Postman Law',
  market: 'Denver',
  mediaType: 'Radio',
  month: 'April',
  estimate: '2631',
  version: 'v1',
  iscis: '8 ISCIs',
  dateRange: '3/30 - 4/26',
  buyer: 'Lynn Cortelezzi',
  status: 'sent'
},
{
  id: '8',
  brand: 'Postman Law',
  market: 'Minneapolis',
  mediaType: 'Radio',
  month: 'April',
  estimate: '2607',
  version: 'v1',
  iscis: '8 ISCIs',
  dateRange: '3/30 - 4/26',
  buyer: 'Ken Lazar',
  status: 'pending'
},

// Postman Law - April - Streaming Audio
{
  id: '9',
  brand: 'Postman Law',
  market: 'Chicago',
  mediaType: 'Streaming Audio',
  month: 'April',
  estimate: '2616',
  version: 'v1',
  iscis: '8 ISCIs 1 stations',
  dateRange: '3/30 - 4/26',
  buyer: 'Lynn Cortelezzi',
  status: 'sent'
},
{
  id: '10',
  brand: 'Postman Law',
  market: 'Denver',
  mediaType: 'Streaming Audio',
  month: 'April',
  estimate: '2632',
  version: 'v1',
  iscis: '8 ISCIs 1 stations',
  dateRange: '3/30 - 4/26',
  buyer: 'Lynn Cortelezzi',
  status: 'sent'
},

// Postman Law - April - Cable
{
  id: '11',
  brand: 'Postman Law',
  market: 'Chicago',
  mediaType: 'Cable',
  month: 'April',
  estimate: '2613',
  version: 'v1',
  iscis: '10 ISCIs 1 stations',
  dateRange: '3/30 - 4/26',
  buyer: 'Lynn Cortelezzi',
  status: 'pending'
},
{
  id: '12',
  brand: 'Postman Law',
  market: 'Cincinnati',
  mediaType: 'Cable',
  month: 'April',
  estimate: '2621',
  version: 'v1',
  iscis: '10 ISCIs 1 stations',
  dateRange: '3/30 - 4/26',
  buyer: 'Lynn Cortelezzi',
  status: 'pending'
},
{
  id: '13',
  brand: 'Postman Law',
  market: 'Denver',
  mediaType: 'Cable',
  month: 'April',
  estimate: '2629',
  version: 'v1',
  iscis: '10 ISCIs 1 stations',
  dateRange: '3/30 - 4/26',
  buyer: 'Lynn Cortelezzi',
  status: 'pending'
},
{
  id: '14',
  brand: 'Postman Law',
  market: 'Minneapolis',
  mediaType: 'Cable',
  month: 'April',
  estimate: '2605',
  version: 'v1',
  iscis: '10 ISCIs 1 stations',
  dateRange: '3/30 - 4/26',
  buyer: 'Ken Lazar',
  status: 'pending'
},

// Postman Law - April - OOH
{
  id: '15',
  brand: 'Postman Law',
  market: 'Minneapolis',
  mediaType: 'OOH',
  month: 'April',
  estimate: 'OOH-MSP-PL',
  version: 'v1',
  iscis: '3 creatives 3 units',
  dateRange: '3/30',
  buyer: 'Ken Lazar',
  status: 'sent'
},

// Postman Law - March - TV
{
  id: '16',
  brand: 'Postman Law',
  market: 'Chicago',
  mediaType: 'TV',
  month: 'March',
  estimate: '2609',
  version: 'v1',
  iscis: '10 ISCIs',
  dateRange: '2/23 - 3/29',
  buyer: 'Lynn Cortelezzi',
  status: 'pending'
},
{
  id: '17',
  brand: 'Postman Law',
  market: 'Cincinnati',
  mediaType: 'TV',
  month: 'March',
  estimate: '2617',
  version: 'v1',
  iscis: '10 ISCIs',
  dateRange: '2/23 - 3/29',
  buyer: 'Lynn Cortelezzi',
  status: 'pending'
},
{
  id: '18',
  brand: 'Postman Law',
  market: 'Denver',
  mediaType: 'TV',
  month: 'March',
  estimate: '2625',
  version: 'v1',
  iscis: '8 ISCIs',
  dateRange: '2/23 - 3/29',
  buyer: 'Lynn Cortelezzi',
  status: 'pending'
},
{
  id: '19',
  brand: 'Postman Law',
  market: 'Minneapolis',
  mediaType: 'TV',
  month: 'March',
  estimate: '2601',
  version: 'v1',
  iscis: '10 ISCIs',
  dateRange: '2/23 - 3/29',
  buyer: 'Ken Lazar',
  status: 'pending'
},

// Postman Law - March - Radio
{
  id: '20',
  brand: 'Postman Law',
  market: 'Chicago',
  mediaType: 'Radio',
  month: 'March',
  estimate: '2615',
  version: 'v1',
  iscis: '8 ISCIs',
  dateRange: '2/23 - 3/29',
  buyer: 'Lynn Cortelezzi',
  status: 'pending'
},
{
  id: '21',
  brand: 'Postman Law',
  market: 'Cincinnati',
  mediaType: 'Radio',
  month: 'March',
  estimate: '2623',
  version: 'v1',
  iscis: '8 ISCIs',
  dateRange: '2/23 - 3/29',
  buyer: 'Lynn Cortelezzi',
  status: 'pending'
},
{
  id: '22',
  brand: 'Postman Law',
  market: 'Denver',
  mediaType: 'Radio',
  month: 'March',
  estimate: '2631',
  version: 'v1',
  iscis: '8 ISCIs',
  dateRange: '2/23 - 3/29',
  buyer: 'Lynn Cortelezzi',
  status: 'pending'
},
{
  id: '23',
  brand: 'Postman Law',
  market: 'Minneapolis',
  mediaType: 'Radio',
  month: 'March',
  estimate: '2607',
  version: 'v1',
  iscis: '8 ISCIs',
  dateRange: '2/23 - 3/29',
  buyer: 'Ken Lazar',
  status: 'pending'
},

// Postman Law - December - Radio
{
  id: '24',
  brand: 'Postman Law',
  market: 'Chicago',
  mediaType: 'Radio',
  month: 'December',
  estimate: '2615',
  version: 'v1',
  iscis: '8 ISCIs',
  dateRange: '12/01 - 12/28',
  buyer: 'Lynn Cortelezzi',
  status: 'pending'
}];

// Host Doom app injects real trafficHistory into window.MegaraLibraryData
// before rendering. Falls back to the hand-curated baseMockData above when
// running standalone (e.g. during `vite preview`). A Proxy keeps the export
// "live" — every property access hits window.MegaraLibraryData fresh, so the
// Library re-renders with current data. Everything above is verbatim from
// the upstream repo.
const _resolveData = (): Instruction[] =>
  (typeof window !== 'undefined' && (window as any).MegaraLibraryData)
    ? (window as any).MegaraLibraryData
    : baseMockData;

export const mockData: Instruction[] = new Proxy([] as Instruction[], {
  get(_t, prop) {
    const arr = _resolveData();
    const value = (arr as any)[prop];
    return typeof value === 'function' ? value.bind(arr) : value;
  },
  has(_t, prop) { return prop in _resolveData(); },
  ownKeys() { return Reflect.ownKeys(_resolveData()); },
  getOwnPropertyDescriptor(_t, prop) {
    return Object.getOwnPropertyDescriptor(_resolveData(), prop);
  },
}) as Instruction[];

export const marketColors: Record<Market, string> = {
  Chicago: 'text-market-chicago',
  Cincinnati: 'text-market-cincinnati',
  Denver: 'text-market-denver',
  Minneapolis: 'text-market-minneapolis'
};

export const marketBgColors: Record<Market, string> = {
  Chicago: 'bg-market-chicago',
  Cincinnati: 'bg-market-cincinnati',
  Denver: 'bg-market-denver',
  Minneapolis: 'bg-market-minneapolis'
};

export const marketBorderColors: Record<Market, string> = {
  Chicago: 'border-market-chicago',
  Cincinnati: 'border-market-cincinnati',
  Denver: 'border-market-denver',
  Minneapolis: 'border-market-minneapolis'
};