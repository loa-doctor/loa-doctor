import { Router } from 'express'
import { Boss } from '../models/Boss.js'
import { Difficulty } from '../models/Difficulty.js'
import { Gate } from '../models/Gate.js'
import { PhaseGuide } from '../models/Phaseguide.js'


const router = Router()

/* ============================
 * GET /api/raids
 * 보스 → 난이도 → 관문 구조 조회
 * ============================ */
router.get('/', async (_, res) => {
  const bosses = await Boss.find().lean()

  const result = []

  for (const boss of bosses) {
    const difficulties = await Difficulty.find({ bossId: boss._id }).sort({ order: 1 }).lean()

    const diffWithGates = []

    for (const diff of difficulties) {
      const gates = await Gate.find({ difficultyId: diff._id }).sort({ gateNumber: 1 }).lean()

      diffWithGates.push({
        name: diff.name,
        gates: gates.map(g => ({
          _id: g._id,
          name: g.name,
          maxLines: g.maxLines || 0,
        })),
      })
    }

    result.push({
      name: boss.name,
      category: boss.category || '기타', // Include Category
      difficulties: diffWithGates,
    })
  }

  res.json(result)
})

/* ============================
 * GET /api/raids/guides
 * PhaseGuide 조회 (프론트용)
 * ============================ */
router.get('/guides', async (req, res) => {
  const { boss, difficulty, gate } = req.query

  if (!boss || !difficulty || !gate) {
    return res.status(400).json({ message: '파라미터 부족' })
  }

  const bossDoc = await Boss.findOne({ name: boss })
  if (!bossDoc) return res.json([])

  const diffDoc = await Difficulty.findOne({
    bossId: bossDoc._id,
    name: difficulty,
  })
  if (!diffDoc) return res.json([])

  const gateDoc = await Gate.findOne({
    difficultyId: diffDoc._id,
    gateNumber: Number(gate),
  })
  if (!gateDoc) return res.json([])

  const guides = await PhaseGuide.find({
    gateId: gateDoc._id,
  }).sort({ line: -1 })

  res.json(guides)
})

/* ============================
 * POST /api/raids/admin/guide
 * 가이드 생성 (단일)
 * ============================ */
router.post('/admin/guide', async (req, res) => {
  const { boss, difficulty, gate, line, phase, hint } = req.body

  const bossDoc = await Boss.findOne({ name: boss })
  if (!bossDoc) return res.status(404).json({ message: 'Boss Not Found' })

  const diffDoc = await Difficulty.findOne({ bossId: bossDoc._id, name: difficulty })
  if (!diffDoc) return res.status(404).json({ message: 'Difficulty Not Found' })

  const gateDoc = await Gate.findOne({ difficultyId: diffDoc._id, gateNumber: Number(gate) })
  if (!gateDoc) return res.status(404).json({ message: 'Gate Not Found' })

  const newGuide = await PhaseGuide.create({
    gateId: gateDoc._id,
    line: Number(line),
    phase,
    hint,
  })

  res.json(newGuide)
})

/* ============================
 * PUT /api/raids/admin/guide/:id
 * 가이드 수정
 * ============================ */
router.put('/admin/guide/:id', async (req, res) => {
  const { id } = req.params
  const { line, phase, hint } = req.body

  const updated = await PhaseGuide.findByIdAndUpdate(
    id,
    { line: Number(line), phase, hint },
    { new: true }
  )

  if (!updated) return res.status(404).json({ message: 'Guide Not Found' })
  res.json(updated)
})

/* ============================
 * DELETE /api/raids/admin/guide/:id
 * 가이드 삭제
 * ============================ */
router.delete('/admin/guide/:id', async (req, res) => {
  const { id } = req.params
  await PhaseGuide.findByIdAndDelete(id)
  res.json({ ok: true })
})

/* ============================
 * PUT /api/raids/admin/gate/:id
 * 관문 maxLines 수정
 * ============================ */
router.put('/admin/gate/:id', async (req, res) => {
  const { id } = req.params
  const { maxLines } = req.body

  const updated = await Gate.findByIdAndUpdate(
    id,
    { maxLines: Number(maxLines) },
    { new: true }
  )

  if (!updated) return res.status(404).json({ message: 'Gate Not Found' })
  res.json(updated)
})

/* ============================
 * POST /api/raids/admin/clear-guides
 * 모든 공략 및 줄수 데이터 초기화 (구조는 유지)
 * ============================ */
router.post('/admin/clear-guides', async (_, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ message: 'Not allowed in production' })
  }

  try {
      // 1. Delete all PhaseGuides
      await PhaseGuide.deleteMany({})
      
      // 2. Reset maxLines for all Gates
      await Gate.updateMany({}, { maxLines: 0 })

      res.json({ ok: true, message: '모든 공략 및 줄수 데이터가 초기화되었습니다.' })
  } catch (e) {
      console.error(e)
      res.status(500).json({ message: '초기화 실패' })
  }
})

/* ============================
 * POST /api/raids/admin/reset 
 * ... existing reset logic ...
 */
