
import { connectDB } from '../db/mongo.js'
import { Boss } from '../models/Boss.js'
import { Difficulty } from '../models/Difficulty.js'
import { Gate } from '../models/Gate.js'
import { PhaseGuide } from '../models/Phaseguide.js'
import mongoose from 'mongoose'

const wipeAegirG2Guides = async () => {
  await connectDB()

  console.log('Searching for Aegir Gate 2...')
  
  const boss = await Boss.findOne({ name: '1막 : 대지를 부수는 업화의 궤적' })
  if (!boss) { console.log('Boss not found'); return }

  const diff = await Difficulty.findOne({ bossId: boss._id, name: '노말' })
  if (!diff) { console.log('Diff not found'); return }

  const gate = await Gate.findOne({ difficultyId: diff._id, gateNumber: 2 })
  if (!gate) { console.log('Gate not found'); return }

  console.log('Deleting guides for gate:', gate._id)
  const res = await PhaseGuide.deleteMany({ gateId: gate._id })
  console.log(`Deleted ${res.deletedCount} guides.`)

  await mongoose.disconnect()
}

wipeAegirG2Guides()
