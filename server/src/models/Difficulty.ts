import { Schema, model, Types } from 'mongoose'

const DifficultySchema = new Schema(
  {
    bossId: {
      type: Types.ObjectId,
      ref: 'Boss',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true, // "노말", "하드", "헬"
    },
    order: {
      type: Number,
      default: 0, // UI 정렬용
    },
  },
  { timestamps: true }
)

DifficultySchema.index({ bossId: 1, name: 1 }, { unique: true })

export const Difficulty = model('Difficulty', DifficultySchema)