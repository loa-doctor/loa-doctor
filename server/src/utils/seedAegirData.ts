
import 'dotenv/config'
import { connectMongo } from '../db/mongo.js'
import { Boss } from '../models/Boss.js'
import { Difficulty } from '../models/Difficulty.js'
import { Gate } from '../models/Gate.js'
import { PhaseGuide } from '../models/Phaseguide.js'
import mongoose from 'mongoose'

const seedAegir = async () => {
    await connectMongo()

    try {
        // 1. Boss 생성/찾기
        let boss = await Boss.findOne({ name: '에기르' })
        if (!boss) {
            boss = await Boss.create({ name: '에기르' })
            console.log('Boss 에기르 created')
        } else {
            console.log('Boss 에기르 already exists')
        }

        // 2. Difficulty 생성/찾기
        let difficulty = await Difficulty.findOne({ bossId: boss._id, name: '노말' })
        if (!difficulty) {
            difficulty = await Difficulty.create({ bossId: boss._id, name: '노말', order: 1 })
            console.log('Difficulty 노말 created')
        } else {
            console.log('Difficulty 노말 already exists')
        }

        // 3. Gate 1 생성/찾기
        let gate1 = await Gate.findOne({ difficultyId: difficulty._id, gateNumber: 1 })
        if (!gate1) {
            gate1 = await Gate.create({ difficultyId: difficulty._id, gateNumber: 1, name: '1관문', maxLines: 220 })
            console.log('Gate 1 created')
        } else {
            // Update existing gate with maxLines if not present or different
            gate1.maxLines = 220
            await gate1.save()
            console.log('Gate 1 updated with maxLines: 220')
        }

        // 4. Gate 1 PhaseGuides data
        const gate1Guides = [
            { line: 170, phase: "170줄", hint: "내부조 진입 및 쫄몹 무력화, 외부조 중앙 무력화 (라하르트 2타 활용)" },
            { line: 145, phase: "145줄", hint: "화염 장판 회피 후 돌 뒤로 숨기, 게이지에 맞춰 저스트 가드" },
            { line: 115, phase: "115줄", hint: "카운터 수행 및 실드 파괴" },
            { line: 60, phase: "60줄", hint: "왼쪽 끝 대기 후 팔 파괴, 저스트 가드 후 오른쪽 끝 일리아칸 무력화" },
            { line: 30, phase: "30줄", hint: "중앙 일리아칸 최종 무력화" }
        ]

        for (const guide of gate1Guides) {
            await PhaseGuide.findOneAndUpdate(
                { gateId: gate1._id, line: guide.line },
                { ...guide, gateId: gate1._id },
                { upsert: true, new: true }
            )
        }
        console.log('Gate 1 Guides inserted/updated')


        // 5. Gate 2 생성/찾기
        let gate2 = await Gate.findOne({ difficultyId: difficulty._id, gateNumber: 2 })
        if (!gate2) {
            gate2 = await Gate.create({ difficultyId: difficulty._id, gateNumber: 2, name: '2관문' })
            console.log('Gate 2 created')
        } else {
            console.log('Gate 2 already exists')
        }

        // 6. Gate 2 PhaseGuides data
        const gate2Guides = [
            { line: 260, phase: "260줄", hint: "파티별 파편 파괴 후 중앙 심장 파괴, 내려찍기 시 저스트 가드" },
            { line: 165, phase: "165줄", hint: "레이저 회피하며 심장 무력화 및 실드 파괴, 저스트 가드 후 에아달린 사용" },
            { line: 95, phase: "95줄", hint: "낙사 구간 진입 및 지형 파괴 시작, 히든 에아달린 및 저스트 가드 집중" }
        ]

        for (const guide of gate2Guides) {
            await PhaseGuide.findOneAndUpdate(
                { gateId: gate2._id, line: guide.line },
                { ...guide, gateId: gate2._id },
                { upsert: true, new: true }
            )
        }
        console.log('Gate 2 Guides inserted/updated')

        console.log('Seeding completed successfully')
    } catch (error) {
        console.error('Error seeding data:', error)
    } finally {
        await mongoose.disconnect()
        process.exit(0)
    }
}

seedAegir()
