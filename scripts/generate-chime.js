/**
 * Generates a pleasant two-tone notification chime as a WAV file.
 * Run: node scripts/generate-chime.js
 */
const fs = require("fs");
const path = require("path");

const SAMPLE_RATE = 44100;
const DURATION = 0.45; // seconds — short & snappy
const TOTAL_SAMPLES = Math.floor(SAMPLE_RATE * DURATION);

// Two ascending notes for a pleasant "ding-ding" chime
const NOTES = [
  { freq: 880, start: 0, end: 0.2 },    // A5
  { freq: 1318.5, start: 0.12, end: 0.45 }, // E6  (overlaps slightly)
];

function generateSamples() {
  const buf = Buffer.alloc(TOTAL_SAMPLES * 2); // 16-bit mono

  for (let i = 0; i < TOTAL_SAMPLES; i++) {
    const t = i / SAMPLE_RATE;
    let sample = 0;

    for (const note of NOTES) {
      if (t >= note.start && t < note.end) {
        const noteT = t - note.start;
        const noteDur = note.end - note.start;
        // Envelope: quick attack, smooth decay
        const attack = Math.min(noteT / 0.008, 1);
        const decay = Math.pow(1 - noteT / noteDur, 2);
        const envelope = attack * decay;
        sample += Math.sin(2 * Math.PI * note.freq * noteT) * envelope * 0.4;
      }
    }

    // Clamp to [-1, 1]
    sample = Math.max(-1, Math.min(1, sample));
    const int16 = Math.floor(sample * 32767);
    buf.writeInt16LE(int16, i * 2);
  }
  return buf;
}

function writeWav(filePath, sampleData) {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = SAMPLE_RATE * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = sampleData.length;
  const headerSize = 44;

  const header = Buffer.alloc(headerSize);
  header.write("RIFF", 0);
  header.writeUInt32LE(dataSize + headerSize - 8, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16); // PCM chunk size
  header.writeUInt16LE(1, 20);  // PCM format
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(SAMPLE_RATE, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36);
  header.writeUInt32LE(dataSize, 40);

  const outDir = path.dirname(filePath);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  fs.writeFileSync(filePath, Buffer.concat([header, sampleData]));
  console.log(`✓ Chime written to ${filePath} (${(dataSize + headerSize)} bytes)`);
}

const outPath = path.join(__dirname, "..", "assets", "sounds", "analysis-complete.wav");
const samples = generateSamples();
writeWav(outPath, samples);
