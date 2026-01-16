import { Schema, model, Types } from 'mongoose'

const BossSchema = new Schema(
  {
    name: { type: String, required: true, unique: true }, // "카멘"
  },
  { timestamps: true }
)

export const Boss = model('Boss', BossSchema)