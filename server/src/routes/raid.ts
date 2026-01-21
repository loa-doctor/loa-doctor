import { Router } from 'express'
import { Boss } from '../models/Boss.js'
import { Difficulty } from '../models/Difficulty.js'
import { Gate } from '../models/Gate.js'
import { PhaseGuide } from '../models/Phaseguide.js'
import { generateGateGuides } from '../utils/generateKamenGate3Guides.js'
import { generateKamenGate1Guides } from '../utils/generateKamenGate1Guides.js'

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
        gates: gates.map(g => g.name),
      })
    }

    result.push({
      name: boss.name,
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
 * POST /api/raids/admin/reset
 * ⚠️ 개발용 전체 초기화
 * ============================ */
router.post('/admin/reset', async (_, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ message: 'Not allowed in production' })
  }

  await PhaseGuide.deleteMany({})
  await Gate.deleteMany({})
  await Difficulty.deleteMany({})
  await Boss.deleteMany({})

  /* ---- Boss ---- */
  const kamen = await Boss.create({ name: '카멘' })

  /* ---- Difficulty ---- */
  const normal = await Difficulty.create({
    bossId: kamen._id,
    name: '노말',
    order: 1,
  })

  const hard = await Difficulty.create({
    bossId: kamen._id,
    name: '하드',
    order: 2,
  })

  /* ---- Gate ---- */
  // 노말 관문
  for (let i = 1; i <= 3; i++) {
    await Gate.create({
      difficultyId: normal._id,
      gateNumber: i,
      name: `${i}관문`,
    })
  }

  // 하드 관문
  for (let i = 1; i <= 4; i++) {
    await Gate.create({
      difficultyId: hard._id,
      gateNumber: i,
      name: `${i}관문`,
    })
  }

  res.json({ ok: true, message: 'Raid 구조 초기화 완료' })
})

/* ============================
 * POST /api/raids/admin/add-guides
 * ⚠️ 개발용 가이드 삽입
 * ============================ */
router.post('/admin/add-guides', async (req, res) => {
  const {
    boss = '카멘',
    difficulties = ['노말', '하드'],
    gates = [1, 2, 3],
    reset = true,
    maxLine, // 추가됨
  } = req.body

  const bossDoc = await Boss.findOne({ name: boss })
  if (!bossDoc) {
    return res.status(404).json({ message: 'Boss 없음' })
  }

  let totalInserted = 0

  for (const difficultyName of difficulties) {
    const diffDoc = await Difficulty.findOne({
      bossId: bossDoc._id,
      name: difficultyName,
    })
    if (!diffDoc) continue

    for (const gateNumber of gates) {
      const gateDoc = await Gate.findOne({
        difficultyId: diffDoc._id,
        gateNumber,
      })
      if (!gateDoc) continue

      if (reset) {
        await PhaseGuide.deleteMany({ gateId: gateDoc._id })
      }

      let baseGuides
      if (gateNumber === 1 && boss === '카멘') {
        baseGuides = generateKamenGate1Guides(maxLine || 300)
      } else {
        baseGuides = generateGateGuides(maxLine)
      }

      const guides = baseGuides.map(g => ({
        gateId: gateDoc._id,
        ...g,
      }))

      const inserted = await PhaseGuide.insertMany(guides)
      totalInserted += inserted.length
    }
  }

  res.json({
    ok: true,
    inserted: totalInserted,
    message: '가이드 데이터 삽입 완료 (다중 난이도/관문)',
  })
})

export default router
