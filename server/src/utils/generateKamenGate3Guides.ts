export function generateGateGuides() {
  const guides: {
    line: number
    phase: string
    hint: string
  }[] = []

  for (let line = 100; line >= 10; line -= 10) {
    guides.push({
      line,
      phase: `${line}줄 기믹제목`,
      hint: line <= 30 ? '광폭 임박 – 극딜 준비' : `${line}줄 – 집중 유지`,
    })
  }

  return guides
}
