
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
        // Reset Gate 1 Guides
        await PhaseGuide.deleteMany({ gateId: gate1._id })
        console.log('Cleared existing Gate 1 guides')

        const gate1Guides = [
            { 
                line: 198, 
                phase: "돌 그림자 피하기", 
                hint: "돌 그림자 위치 피하기\n일리아칸 부채꼴 피하기(맞으면 망자의 세계 추방)" 
            },
            { 
                line: 170, 
                phase: "내부 무력 (외부 쫄)", 
                hint: "헤드 고정 후 내부 팟 머리대기\n내부진입 후 쫄 무력화 게이지 찾아서 무력화\n일리아칸 무력화 후 연합군 스킬(라하 2타)\n*딜 빠르면 에스더 아끼기",
                imageUrl: "/guide-images/aegir/normal/g1/aegir_normal_1_170.jpg"
            },
            { 
                line: 143, 
                phase: "에기르 화염장판 피하기", 
                hint: "빨간장판, 노란장판 피하고 노란장판 기둥 뒤 숨기\n*기둥 뒤 딱 붙을 것. 떨어지면 피격\n노란 장판 가득 차면 저스트가드(G)",
                imageUrl: "/guide-images/aegir/normal/g1/aegir_normal_1_143.jpg"
            },
            { 
                line: 115, 
                phase: "발탄 카운터 + 실드까기", 
                hint: "일리아칸 부채꼴 고정 후 빠지기\n발탄 잡기조심 / 발탄 도착 지점에서 카운터\n찰 때마다 연합군 스킬(라하 2타)",
                imageUrl: "/guide-images/aegir/normal/g1/aegir_normal_1_115.jpg"
            },
            { 
                line: 87, 
                phase: "능지 패턴", 
                hint: "원형피자 2칸에서 1칸으로 이동\n삼각피자 안전구역으로 이동\n피격 시 받피 20%\n팔에 떨어져서 물 닿기 전 저스트가드(G)",
                imageUrl: "/guide-images/aegir/normal/g1/aegir_normal_1_87.jpg"
            },
            { 
                line: 60, 
                phase: "에기르 팔 파괴 -> 일리아칸 무력", 
                hint: "9시 끝으로 이동 후 가로 줄 피하며 에기르 팔 파괴\n안전지대는 5줄 중 2줄 안전\n팔 파괴 후 타이밍 맞춰 저스트가드(G)\n일리아칸 무력화 때 연합군 스킬(라하 1타 추천)",
                imageUrl: "/guide-images/aegir/normal/g1/aegir_normal_1_60.jpg"
            },
            { 
                line: 30, 
                phase: "무력 + 능지", 
                hint: "원형피자, 삼각피자 피하면서 무력화\n일리아칸 무력화 때 연합군 스킬(라하 추천)" 
            }
        ]

        for (const guide of gate1Guides) {
            await PhaseGuide.create({ ...guide, gateId: gate1._id })
        }
        console.log('Gate 1 Guides inserted')


        // 5. Gate 2 생성/찾기
        let gate2 = await Gate.findOne({ difficultyId: difficulty._id, gateNumber: 2 })
        if (gate2) {
             // Reset Gate 2 Guides
            await PhaseGuide.deleteMany({ gateId: gate2._id })
            console.log('Cleared existing Gate 2 guides')
        }
        
        // Gate 2 guides intentionally left empty as per request


        console.log('Seeding completed successfully')
    } catch (error) {
        console.error('Error seeding data:', error)
    } finally {
        await mongoose.disconnect()
        process.exit(0)
    }
}

seedAegir()