/* ============================
 * POST /api/raids/admin/reset 
 * ============================ */
import { RaidSnapshot } from '../models/RaidSnapshot.js'

/* ============================
 * POST /api/raids/admin/snapshot
 * 현재 상태를 스냅샷으로 저장 (덮어쓰기)
 * ============================ */
router.post('/admin/snapshot', async (_, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ message: 'Not allowed in production' })
  }

  try {
    const bosses = await Boss.find().lean()
    const difficulties = await Difficulty.find().lean()
    const gates = await Gate.find().lean()
    const guides = await PhaseGuide.find().lean()

    // Delete existing snapshots (Only keep 1 for now)
    await RaidSnapshot.deleteMany({})

    await RaidSnapshot.create({
      data: {
        bosses,
        difficulties,
        gates,
        guides
      }
    })

    res.json({ ok: true, message: '현재 상태가 기초값(Snapshot)으로 저장되었습니다.' })
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: '스냅샷 저장 실패' })
  }
})

/* ============================
 * POST /api/raids/admin/reset 
 * ============================ */
/* ============================
 * POST /api/raids/admin/factory-reset
 * 공장 초기화: 스냅샷 삭제 + 초기 데이터 로드
 * ============================ */
router.post('/admin/factory-reset', async (_, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ message: 'Not allowed in production' })
  }

  try {
    // 1. Delete all Snapshots
    await RaidSnapshot.deleteMany({})

    // 2. Clear All Data
    await PhaseGuide.deleteMany({})
    await Gate.deleteMany({})
    await Difficulty.deleteMany({})
    await Boss.deleteMany({})

    // 3. Re-seed Defaults (Same logic as reset fallback)
    await seedDefaults()

    res.json({ ok: true, message: '공장 초기화 완료 (스냅샷 삭제됨)' })
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: '공장 초기화 실패' })
  }
})

/* ============================
 * POST /api/raids/admin/reset 
 * ============================ */
router.post('/admin/reset', async (_, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ message: 'Not allowed in production' })
  }

  // 1. Check for Snapshot
  const snapshot = await RaidSnapshot.findOne().sort({ createdAt: -1 }).lean()

  if (snapshot) {
     console.log('Restoring from Snapshot...')
     await PhaseGuide.deleteMany({})
     await Gate.deleteMany({})
     await Difficulty.deleteMany({})
     await Boss.deleteMany({})

     await Boss.insertMany(snapshot.data.bosses)
     await Difficulty.insertMany(snapshot.data.difficulties)
     await Gate.insertMany(snapshot.data.gates)
     await PhaseGuide.insertMany(snapshot.data.guides)

     return res.json({ ok: true, message: '스냅샷에서 데이터가 복구되었습니다.' })
  }

  console.log('No Snapshot found. Performing Factory Reset...')
  
  await PhaseGuide.deleteMany({})
  await Gate.deleteMany({})
  await Difficulty.deleteMany({})
  await Boss.deleteMany({})

  await seedDefaults()

  res.json({ ok: true, message: 'Factory Reset 완료 (스냅샷 없음)' })
})

