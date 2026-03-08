import { GEM_LEVELS, GemLevel, GemType } from '../constants/gemData';

export interface GemPrices {
    crimson: Record<number, number>;
    azure: Record<number, number>;
}

export interface BreakEvenPoint {
    level: number;
    amountNeeded: number;
    breakEvenUnitPrice: number; 
    currentCheapestPrice: number;
    isProfitable: boolean;
}

export interface BreakEvenResult {
    targetLevel: GemLevel;
    targetType: GemType;
    targetDirectPrice: number;
    breakEvenPoints: BreakEvenPoint[];
}

export function getCheapestPrice(level: number, prices: GemPrices): number {
    const c = prices.crimson[level] || Infinity;
    const a = prices.azure[level] || Infinity;
    const min = Math.min(c, a);
    return min === Infinity ? 0 : min;
}

/**
 * Calculates the break-even unit price for buying lower tier gems to reach the target gem.
 * If you buy lower tier gems below this breakEvenUnitPrice, it is cheaper than buying the target gem directly.
 */
export function calculateGemBreakEvenPrices(targetLevel: GemLevel, targetType: GemType, prices: GemPrices): BreakEvenResult | null {
    let directPrice = 0;
    let expectedSynthesizedValue = 0;

    if (targetType === 'any') {
        directPrice = getCheapestPrice(targetLevel, prices);
        // For 'any' type, we don't care about the 50/50 outcome because both are acceptable.
        // The value of the synthesized gem is just the price of the cheapest option.
        expectedSynthesizedValue = directPrice;
    } else {
        directPrice = prices[targetType]?.[targetLevel] || 0;
        
        // When synthesizing a specific gem (crimson or azure), 
        // the result is 50% Crimson and 50% Azure.
        // If the user gets the target type, they equip it (Value = TargetPrice).
        // If they get the wrong type, they sell it on the auction house (5% fee) and buy the target type.
        // Net Value = 0.5 * TargetPrice + 0.5 * (WrongPrice * 0.95)
        const wrongType = targetType === 'crimson' ? 'azure' : 'crimson';
        const wrongPrice = prices[wrongType]?.[targetLevel] || getCheapestPrice(targetLevel, prices); // Fallback to cheapest if missing
        expectedSynthesizedValue = 0.5 * directPrice + 0.475 * wrongPrice;
    }

    if (directPrice === 0) return null;

    const breakEvenPoints: BreakEvenPoint[] = [];

    // Check all lower levels down to 5
    for (let l = targetLevel - 1; l >= 5; l--) {
        const amountNeeded = Math.pow(3, targetLevel - l);
        
        // The maximum we should spend on `amountNeeded` lower gems is the expected value of the resulting synthesized gem
        const breakEvenUnitPrice = Math.floor(expectedSynthesizedValue / amountNeeded);
        
        const currentCheapestPrice = getCheapestPrice(l, prices);
        const isProfitable = currentCheapestPrice > 0 && currentCheapestPrice <= breakEvenUnitPrice;

        breakEvenPoints.push({
            level: l,
            amountNeeded,
            breakEvenUnitPrice,
            currentCheapestPrice,
            isProfitable
        });
    }

    // Sort by level descending (closest level first)
    breakEvenPoints.sort((a, b) => b.level - a.level);

    return {
        targetLevel,
        targetType,
        targetDirectPrice: directPrice,
        breakEvenPoints
    };
}

export interface InventoryState {
    gold: number;
    gems: Record<number, number>; // level -> count
}

export interface InventoryCalculationResult {
    isMarketAvailable: boolean;
    missingBaseUnits: number;
    synthesisCost: number;
    purchasePlan: Record<number, number>;
    keepPlan: Record<number, number>;
    sellPlan: Record<number, number>;
    totalBuyCost: number;
    totalSellIncome: number;
    success: {
        cost: number;
        remainingGold: number;
    };
    // If targetType is 'any', failure is null because any outcome is acceptable
    failure: null | {
        cost: number;
        remainingGold: number;
    };
    directPurchase: {
        remainingGold: number;
        targetPrice: number;
        totalSellIncome: number;
    };
}

