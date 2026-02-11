
import mongoose from 'mongoose';
import { PhaseGuide } from '../models/Phaseguide.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const updates = [
  // Gate 1
  { id: '69789e10e596ebbc3baaf0e1', title: '기둥 숨기 & 가드' },
  { id: '69789e10e596ebbc3baaf0e2', title: '카운터 & 무력화' },
  { id: '69789e10e596ebbc3baaf0e3', title: '부위 파괴' },
  { id: '69789e10e596ebbc3baaf0e4', title: '최종 무력화' },
  // Gate 2
  { id: '69789e10e596ebbc3baaf0e5', title: '심장 파괴' },
  { id: '69789e10e596ebbc3baaf0e6', title: '감금 & 레이저' },
  { id: '69789e10e596ebbc3baaf0e7', title: '지형 파괴 (2페이즈)' },
];

const runUpdate = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI as string);
    console.log('DB Connected');

    for (const update of updates) {
      const res = await PhaseGuide.findByIdAndUpdate(update.id, { phase: update.title }, { new: true });
      if (res) {
        console.log(`Updated [${res.line}줄]: ${res.phase}`);
      } else {
        console.log(`Failed to find ID: ${update.id}`);
      }
    }

  } catch (e) {
    console.error(e);
  } finally {
    await mongoose.disconnect();
  }
};

runUpdate();
