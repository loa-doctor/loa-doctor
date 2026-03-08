export type GemType = 'crimson' | 'azure' | 'any';

export interface GemInfo {
  level: number;
  type: GemType;
  name: string;
}

// 4티어 보석 아이템 정보 (카테고리: 210000)
// 옵션 이름(겁화/작열) 검색 필터링을 위해 정의
export const GEM_CATEGORY_CODE = 210000;
export const GEM_TIER = 4;

export const GEM_LEVELS = [5, 6, 7, 8, 9, 10] as const;
export type GemLevel = typeof GEM_LEVELS[number];

export const GEMS: Record<Exclude<GemType, 'any'>, Record<GemLevel, GemInfo>> = {
  crimson: {
    5: { level: 5, type: 'crimson', name: '5레벨 겁화의 보석' },
    6: { level: 6, type: 'crimson', name: '6레벨 겁화의 보석' },
    7: { level: 7, type: 'crimson', name: '7레벨 겁화의 보석' },
    8: { level: 8, type: 'crimson', name: '8레벨 겁화의 보석' },
    9: { level: 9, type: 'crimson', name: '9레벨 겁화의 보석' },
    10: { level: 10, type: 'crimson', name: '10레벨 겁화의 보석' },
  },
  azure: {
    5: { level: 5, type: 'azure', name: '5레벨 작열의 보석' },
    6: { level: 6, type: 'azure', name: '6레벨 작열의 보석' },
    7: { level: 7, type: 'azure', name: '7레벨 작열의 보석' },
    8: { level: 8, type: 'azure', name: '8레벨 작열의 보석' },
    9: { level: 9, type: 'azure', name: '9레벨 작열의 보석' },
    10: { level: 10, type: 'azure', name: '10레벨 작열의 보석' },
  }
};
