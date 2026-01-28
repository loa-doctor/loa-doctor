
import 'dotenv/config'
import mongoose from 'mongoose'
import { Boss } from '../models/Boss.js'
import { PhaseGuide } from '../models/Phaseguide.js'
import { Gate } from '../models/Gate.js'
import { Difficulty } from '../models/Difficulty.js'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, '../../.env');
dotenv.config({ path: envPath });

const verifyAbrelshud = async () => {
    await mongoose.connect(process.env.MONGO_URI as string)
    try {
        const boss = await Boss.findOne({ name: '아브렐슈드' })
        if (!boss) {
            console.log('Boss 아브렐슈드 not found')
            return
        }
        console.log(`Boss found: ${boss.name}`)

        const difficulty = await Difficulty.findOne({ bossId: boss._id, name: '노말' })
        if (!difficulty) {
            console.log('Difficulty 노말 not found')
            return
        }

        const gates = await Gate.find({ difficultyId: difficulty._id }).sort({ gateNumber: 1 })
        for (const gate of gates) {
            console.log(`Gate ${gate.gateNumber} (${gate.name}) - MaxLines: ${gate.maxLines}`)
            const guides = await PhaseGuide.find({ gateId: gate._id }).sort({ line: -1 })
            for (const guide of guides) {
                console.log(`  - ${guide.line}줄: ${guide.phase} / ${guide.hint.substring(0, 50)}...`)
            }
        }

    } catch (e) {
        console.error(e)
    } finally {
        await mongoose.disconnect()
        process.exit(0)
    }
}

verifyAbrelshud()
