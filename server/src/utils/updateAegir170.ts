
import mongoose from 'mongoose';
import { PhaseGuide } from '../models/Phaseguide.js';
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

    // Find the specific guide with line 170 and Gate 1 Aegir implied (or just update all 170s for now safely, or verify ID from previous step)
    // ID from previous step: 69789e0fec457d8f18a732f9 is GateID. Guide ID was not printed, but I can findOne by line and gate.
    
    // Actually, PhaseGuide.find({ line: 170 }) returned one result.
    // I can query by line: 170 and update.
    
    const guide = await PhaseGuide.findOneAndUpdate(
        { line: 170, phase: '170줄' }, // Filter to ensure we only target the generic named one
        { phase: '내부 진입 & 무력화' },
        { new: true }
    );

    if (guide) {
        console.log(`Updated 170: ${guide.phase}`);
    } else {
        console.log('Guide 170 not found or already updated');
    }

  } catch (e) {
    console.error(e);
  } finally {
    await mongoose.disconnect();
  }
};

runUpdate();
