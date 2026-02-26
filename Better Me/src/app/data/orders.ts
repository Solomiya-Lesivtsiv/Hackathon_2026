export interface Order {
  id: string;
  timestamp: string;
  latitude: number;
  longitude: number;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  jurisdictions: Jurisdiction[];
  taxBreakdown: TaxBreakdown;
}

export interface Jurisdiction {
  name: string;
  type: "State" | "County" | "City" | "Special";
}

export interface TaxBreakdown {
  state: { rate: number; amount: number };
  county: { rate: number; amount: number };
  city: { rate: number; amount: number };
  special: { rate: number; amount: number };
  composite: number;
}

// Mock NY State jurisdictions and tax rates
const jurisdictions = [
  {
    name: "Queens County",
    city: "New York City",
    state: { rate: 4, amount: 0 },
    county: { rate: 4.5, amount: 0 },
    city: { rate: 0.45, amount: 0 },
    special: { rate: 0.375, amount: 0 },
  },
  {
    name: "Kings County",
    city: "Brooklyn",
    state: { rate: 4, amount: 0 },
    county: { rate: 4.5, amount: 0 },
    city: { rate: 0, amount: 0 },
    special: { rate: 0.375, amount: 0 },
  },
  {
    name: "Nassau County",
    city: "Hempstead",
    state: { rate: 4, amount: 0 },
    county: { rate: 4.25, amount: 0 },
    city: { rate: 0, amount: 0 },
    special: { rate: 0, amount: 0 },
  },
  {
    name: "Suffolk County",
    city: "Islip",
    state: { rate: 4, amount: 0 },
    county: { rate: 4.25, amount: 0 },
    city: { rate: 0, amount: 0 },
    special: { rate: 0, amount: 0 },
  },
];

function generateOrder(index: number): Order {
  const baseDate = new Date("2025-11-04T10:00:00");
  const timestamp = new Date(baseDate.getTime() + index * 1000 * 60 * 17);
  
  const subtotals = [50, 25.99, 100, 75.5, 42, 33.33, 89.99, 120, 15.5, 200];
  const subtotal = subtotals[index % subtotals.length];
  
  const jurisdiction = jurisdictions[index % jurisdictions.length];
  
  const stateAmount = +(subtotal * (jurisdiction.state.rate / 100)).toFixed(2);
  const countyAmount = +(subtotal * (jurisdiction.county.rate / 100)).toFixed(2);
  const cityAmount = +(subtotal * (jurisdiction.city.rate / 100)).toFixed(2);
  const specialAmount = +(subtotal * (jurisdiction.special.rate / 100)).toFixed(2);
  
  const taxRate = jurisdiction.state.rate + jurisdiction.county.rate + jurisdiction.city.rate + jurisdiction.special.rate;
  const taxAmount = +(stateAmount + countyAmount + cityAmount + specialAmount).toFixed(2);
  const total = +(subtotal + taxAmount).toFixed(2);
  
  // NY State coordinates range
  const lat = 40.5 + Math.random() * 1.5;
  const lng = -74.2 + Math.random() * 0.8;
  
  return {
    id: `ORD-${String(1000 + index).padStart(5, "0")}`,
    timestamp: timestamp.toISOString(),
    latitude: +lat.toFixed(6),
    longitude: +lng.toFixed(6),
    subtotal,
    taxRate,
    taxAmount,
    total,
    jurisdictions: [
      { name: "New York", type: "State" },
      { name: jurisdiction.name, type: "County" },
      { name: jurisdiction.city, type: "City" },
      ...(jurisdiction.special.rate > 0 ? [{ name: "Special District", type: "Special" as const }] : []),
    ],
    taxBreakdown: {
      state: { rate: jurisdiction.state.rate, amount: stateAmount },
      county: { rate: jurisdiction.county.rate, amount: countyAmount },
      city: { rate: jurisdiction.city.rate, amount: cityAmount },
      special: { rate: jurisdiction.special.rate, amount: specialAmount },
      composite: +taxRate.toFixed(3),
    },
  };
}

export const mockOrders: Order[] = Array.from({ length: 50 }, (_, i) => generateOrder(i));

export function calculateTaxForCoordinates(lat: number, lng: number, subtotal: number) {
  // Simple mock logic based on lat/lng ranges
  let jurisdiction;
  
  if (lat >= 40.6 && lat <= 40.8 && lng >= -73.95 && lng <= -73.7) {
    jurisdiction = jurisdictions[0]; // Queens
  } else if (lat >= 40.55 && lat <= 40.75 && lng >= -74.05 && lng <= -73.85) {
    jurisdiction = jurisdictions[1]; // Kings
  } else if (lat >= 40.65 && lat <= 40.85 && lng >= -73.7 && lng <= -73.5) {
    jurisdiction = jurisdictions[2]; // Nassau
  } else {
    jurisdiction = jurisdictions[3]; // Suffolk
  }
  
  const stateAmount = +(subtotal * (jurisdiction.state.rate / 100)).toFixed(2);
  const countyAmount = +(subtotal * (jurisdiction.county.rate / 100)).toFixed(2);
  const cityAmount = +(subtotal * (jurisdiction.city.rate / 100)).toFixed(2);
  const specialAmount = +(subtotal * (jurisdiction.special.rate / 100)).toFixed(2);
  
  const taxRate = jurisdiction.state.rate + jurisdiction.county.rate + jurisdiction.city.rate + jurisdiction.special.rate;
  const taxAmount = +(stateAmount + countyAmount + cityAmount + specialAmount).toFixed(2);
  const total = +(subtotal + taxAmount).toFixed(2);
  
  return {
    jurisdiction: `${jurisdiction.name}, ${jurisdiction.city}, NY`,
    taxBreakdown: {
      state: { rate: jurisdiction.state.rate, amount: stateAmount },
      county: { rate: jurisdiction.county.rate, amount: countyAmount },
      city: { rate: jurisdiction.city.rate, amount: cityAmount },
      special: { rate: jurisdiction.special.rate, amount: specialAmount },
      composite: +taxRate.toFixed(3),
    },
    taxRate,
    taxAmount,
    total,
  };
}
