import { Router } from 'express'
import { Raid } from '../models/Raid.js'

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

export default router
