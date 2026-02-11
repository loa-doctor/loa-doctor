
import mongoose from 'mongoose';
import { Boss } from '../models/Boss.js';
import { Difficulty } from '../models/Difficulty.js';
import { Gate } from '../models/Gate.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const runUpdate = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI as string);
    console.log('DB Connected');

    const boss = await Boss.findOne({ name: '에기르' });
    if (!boss) throw new Error('Boss not found');

    const diff = await Difficulty.findOne({ bossId: boss._id, name: '노말' });
    if (!diff) throw new Error('Difficulty not found');

    const gate1 = await Gate.findOneAndUpdate(
        { difficultyId: diff._id, gateNumber: 1 },
        { maxLines: 220 },
        { new: true }
    );
    console.log(`Updated Gate 1 maxLines to: ${gate1?.maxLines}`);

    const gate2 = await Gate.findOneAndUpdate(
        { difficultyId: diff._id, gateNumber: 2 },
        { maxLines: 300 },
        { new: true }
    );
    console.log(`Updated Gate 2 maxLines to: ${gate2?.maxLines}`);

  } catch (e) {
    console.error(e);
  } finally {
    await mongoose.disconnect();
  }
};

runUpdate();
