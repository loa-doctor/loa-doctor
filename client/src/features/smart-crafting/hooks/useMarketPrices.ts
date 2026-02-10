import { useState, useCallback, useEffect, useRef } from 'react';
import { LostArkService } from '../services/lostark';
import { LOGGING_MATERIALS } from '../constants/items';

export interface MarketPrices {
    rare: number;
    uncommon: number;
    common: number;
    fusion: number;
    superiorFusion: number;
}

export interface BundleCounts {
    rare: number;
    uncommon: number;
    common: number;
    fusion: number;
    superiorFusion: number;
}

interface UseMarketPricesReturn {
    prices: MarketPrices;
    bundleCounts: BundleCounts;
    isLoading: boolean;
    isPriceLoaded: boolean;
    apiError: string | null;
    logs: string[];
    fetchPrices: (key: string, isBackground?: boolean) => Promise<void>;
    addLog: (msg: string) => void;
}

export function useMarketPrices(apiKey: string): UseMarketPricesReturn {
    const [prices, setPrices] = useState<MarketPrices>({ 
        rare: 0, uncommon: 0, common: 0, 
        fusion: 0, superiorFusion: 0 
    });
    const [bundleCounts, setBundleCounts] = useState<BundleCounts>({ 
        rare: 10, uncommon: 10, common: 10, 
        fusion: 10, superiorFusion: 10 
    });
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isPriceLoaded, setIsPriceLoaded] = useState<boolean>(false);
    const [logs, setLogs] = useState<string[]>([]);
    const [apiError, setApiError] = useState<string | null>(null);

    const addLog = useCallback((msg: string) => {
        const timestamp = new Date().toLocaleTimeString();
        setLogs(prev => [`[${timestamp}] ${msg}`, ...prev]);
    }, []);

    const fetchPrices = useCallback(async (currentKey: string, isBackground: boolean = false) => {
        if (!currentKey) return;
        
        setApiError(null);
        if (!isBackground) setIsPriceLoaded(false);

        // Sanitize and Validate Key
        const cleanKey = currentKey.trim();
        if (/[^\x00-\x7F]/.test(cleanKey)) {
            const errorMsg = "API Key에 허용되지 않는 문자(한글/특수문자)가 포함되어 있습니다.";
            addLog(`[오류] ${errorMsg}`);
            setApiError(errorMsg);
            setIsLoading(false);
            return;
        }

        if (!isBackground) setIsLoading(true);
        addLog(isBackground ? "시세 자동 갱신 중..." : "시세 조회 시작...");
        
        try {
            // Include Fusion Materials in list
            const itemsToCheck = [
                { ...LOGGING_MATERIALS.rare, key: 'rare' },
                { ...LOGGING_MATERIALS.uncommon, key: 'uncommon' },
                { ...LOGGING_MATERIALS.common, key: 'common' },
                { ...LOGGING_MATERIALS.fusion, key: 'fusion' },
                { ...LOGGING_MATERIALS.superiorFusion, key: 'superiorFusion' }
            ];

            const newPrices: Partial<MarketPrices> = {};
            const newBundles: Partial<BundleCounts> = {};

            for (const item of itemsToCheck) {
                // Only log detailed requests for manual updates to reduce noise
                if (!isBackground) addLog(`[요청] ${item.name} (ID: ${item.id}, Cat: ${item.categoryCode})`); 
                try {
                    const result = await LostArkService.getMarketPrice(cleanKey, item.id, item.name, item.categoryCode);
                    if (result !== null) {
                        if (!isBackground) addLog(`[수신] ${item.name}: ${result.price}G / unit: ${result.bundleCount}`);
                        newPrices[item.key as keyof MarketPrices] = result.price;
                        newBundles[item.key as keyof BundleCounts] = result.bundleCount;
                    } else {
                        if (!isBackground) addLog(`[실패] ${item.name}: 데이터 없음 (result is null)`);
                    }
                } catch (e: any) {
                    const errMsg = e instanceof Error ? e.message : String(e);
                    addLog(`[에러] ${item.name}: ${errMsg}`);
                    if (errMsg.includes('401') || errMsg.includes('403')) {
                        throw new Error("API Key 인증 실패 (401/403)");
                    }
                }
            }

            setPrices(prev => ({ ...prev, ...newPrices }));
            setBundleCounts(prev => ({ ...prev, ...newBundles }));
            setIsPriceLoaded(true);
            addLog(isBackground ? "시세 갱신 완료" : "시세 업데이트 완료");

        } catch (error: any) {
            const msg = error instanceof Error ? error.message : String(error) || "시세 조회 중 오류 발생";
            addLog(`전체 에러: ${msg}`);
            setApiError(msg);
        } finally {
            setIsLoading(false);
        }
    }, [addLog]);

    // Auto-refresh logic
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    
    useEffect(() => {
        if (!apiKey) return;

        // Initial load (Manual-like)
        fetchPrices(apiKey, false);

        const now = new Date();
        const msUntilNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
        
        const timeoutId = setTimeout(() => {
            fetchPrices(apiKey, true); // Background update
            intervalRef.current = setInterval(() => {
                fetchPrices(apiKey, true); // Background update
            }, 60000);
        }, msUntilNextMinute);

        return () => {
            clearTimeout(timeoutId);
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [apiKey, fetchPrices]);

    return {
        prices,
        bundleCounts,
        isLoading,
        isPriceLoaded,
        apiError,
        logs,
        fetchPrices,
        addLog
    };
}