// Core Default Seeding Logic
const seedDefaults = async () => {
  /* =========================================
   * 1. 1막 : 대지를 부수는 업화의 궤적 (에기르)
   * ========================================= */
  const aegirName = '1막 : 대지를 부수는 업화의 궤적'
  const aegir = await Boss.create({ 
      name: aegirName,
      category: '카제로스 레이드'
  })
  const aegirNormal = await Difficulty.create({ bossId: aegir._id, name: '노말', order: 1 })
  const aegirHard = await Difficulty.create({ bossId: aegir._id, name: '하드', order: 2 })

  // Aegir Gate 1 (Normal)
  const aegirG1 = await Gate.create({ difficultyId: aegirNormal._id, gateNumber: 1, name: '1관문', maxLines: 220 })
  
  const aegirG1Default = [
     { 
        line: 170, 
        phase: "내부 무력", 
        hint: "일리아칸이 휘두르는 낫에 맞으면 내부로 진입한다. 내부 인원은 만세 포즈를 취하는 쫄몹을 찾아 무력화하고, 외부 인원은 쫄몹을 잡으며 생존한다. 기믹 성공 후 중앙 일리아칸 무력화 시 라하르트 2타를 사용한다." 
     },
     { 
        line: 145, 
        phase: "화염 장판", 
        hint: "노란 장판을 피한 뒤 생성된 돌멩이 뒤에 숨는다. 발탄 게이지가 가득 찰 때 가드를 수행한다." 
     },
     { 
        line: 115, 
        phase: "카운터 & 실드", 
        hint: "일자 장판 이후 일리아칸의 카운터를 친다." 
     },
     { 
        line: 60, 
        phase: "팔 파괴 & 무력", 
        hint: "왼쪽 끝에서 에기르의 팔을 파괴한 뒤 가드한다. 이후 오른쪽 끝에 있는 일리아칸을 무력화하며 라하르트 2타를 사용한다." 
     },
     { 
        line: 30, 
        phase: "최종 무력", 
        hint: "중앙 일리아칸을 무력화한다. 이때도 라하르트 2타를 활용한다." 
     }
  ]
  for (const g of aegirG1Default) { await PhaseGuide.create({ ...g, gateId: aegirG1._id }) }

  // Aegir Gate 2 (Normal)
  const aegirG2 = await Gate.create({ difficultyId: aegirNormal._id, gateNumber: 2, name: '2관문', maxLines: 300 })
  
  const aegirG2Default = [
     {
        line: 300,
        phase: "파티 위치 & 딜",
        hint: "1파티는 왼쪽과 위, 2파티는 오른쪽과 아래로 자리를 잡는다. 아델 타이밍마다 아드레날린과 함께 딜을 집중한다."
     },
     { 
        line: 260, 
        phase: "심장 파괴 1차", 
        hint: "4개의 심장 파편을 파티별 정해진 위치에서 파괴한 뒤 중앙 심장을 공격한다. 보스가 회전 후 내려찍을 때 저스트 가드를 수행한다." 
     },
     { 
        line: 255, 
        phase: "직사각형/왜곡 맵", 
        hint: "맵 끝에서 보스의 발을 피하며 칼 기믹(무력, 카운터, 데미지)을 15회 성공시킨다. 왜곡 맵에서 한쪽 벽이 생성되면 아델 2타와 함께 딜을 몰아준다. 협동 카운터 성공 후 어그로 대상자는 보스 방향을 고정한다." 
     },
     { 
        line: 165, 
        phase: "심장 파괴 2차", 
        hint: "레이저를 피하며 심장을 무력화하고 실드를 파괴한다. 심장 결속 버프가 0초가 될 때마다 시전되는 저스트 가드를 2회 성공시킨 뒤 에아달린 2타를 사용한다. 이때 153줄까지 밀어내면 다음 직사각형 맵을 스킵할 수 있다." 
     },
     { 
        line: 95, 
        phase: "낙사 구간", 
        hint: "컷신 후 맵 이동 시 에아달린을 사용해 히든 에아달린을 발동시킨다. 이때부터 맵 외곽이 무너지므로 낙사에 극도로 주의한다. 왕발 패턴 시 초각성기 사용을 권장한다." 
     }
  ]
  for (const g of aegirG2Default) { await PhaseGuide.create({ ...g, gateId: aegirG2._id }) } 


  /* =========================================
   * 2. 2막 : 부유하는 악몽의 진혼곡 (아브렐슈드)
   * ========================================= */
  const abrelName = '2막 : 부유하는 악몽의 진혼곡'
  const abrel = await Boss.create({ 
      name: abrelName,
      category: '카제로스 레이드'
  })
  const abrelNormal = await Difficulty.create({ bossId: abrel._id, name: '노말', order: 1 })
  const abrelHard = await Difficulty.create({ bossId: abrel._id, name: '하드', order: 2 })

  // Abrel Gate 1 (Normal)
  const abrelG1 = await Gate.create({ difficultyId: abrelNormal._id, gateNumber: 1, name: '1관문', maxLines: 300 })
  
  const abrelG1Default = [
     { line: 240, phase: "얼음 깨기 및 안전지대", hint: "중앙 안전 구역 생성 후 얼음이 떨어집니다. 얼음을 부수며 다음 안전 구역으로 이동하세요." },
     { line: 180, phase: "저스트 가드 & 실드", hint: "기 모을 때 헤드 쪽에 모여 스크롤 사용. 저스트 가드 성공 후 실드 파괴." },
     { line: 120, phase: "2층 진입 & 무력화", hint: "1시 방향 길 따라 2층 이동. 얼음벽 스크롤로 파괴. 저스트 가드와 무력화 병행." },
     { line: 60, phase: "저스트 가드 & 실드 (2차)", hint: "180줄 기믹 반복. 화력 집중." }
  ]
  for (const g of abrelG1Default) { await PhaseGuide.create({ ...g, gateId: abrelG1._id }) }

  // Abrel Gate 2 (Normal)
  const abrelG2 = await Gate.create({ difficultyId: abrelNormal._id, gateNumber: 2, name: '2관문', maxLines: 420 })
  
  const abrelG2Default = [
     { line: 420, phase: "저스트 가드 (초반)", hint: "3번째 낫 중앙에 올 때 저스트 가드." },
     { line: 335, phase: "프로켈 분신", hint: "미니맵 빨간 점(분신 4마리) 무력화 -> 중앙 아브렐슈드 무력화." },
     { line: 145, phase: "구슬 부수기 & 얼기", hint: "곱3/곱3+1 위치 구슬 파괴하며 달리기. 이후 외곽에서 냉기 중첩으로 얼기." },
     { line: 144, phase: "낙사 주의", hint: "맵 외곽 떨어짐 주의." },
     { line: 0, phase: "최종장", hint: "위아래 저스트 가드 패턴 대응하며 마무리." }
  ]
  for (const g of abrelG2Default) { await PhaseGuide.create({ ...g, gateId: abrelG2._id }) }
}

export default router
