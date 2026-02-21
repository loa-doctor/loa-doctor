import { Schema, model, Types } from 'mongoose'

const BossSchema = new Schema(
  {
    name: { type: String, required: true, unique: true }, // "카멘"
    shortName: { type: String, required: false }, // "1막"
    category: { type: String, required: false, default: '기타' }, // "카제로스 레이드"
  },
  { timestamps: true }
)

export const Boss = model('Boss', BossSchema)