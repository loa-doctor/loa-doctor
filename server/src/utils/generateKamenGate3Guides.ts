export function generateKamenGate3Guides() {
  const guides: {
    raid: string
    gate: number
    line: number
    phase: string
    hint: string
  }[] = []

  // // 1000 ~ 800 (100 단위)
  // for (let line = 1000; line >= 800; line -= 100) {
  //   guides.push({
  //     raid: '카멘',
  //     gate: 3,
  //     line,
  //     phase: `${line}줄`,
  //     hint: `${line}줄 진입 – 주요 패턴 시작`,
  //   })
  // }

  // // 750 ~ 500 (50 단위)
  // for (let line = 750; line >= 500; line -= 50) {
  //   guides.push({
  //     raid: '카멘',
  //     gate: 3,
  //     line,
  //     phase: `${line}줄`,
  //     hint: `${line}줄 – 장판 및 위치 패턴 주의`,
  //   })
  // }

  // // 450 ~ 100 (50 단위)
  // for (let line = 450; line >= 100; line -= 50) {
  //   guides.push({
  //     raid: '카멘',
  //     gate: 3,
  //     line,
  //     phase: `${line}줄`,
  //     hint: `${line}줄 – 기믹 연속 구간`,
  //   })
  // }

  // 90 ~ 10 (10 단위)
  for (let line = 230; line >= 10; line -= 10) {
    guides.push({
      raid: '카멘',
      gate: 3,
      line,
      phase: `${line}줄`,
      hint:
        line <= 30
          ? '광폭 임박 – 극딜 준비'
          : `${line}줄 – 집중 유지`,
    })
  }

  return guides
}