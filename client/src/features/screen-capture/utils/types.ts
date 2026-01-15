export type Aspect = '16:9' | '21:9' | 'UNKNOWN'

export type Rect = {
  aspect: Aspect
  x: number
  y: number
  w: number
  h: number
}