export function calculateInventorySynthesis(
    targetLevel: GemLevel, 
    targetType: GemType, 
    inventory: InventoryState, 
    prices: GemPrices
): InventoryCalculationResult {
    // 1. Calculate how many Level 5 base units are needed in total.
    const totalNeededBaseUnits = Math.pow(3, targetLevel - 5);

    // 2. Calculate how many Level 5 base units the user has in inventory.
    let currentBaseUnits = 0;
    for (const level of GEM_LEVELS) {
        if (level < targetLevel) {
            currentBaseUnits += (inventory.gems[level] || 0) * Math.pow(3, level - 5);
        } else if (level >= targetLevel && (inventory.gems[level] || 0) > 0) {
            // If they already have a gem of target level or higher, they already reached the goal!
            currentBaseUnits += totalNeededBaseUnits; 
        }
    }
    const missingBaseUnits = Math.max(0, totalNeededBaseUnits - currentBaseUnits);

    // Total sell value of ALL inventory items (< targetLevel)
    let totalSellValue = 0;
    for (let l = 5; l < targetLevel; l++) {
        const count = inventory.gems[l] || 0;
        const cheapest = getCheapestPrice(l, prices);
        if (cheapest > 0) {
            totalSellValue += count * Math.floor(cheapest * 0.95);
        }
    }

    const dp = new Array(totalNeededBaseUnits + 1).fill(Infinity);
    const prev = new Array(totalNeededBaseUnits + 1).fill(null);
    dp[0] = 0;

    // 1. Process market (unbounded)
    for (let l = 5; l < targetLevel; l++) {
        const u = Math.pow(3, l - 5);
        const cheapestMarketPrice = getCheapestPrice(l, prices);
        if (cheapestMarketPrice > 0) {
            for (let r = u; r <= totalNeededBaseUnits; r++) {
                if (dp[r - u] + cheapestMarketPrice < dp[r]) {
                    dp[r] = dp[r - u] + cheapestMarketPrice;
                    prev[r] = { fromR: r - u, type: 'market', level: l };
                }
            }
        }
    }

    // 2. Process inventory (0-1)
    for (let l = 5; l < targetLevel; l++) {
        const count = inventory.gems[l] || 0;
        const u = Math.pow(3, l - 5);
        const cheapestMarketPrice = getCheapestPrice(l, prices);
        const sellValue = cheapestMarketPrice > 0 ? Math.floor(cheapestMarketPrice * 0.95) : 0;
        
        for (let i = 0; i < count; i++) {
            for (let r = totalNeededBaseUnits; r >= u; r--) {
                if (dp[r - u] + sellValue < dp[r]) {
                    dp[r] = dp[r - u] + sellValue;
                    prev[r] = { fromR: r - u, type: 'keep', level: l };
                }
            }
        }
    }

    const opportunityAndBuyCost = dp[totalNeededBaseUnits];
    const isMarketAvailable = opportunityAndBuyCost !== Infinity;

    const purchasePlan: Record<number, number> = {};
    const keepPlan: Record<number, number> = {};
    const sellPlan: Record<number, number> = {};
    let totalBuyCost = 0;
    let totalSellIncomeForSynthesisRoute = 0;

    if (isMarketAvailable) {
        let currentR = totalNeededBaseUnits;
        while (currentR > 0) {
            const step = prev[currentR];
            if (!step) break;
            if (step.type === 'market') {
                purchasePlan[step.level] = (purchasePlan[step.level] || 0) + 1;
                totalBuyCost += getCheapestPrice(step.level, prices);
            } else if (step.type === 'keep') {
                keepPlan[step.level] = (keepPlan[step.level] || 0) + 1;
            }
            currentR = step.fromR;
        }

        // Calculate what gets sold
        for (let l = 5; l < targetLevel; l++) {
            const owned = inventory.gems[l] || 0;
            const kept = keepPlan[l] || 0;
            const sold = owned - kept;
            if (sold > 0) {
                sellPlan[l] = sold;
                const cheapest = getCheapestPrice(l, prices);
                if (cheapest > 0) {
                    totalSellIncomeForSynthesisRoute += sold * Math.floor(cheapest * 0.95);
                }
            }
        }
    }

    const synthesisSuccessRemainingGold = isMarketAvailable 
        ? inventory.gold + totalSellValue - opportunityAndBuyCost 
        : -Infinity;

    // 4. Calculate Success and Failure cases
    const directTargetPrice = targetType === 'any' 
        ? getCheapestPrice(targetLevel, prices) 
        : (prices[targetType]?.[targetLevel] || 0);

    const wrongType = targetType === 'crimson' ? 'azure' : 'crimson';
    const wrongPrice = targetType === 'any' 
        ? 0 
        : (prices[wrongType]?.[targetLevel] || getCheapestPrice(targetLevel, prices));

    const failureExtraCost = targetType === 'any' ? 0 : directTargetPrice - Math.floor(wrongPrice * 0.95);
    const failureRemainingGold = isMarketAvailable ? (synthesisSuccessRemainingGold - failureExtraCost) : -Infinity;

    const directPurchaseRemainingGold = directTargetPrice > 0 
        ? inventory.gold + totalSellValue - directTargetPrice 
        : -Infinity;

    return {
        isMarketAvailable,
        missingBaseUnits,
        synthesisCost: isMarketAvailable ? (totalBuyCost - totalSellIncomeForSynthesisRoute) : Infinity,
        purchasePlan,
        keepPlan,
        sellPlan,
        totalBuyCost,
        totalSellIncome: totalSellIncomeForSynthesisRoute,
        success: {
            cost: totalBuyCost - totalSellIncomeForSynthesisRoute,
            remainingGold: synthesisSuccessRemainingGold
        },
        failure: targetType === 'any' ? null : {
            cost: (totalBuyCost - totalSellIncomeForSynthesisRoute) + failureExtraCost,
            remainingGold: failureRemainingGold
        },
        directPurchase: {
            remainingGold: directPurchaseRemainingGold,
            targetPrice: directTargetPrice,
            totalSellIncome: totalSellValue
        }
    };
}
