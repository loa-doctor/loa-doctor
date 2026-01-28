
import 'dotenv/config'
import { connectMongo } from '../db/mongo.js'
import { Boss } from '../models/Boss.js'
import { Difficulty } from '../models/Difficulty.js'
import { Gate } from '../models/Gate.js'
import { PhaseGuide } from '../models/Phaseguide.js'
import mongoose from 'mongoose'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, '../../.env');
dotenv.config({ path: envPath });

const seedAbrelshud = async () => {
    await connectMongo()

    try {
        // 1. Boss 생성/찾기
        let boss = await Boss.findOne({ name: '아브렐슈드' })
        if (!boss) {
            boss = await Boss.create({ name: '아브렐슈드' })
            console.log('Boss 아브렐슈드 created')
        } else {
            console.log('Boss 아브렐슈드 already exists')
        }

        // 2. Difficulty 생성/찾기
        let difficulty = await Difficulty.findOne({ bossId: boss._id, name: '노말' })
        if (!difficulty) {
            difficulty = await Difficulty.create({ bossId: boss._id, name: '노말', order: 1 })
            console.log('Difficulty 노말 created')
        } else {
            console.log('Difficulty 노말 already exists')
        }

        // 3. Gate 1 생성/찾기 (나로크)
        let gate1 = await Gate.findOne({ difficultyId: difficulty._id, gateNumber: 1 })
        if (!gate1) {
            gate1 = await Gate.create({ difficultyId: difficulty._id, gateNumber: 1, name: '1관문', maxLines: 300 })
            console.log('Gate 1 created')
        } else {
            gate1.maxLines = 300
            await gate1.save()
            console.log('Gate 1 updated with maxLines: 300')
        }

        // 4. Gate 1 PhaseGuides data
        const gate1Guides = [
            { line: 240, phase: "얼음 깨기 및 안전지대 찾기", hint: "중앙 안전 구역 생성 후 얼음이 떨어집니다. 얼음을 부수며 다음 안전 구역으로 이동하세요. 마지막 구역에서 공대원과 모여 불꽃마법 스크롤을 사용하면 좋습니다." },
            { line: 180, phase: "저스트 가드 및 실드 깎기", hint: "보스가 기를 모을 때 헤드 쪽에 모여 스크롤을 사용합니다. 저스트 가드 성공 후 생기는 실드를 1분 안에 깎아야 합니다." },
            { line: 120, phase: "2층 진입 및 무력화", hint: "1시 방향 길을 따라 2층으로 올라갑니다. 입구 얼음벽에서 스크롤을 사용해 길을 열고, 보스의 보호막이 생기면 저스트 가드와 무력화를 병행합니다." },
            { line: 60, phase: "저스트 가드 및 실드 깎기 (2차)", hint: "180줄 기믹의 반복입니다. 화력을 집중해 빠르게 밀어주세요." }
        ]

        for (const guide of gate1Guides) {
            await PhaseGuide.findOneAndUpdate(
                { gateId: gate1._id, line: guide.line },
                { ...guide, gateId: gate1._id },
                { upsert: true, new: true }
            )
        }
        console.log('Gate 1 Guides inserted/updated')


        // 5. Gate 2 생성/찾기 (아브렐슈드)
        let gate2 = await Gate.findOne({ difficultyId: difficulty._id, gateNumber: 2 })
        if (!gate2) {
            gate2 = await Gate.create({ difficultyId: difficulty._id, gateNumber: 2, name: '2관문', maxLines: 420 })
            console.log('Gate 2 created')
        } else {
             gate2.maxLines = 420
             await gate2.save()
            console.log('Gate 2 updated with maxLines: 420')
        }

        // 6. Gate 2 PhaseGuides data
        const gate2Guides = [
            { line: 420, phase: "저스트 가드", hint: "시작하자마자 낫 공격을 두 번 피하고, 세 번째 낫이 중앙에 올 때 저스트 가드를 수행합니다." },
            { line: 335, phase: "프로켈 분신 무력화", hint: "미니맵의 빨간 점(프로켈 분신 4마리)을 먼저 무력화한 뒤, 중앙의 아브렐슈드를 무력화합니다." },
            { line: 145, phase: "구슬 부수며 달리기 및 얼기", hint: "각자 정해진 위치(곱3, 곱3+1)에서 구슬 5개를 부수며 반원을 그리듯 달립니다. 이후 외곽에서 냉기 중첩으로 얼어야 하며, 서포터가 감금을 풀어준 뒤 중앙 무력을 진행합니다." },
            { line: 144, phase: "낙사 주의 (3페이즈)", hint: "이때부터 맵 외곽이 낙사 지형으로 변하므로 위치 선정에 주의해야 합니다." },
            { line: 0, phase: "최종 마무리", hint: "마지막까지 체력을 깎으며, 위아래로 나오는 저스트 가드 패턴에 대응하면 클리어입니다." }
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

seedAbrelshud()
