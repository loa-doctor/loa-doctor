export type Raid = {
  name: string
  difficulties: { name: string; gates: { name: string; maxLines: number }[] }[]
}

export type PhaseGuide = { line: number; phase: string; hint: string; imageUrl?: string }
export type AnalysisStatus = 'IDLE' | 'RUNNING' | 'GUIDE' | 'RETRY_RESET'
