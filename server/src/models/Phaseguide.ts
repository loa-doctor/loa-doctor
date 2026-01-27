import { Schema, model, Types } from 'mongoose'

const PhaseGuideSchema = new Schema(
  {
    gateId: {
      type: Types.ObjectId,
      ref: 'Gate',
      required: true,
      index: true,
    },
    line: {
      type: Number,
      required: true, // 255, 210, 180 ...
    },
    phase: {
      type: String,
      required: true, // "1페이즈"
    },
    hint: {
      type: String,
      required: true, // 공략 설명
    },
    imageUrl: {
      type: String,
      required: false, // Optional image URL
    },
  },
  { timestamps: true }
)

PhaseGuideSchema.index({ gateId: 1, line: -1 })

export const PhaseGuide = model('PhaseGuide', PhaseGuideSchema)