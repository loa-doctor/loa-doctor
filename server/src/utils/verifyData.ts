
import 'dotenv/config'
import { connectMongo } from '../db/mongo.js'
import { PhaseGuide } from '../models/Phaseguide.js'
import mongoose from 'mongoose'

const verify = async () => {
    await connectMongo()
    try {
        const guides = await PhaseGuide.find({ line: 170 })
        if (guides.length === 0) {
            console.log('No guide found for line 170')
        } else {
            console.log('Guide for line 170 found:')
            console.log(JSON.stringify(guides[0], null, 2))
        }
    } catch (e) {
        console.error(e)
    } finally {
        await mongoose.disconnect()
    }
}
verify()
