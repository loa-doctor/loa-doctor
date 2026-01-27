import { Schema, model, Types } from 'mongoose'

const GateSchema = new Schema(
  {
    difficultyId: {
      type: Types.ObjectId,
      ref: 'Difficulty',
      required: true,
      index: true,
    },
    gateNumber: {
      type: Number,
      required: true, // 1,2,3
    },
    name: {
      type: String,
      required: true, // "1관문"
    },
    maxLines: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
)

GateSchema.index(
  { difficultyId: 1, gateNumber: 1 },
  { unique: true }
)

export const Gate = model('Gate', GateSchema)