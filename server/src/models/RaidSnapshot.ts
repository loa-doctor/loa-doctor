
import mongoose, { Schema } from 'mongoose'

const RaidSnapshotSchema = new Schema(
  {
    createdAt: { type: Date, default: Date.now },
    data: {
      bosses: { type: Array, required: true },
      difficulties: { type: Array, required: true },
      gates: { type: Array, required: true },
      guides: { type: Array, required: true },
    },
  },
  { timestamps: true }
)

export const RaidSnapshot = mongoose.models.RaidSnapshot || mongoose.model('RaidSnapshot', RaidSnapshotSchema)
