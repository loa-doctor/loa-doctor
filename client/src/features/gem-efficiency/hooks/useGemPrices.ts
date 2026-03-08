import { useState, useCallback, useEffect, useRef } from 'react';
import { LostArkService } from '../../smart-crafting/services/lostark';
import { GEM_LEVELS, GEM_TIER, GEM_CATEGORY_CODE, GemType } from '../constants/gemData';

export interface GemPrices {
    crimson: Record<number, number>;
    azure: Record<number, number>;
}

export function useGemPrices(apiKey: string) {
    const [prices, setPrices] = useState<GemPrices>({
        crimson: {},
        azure: {}
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

        const cleanKey = currentKey.trim();
        if (/[^\x00-\x7F]/.test(cleanKey)) {
            const errorMsg = "API Key에 허용되지 않는 문자(한글/특수문자)가 포함되어 있습니다.";
            addLog(`[오류] ${errorMsg}`);
            setApiError(errorMsg);
            setIsLoading(false);
            return;
        }

        if (!isBackground) setIsLoading(true);
        addLog(isBackground ? "보석 시세 자동 갱신 중..." : "보석 시세 조회 시작...");
        
        try {
            const newPrices: GemPrices = { crimson: {}, azure: {} };

            // We must fetch both Crimson and Azure for levels 5-10
            const types: { type: 'crimson' | 'azure'; name: string }[] = [
                { type: 'crimson', name: '겁화' },
                { type: 'azure', name: '작열' }
            ];

            for (const { type, name } of types) {
               for (const level of GEM_LEVELS) {
                   const itemName = `${level}레벨 ${name}의 보석`;
                   
                   // Rate Limiting per request to prevent HTTP 429
                   await new Promise(resolve => setTimeout(resolve, 100));

                   try {
                       const result = await LostArkService.getAuctionPrice(cleanKey, itemName, 4, GEM_CATEGORY_CODE, name);
                       if (result !== null) {
                           if (!isBackground) addLog(`[수신] ${itemName}: ${result.price}G`);
                           newPrices[type][level] = result.price;
                       } else {
                           if (!isBackground) addLog(`[실패] ${itemName}: 매물 없음`);
                       }
                   } catch (e: any) {
                       const errMsg = e instanceof Error ? e.message : String(e);
                       addLog(`[에러] ${itemName}: ${errMsg}`);
                       if (errMsg.includes('401') || errMsg.includes('403')) {
                           throw new Error("API Key 인증 실패 (401/403)");
                       }
                       if (errMsg.includes('429')) {
                           throw new Error("API 요청 한도 초과 (429)");
                       }
                   }
               }
            }

            setPrices(prev => {
                // Merge properly
                return {
                   crimson: { ...prev.crimson, ...newPrices.crimson },
                   azure: { ...prev.azure, ...newPrices.azure }
                };
            });
            setIsPriceLoaded(true);
            addLog(isBackground ? "보석 시세 갱신 완료" : "보석 시세 업데이트 완료");

        } catch (error: any) {
            const msg = error instanceof Error ? error.message : String(error) || "시세 조회 중 오류 발생";
            addLog(`전체 에러: ${msg}`);
            setApiError(msg);
        } finally {
            setIsLoading(false);
        }
    }, [addLog]);

    // Background ref logic
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    
    useEffect(() => {
        if (!apiKey) return;

        // Auto-fetch if key valid, but Auction API is slow, so we fetch once manually, then background every 2 mins
        fetchPrices(apiKey, false);

        const now = new Date();
        const msUntilNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
        
        const timeoutId = setTimeout(() => {
            fetchPrices(apiKey, true);
            intervalRef.current = setInterval(() => {
                fetchPrices(apiKey, true); 
            }, 120000); // 2 minutes
        }, msUntilNextMinute);

        return () => {
            clearTimeout(timeoutId);
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [apiKey, fetchPrices]);

    return {
        prices,
        isLoading,
        isPriceLoaded,
        apiError,
        logs,
        fetchPrices,
        addLog
    };
}
