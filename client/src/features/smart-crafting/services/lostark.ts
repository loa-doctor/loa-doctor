
export interface MarketItemStats {
  Date: string;
  AvgPrice: number;
  TradeCount: number;
}

export interface MarketItem {
  Name: string;
  BundleCount: number;
  Stats: MarketItemStats[];
}

export interface PriceResult {
  price: number;
  bundleCount: number;
}

export class LostArkService {
  private static BASE_URL = 'https://developer-lostark.game.onstove.com';

  static async getMarketPrice(apiKey: string, itemId: number, itemName: string, categoryCode: number): Promise<{ price: number, bundleCount: number } | null> {
    try {
      console.log(`[API] Searching for ${itemName} (Category: ${categoryCode})...`);
      const response = await fetch(`${this.BASE_URL}/markets/items`, {
        method: 'POST',
        headers: {
          'Authorization': `bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          Sort: "CURRENT_MIN_PRICE",
          CategoryCode: categoryCode,
          ItemName: itemName,
          PageNo: 1,
          SortCondition: "ASC"
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      console.log(`[API] Response for ${itemName}:`, data); // Debug log

      // Search API returns { Items: [...] }
      const items = data.Items || [];
      
      // Find matching item
      const item = items.find((i: any) => i.Id === itemId) || items[0];
      
      if (item) {
        console.log(`[API] Found item:`, item);
        return {
           price: item.CurrentMinPrice || item.RecentPrice || 0,
           bundleCount: item.BundleCount || 1
        };
      }
       return null;
    } catch (error) {
      // console.error("Failed to fetch market price:", error);
      throw error;
    }
  }

  static async getAuctionPrice(apiKey: string, itemName: string, itemTier: number, categoryCode: number, optionName?: string): Promise<{ price: number } | null> {
    try {
      console.log(`[API] Searching Auction for ${itemName} (Tier: ${itemTier}, Category: ${categoryCode})...`);
      
      const searchOptions: any = {
        Sort: "BUY_PRICE",
        CategoryCode: categoryCode,
        ItemTier: itemTier,
        ItemName: itemName,
        PageNo: 1,
        SortCondition: "ASC"
      };

      if (optionName) {
         searchOptions.SkillOptions = [
            {
               FirstOption: null,
               SecondOption: null,
               MinValue: null,
               MaxValue: null
            }
         ];
      }

      const response = await fetch(`${this.BASE_URL}/auctions/items`, {
        method: 'POST',
        headers: {
          'Authorization': `bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchOptions)
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      console.log(`[API] Auction Response for ${itemName}:`, data);

      const items = data.Items || [];
      
      // We want the absolute cheapest buyout price across all items returned.
      // Usually, since we sort by BUY_PRICE ASC, the first item with an AuctionInfo.BuyPrice is the one.
      const validItems = items.filter((i: any) => i.AuctionInfo && i.AuctionInfo.BuyPrice && i.AuctionInfo.BuyPrice > 0);
      
      let bestItem = validItems[0];

      // If optionName is provided, we might want to filter by item name to be safe since gems might be weird.
      if (optionName && validItems.length > 0) {
         bestItem = validItems.find((i: any) => i.Name.includes(optionName)) || validItems[0];
      }

      if (bestItem) {
        return {
           price: bestItem.AuctionInfo.BuyPrice,
        };
      }
      
      return null;
    } catch (error) {
      console.error("Failed to fetch auction price:", error);
      throw error;
    }
  }

  static async searchItems(apiKey: string, itemName: string): Promise<any> {
    try {
        const response = await fetch(`${this.BASE_URL}/markets/items`, {
            method: 'POST',
            headers: {
                'Authorization': `bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                Sort: "GRADE",
                CategoryCode: 50000,
                ItemName: itemName,
                PageNo: 1,
                SortCondition: "ASC"
            })
        });
        
        if (!response.ok) {
             const responseTy2 = await fetch(`${this.BASE_URL}/markets/items`, {
                method: 'POST',
                headers: {
                    'Authorization': `bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    Sort: "GRADE",
                    ItemName: itemName,
                    PageNo: 1,
                    SortCondition: "ASC"
                })
            });
            if(!responseTy2.ok) throw new Error(`Search Error: ${responseTy2.status}`);
            return await responseTy2.json();
        }

        return await response.json();
    } catch (error) {
        console.error("Search failed:", error);
        throw error;
    }
  }
}
