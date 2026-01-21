export function generateKamenGate1Guides(maxLine: number = 100) {
  const guides: {
    line: number
    phase: string
    hint: string
  }[] = []

  // 가디언 테스트용: 100줄 시작, 10줄마다 더미 기믹
  for (let line = maxLine; line >= 10; line -= 10) {
    guides.push({
      line,
      phase: `${line}줄 가디언 패턴`,
      hint: `${line}줄에 도달했습니다. 테스트용 기믹 알림입니다.`,
    })
  }

  return guides
}
