import { Schema, model } from 'mongoose'

const GateSchema = new Schema({
  gateNumber: Number,     // 1,2,3,4
  name: String            // "1관문"
})

const RaidSchema = new Schema({
  name: { type: String, required: true }, // "카멘"
  gates: [GateSchema]
})

export const Raid = model('Raid', RaidSchema)