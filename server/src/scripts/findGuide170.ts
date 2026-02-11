
import mongoose from 'mongoose';
import { PhaseGuide } from '../models/Phaseguide.js';
import { Gate } from '../models/Gate.js';
import { Difficulty } from '../models/Difficulty.js';
import { Boss } from '../models/Boss.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, '../../.env');
console.log('Loading .env from:', envPath);
dotenv.config({ path: envPath });
console.log('MONGO_URI:', process.env.MONGO_URI);

const find170 = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI as string);
    console.log('Models:', mongoose.modelNames());
    const guides = await PhaseGuide.find({ line: 170 });

    if (guides.length === 0) {
        console.log('No guide found with line 170');
    } else {
        for (const g of guides) {
             const gate = await Gate.findById(g.gateId);
             let gateInfo = 'Unknown Gate';
             if (gate) {
                 const diff = await Difficulty.findById(gate.difficultyId);
                 const boss = diff ? await Boss.findById(diff.bossId) : null;
                 gateInfo = `[${boss?.name} ${diff?.name} ${gate.gateNumber}관문]`;
             }
            console.log(`Found 170: ${gateInfo} Phase: "${g.phase}" Hint: "${g.hint}" (GateID: ${g.gateId})`);
        }
    }

  } catch (e) {
    console.error(e);
  } finally {
    await mongoose.disconnect();
  }
};

find170();
