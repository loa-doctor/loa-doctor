
import mongoose from 'mongoose';
import { PhaseGuide } from '../models/Phaseguide.js';
import { Boss } from '../models/Boss.js';
import { Difficulty } from '../models/Difficulty.js';
import { Gate } from '../models/Gate.js';
import dotenv from 'dotenv';
import path from 'path';

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, '../../.env');
console.log('Loading .env from:', envPath);
dotenv.config({ path: envPath });
console.log('MONGO_URI:', process.env.MONGO_URI);

const fetchGuides = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI as string);
    console.log('DB Connected');

    const boss = await Boss.findOne({ name: '에기르' });
    if (!boss) throw new Error('Boss not found');

    const difficulty = await Difficulty.findOne({ bossId: boss._id, name: '노말' });
    if (!difficulty) throw new Error('Difficulty not found');

    // Gate 1
    const gate1 = await Gate.findOne({ difficultyId: difficulty._id, gateNumber: 1 });
    console.log('\n--- Gate 1 Guides ---');
    if (gate1) {
        const guides1 = await PhaseGuide.find({ gateId: gate1._id }).sort({ line: -1 });
        guides1.forEach((g: any) => {
            console.log(`[${g.line}줄] ID: ${g._id}, Phase: ${g.phase}, Hint: ${g.hint}`);
        });
    }

    // Gate 2
    const gate2 = await Gate.findOne({ difficultyId: difficulty._id, gateNumber: 2 });
    console.log('\n--- Gate 2 Guides ---');
    if (gate2) {
        const guides2 = await PhaseGuide.find({ gateId: gate2._id }).sort({ line: -1 });
        guides2.forEach((g: any) => {
            console.log(`[${g.line}줄] ID: ${g._id}, Phase: ${g.phase}, Hint: ${g.hint}`);
        });
    }

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
};

fetchGuides();
