export type Raid = {
  name: string
  shortName?: string
  category?: string
  difficulties: { name: string; gates: { name: string; maxLines: number; gateNumber: number }[] }[]
}

export type PhaseGuide = { line: number; phase: string; hint: string }
export type AnalysisStatus = 'IDLE' | 'RUNNING' | 'GUIDE' | 'RETRY_RESET'
