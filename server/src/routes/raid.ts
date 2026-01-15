import { Router } from 'express'
import { Raid } from '../models/Raid.js'
import { RaidGuide } from '../models/RaidGuide.js'
import { generateKamenGate3Guides} from '../utils/generateKamenGate3Guides.js'

const router = Router()

/**
 * GET /api/raids
 * 레이드 목록 조회
 */
router.get('/', async (_, res) => {
  const raids = await Raid.find().lean()
  res.json(raids)
})

/**
 * POST /api/raids/addRaid
 * ⚠️ 개발용
 * 기존 Raid 전부 삭제 후 초기 데이터 재삽입
 */
router.post('/addRaid', async (_, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ message: 'Not allowed in production' })
    }

    await Raid.deleteMany({})

    const raid = await Raid.create(
      {
        name: '카멘',
        gates: [
          { gateNumber: 1, name: '1관문' },
          { gateNumber: 2, name: '2관문' },
          { gateNumber: 3, name: '3관문' },
          { gateNumber: 4, name: '4관문' },
        ],
      },
      {
        name: '에키드나',
        gates: [
          { gateNumber: 1, name: '1관문' },
          { gateNumber: 2, name: '2관문' },
        ],
      }
    )

    res.json({
      message: '레이드 초기화 완료',
      raid,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'addRaid 실패' })
  }
})

router.post('/addRaidGuide', async (req, res) => {
  try {
    const { raid = '카멘', gate = 3, reset = true } = req.body

    if (reset) {
      await RaidGuide.deleteMany({ raid, gate })
    }

    const guides = generateKamenGate3Guides()

    const inserted = await RaidGuide.insertMany(guides)

    res.json({
      ok: true,
      count: inserted.length,
      message: '카멘 3관문 가이드 데이터 생성 완료',
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ ok: false, message: '가이드 생성 실패' })
  }
})

router.get('/guides', async (req, res) => {
  const { raid, gate } = req.query

  const guides = await RaidGuide.find({
    raid,
    gate: Number(gate),
  }).sort({ line: -1 }) // 중요: 내림차순

  res.json(guides)
})


export default router
