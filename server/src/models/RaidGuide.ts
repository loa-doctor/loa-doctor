import { Schema, model } from 'mongoose'

const RaidGuideSchema = new Schema({
  raid: { type: String, required: true },        // 카멘
  gate: { type: Number, required: true },        // 3
  line: { type: Number, required: true },        // 1000, 900, ...
  phase: { type: String, required: true },       // "1000줄"
  hint: { type: String, required: true },        // 설명
})

RaidGuideSchema.index({ raid: 1, gate: 1, line: -1 })

export const RaidGuide = model('RaidGuide', RaidGuideSchema)