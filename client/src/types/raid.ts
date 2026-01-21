export type Raid = {
  name: string
  difficulties: { name: string; gates: string[] }[]
}

export type PhaseGuide = { line: number; phase: string; hint: string }
export type AnalysisStatus = 'IDLE' | 'RUNNING' | 'GUIDE' | 'RETRY_RESET'
