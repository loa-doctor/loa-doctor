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
    defaultProfit: number | undefined
): number => {
    if (isComplete && 
        actualOutput && 
        !isNaN(Number(actualOutput)) && 
        hourlyRevenuePerItemSnapshot !== undefined && 
        hourlyCostSnapshot !== undefined
    ) {
        return Math.floor((hourlyRevenuePerItemSnapshot * Number(actualOutput)) - hourlyCostSnapshot);
    }
    return defaultProfit || 0;
};
