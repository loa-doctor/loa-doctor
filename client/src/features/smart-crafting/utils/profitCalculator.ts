import { MarketPrices, BundleCounts } from '../hooks/useMarketPrices';

/**
 * Calculates the profit based on actual output or falls back to the estimated hourly profit.
 * 
 * @param isComplete - Whether the crafting batch is complete
 * @param actualOutput - The actual number of items produced (as string)
 * @param hourlyRevenuePerItemSnapshot - Snapshot of revenue per item at start time
 * @param hourlyCostSnapshot - Snapshot of hourly cost at start time
 * @param defaultProfit - The estimated hourly profit to use as fallback
 * @returns The calculated rounded profit
 */
export const calculateProfit = (
    isComplete: boolean,
    actualOutput: string,
    hourlyRevenuePerItemSnapshot: number | undefined,
    hourlyCostSnapshot: number | undefined,
    defaultProfit: number | undefined,
    // Real-time Override
    currentPrices?: MarketPrices,
    currentBundleCounts?: BundleCounts,
    timeCoef?: number,
    type?: 'abidos' | 'superior',
    expectedOutput?: number,
    isUsage: boolean = false
): number => {
    // Determine Quantity
    const quantity = (isComplete && actualOutput && !isNaN(Number(actualOutput))) 
        ? Number(actualOutput) 
        : expectedOutput;

    // Determine Cost
    const cost = hourlyCostSnapshot;

    if (quantity !== undefined && cost !== undefined) {
        // Option A: Real-time Calculation
        if (currentPrices && currentBundleCounts && timeCoef !== undefined && type) {
            const fusionKey = type === 'abidos' ? 'fusion' : 'superiorFusion';
            const price = currentPrices[fusionKey];
            const bundle = currentBundleCounts[fusionKey] || 1;
            const unitPrice = bundle > 0 ? price / bundle : 0;
            
            // Apply Tax if Selling
            const realizedPrice = isUsage ? unitPrice : unitPrice * 0.95;
            
            // Revenue Per Item (Hourly Scaled)
            // Revenue = realizedPrice * quantity
            // Hourly Revenue = (Revenue) * timeCoef
            // Actually, calculateProfit logic was: (RevenuePerItemSnapshot * Count) - CostSnapshot
            // RevenuePerItemSnapshot was (UnitRevenue * TimeCoef).
            
            const revenuePerItemHourly = realizedPrice * timeCoef;
            return Math.floor((revenuePerItemHourly * quantity) - cost);
        }

        // Option B: Snapshot Calculation (Legacy/Fallback)
        if (hourlyRevenuePerItemSnapshot !== undefined) {
             return Math.floor((hourlyRevenuePerItemSnapshot * quantity) - cost);
        }
    }

    // Default Fallback (if no data available)
    return defaultProfit || 0;
};
