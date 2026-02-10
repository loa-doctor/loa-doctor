export type MaterialType = 'abidos' | 'superior';

export const COSTS: Record<MaterialType, { rare: number, uncommon: number, common: number, gold: number }> = {
  abidos: { rare: 33, uncommon: 45, common: 86, gold: 400 },
  superior: { rare: 43, uncommon: 59, common: 112, gold: 520 }
};

export const BASE_DURATIONS: Record<MaterialType, number> = {
  abidos: 3600,
  superior: 4500
};

export interface MaterialSnapshot {
  count: number;
  price: number; // Unit price at the time
  total: number;
}

export interface CraftingEntry {
  id: string;
  timestamp: number;
  type: MaterialType;
  
  // Input Details (Snapshot)
  inputs: {
    rare: MaterialSnapshot;
    uncommon: MaterialSnapshot;
    common: MaterialSnapshot;
    gold: number; // Gold cost
  };

  // Output Details (Snapshot)
  outputs: {
    expectedCount: number;
    actualCount?: number;
    marketPrice: number; // Price per unit
  };

  // Financials
  totalCost: number;     // inputs.rare.total + ... + gold
  expectedRevenue: number; // outputs.expectedCount * marketPrice * 0.95
  actualRevenue?: number;  // outputs.actualCount * marketPrice * 0.95
  expectedProfit: number;
  actualProfit?: number;

  // Metadata
  duration?: number; // Duration in seconds
}
