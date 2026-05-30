const fs = require('fs')

// Fix BaziNameEngine.js scoring
let engine = fs.readFileSync('src/pages/baby-name/BaziNameEngine.js', 'utf8')

const oldStart = '      let xijiPts = 5'
const oldEnd = "poetry: { text: entry.text, source: entry.source, annotation: entry.annotation || '' },\n        sourceLabel:"

const i1 = engine.indexOf(oldStart)
const i2 = engine.indexOf(oldEnd)
if (i1 === -1 || i2 === -1) { console.log('MARKERS NOT FOUND'); process.exit(1) }

const newBlock = `      let xijiPts = 0;
      const surnameInfo = surnameData[s] || { strokes: 8, wuxing: '土', tone: 2 };
      const surnameGood = primary.includes(surnameInfo.wuxing) || secondary.includes(surnameInfo.wuxing);
      const allTriple = c1.wuxing === c2.wuxing && surnameInfo.wuxing === c1.wuxing && primary.includes(c1.wuxing);
      if (inWorst > 0 || bad.includes(surnameInfo.wuxing)) { xijiPts = 0; }
      else if (inBad > 0) { xijiPts = 5; }
      else if (inNeutral === 2 && !surnameGood) { xijiPts = 10; }
      else if (inPrimary >= 1 || inSecondary >= 1 || surnameGood) {
        if (inPrimary === 2 && surnameGood && allTriple) { xijiPts = 40; }
        else if (inPrimary === 2 && surnameGood) { xijiPts = 38; }
        else if (inPrimary === 2) { xijiPts = 35; }
        else if (inPrimary === 1 && inSecondary === 1 && surnameGood) { xijiPts = 32; }
        else if (inPrimary === 1 && inSecondary === 1) { xijiPts = 28; }
        else if (inSecondary === 2 && surnameGood) { xijiPts = 25; }
        else if (inSecondary === 2) { xijiPts = 22; }
        else if (inPrimary === 1 && inNeutral === 1) { xijiPts = 18; }
        else if (inSecondary === 1 && inNeutral === 1) { xijiPts = 15; }
        else if (surnameGood) { xijiPts = 15; }
      }

      const strokeAlt = c1.strokes % 2 !== c2.strokes % 2;
      const strokeDiff = Math.abs(c1.strokes - c2.strokes);
      let soundPts = 8;
      if (strokeAlt && strokeDiff >= 3 && strokeDiff <= 12) soundPts = 20;
      else if (strokeAlt) soundPts = 16;
      else if (strokeDiff >= 3 && strokeDiff <= 12) soundPts = 12;

      const avgScore = (c1.score + c2.score) / 2;
      let meaningPts = 8;
      if (avgScore >= 95) meaningPts = 20;
      else if (avgScore >= 88) meaningPts = 16;
      else if (avgScore >= 82) meaningPts = 12;

      const moodPts = Math.round((entry.mood || 5) * 2);
      const jitter = Math.floor(Math.random() * 5) - 2;
      const total = Math.min(100, Math.max(0, xijiPts + soundPts + meaningPts + moodPts + jitter));

      results.push({
        fullName: s + entry.char1 + entry.char2,
        char1: entry.char1, char2: entry.char2,
        wuxing: combo,
        score: total,
        scoreBreakdown: { xiji: xijiPts, sound: soundPts, meaning: meaningPts, mood: moodPts, jitter: jitter },
        poetry: { text: entry.text, source: entry.source, annotation: entry.annotation || '' },`

engine = engine.substring(0, i1) + newBlock + engine.substring(i2 + oldEnd.length)
fs.writeFileSync('src/pages/baby-name/BaziNameEngine.js', engine)
console.log('Engine updated: ' + engine.length + ' chars')

// Fix Vue score bar
let vue = fs.readFileSync('src/pages/baby-name/BabyName.vue', 'utf8')
const oldScore = '<div class="score-bar">\n            <span class="sb-item">喜忌: {{ name.scoreBreakdown.xiji }}</span>\n            <span class="sb-item">意境: {{ name.scoreBreakdown.mood || 12 }}</span>\n            <span class="sb-item">音韵: {{ name.scoreBreakdown.sound }}</span>\n            <span class="sb-item">寓意: {{ name.scoreBreakdown.meaning }}</span>\n            <span v-if="name.scoreBreakdown.surname" class="sb-item">姓名: {{ name.scoreBreakdown.surname }}</span>\n          </div>'
const newScore = '<div class="score-bar">\n            <span class="sb-item">喜忌: {{ name.scoreBreakdown.xiji }}</span>\n            <span class="sb-item">音韵: {{ name.scoreBreakdown.sound }}</span>\n            <span class="sb-item">寓意: {{ name.scoreBreakdown.meaning }}</span>\n            <span class="sb-item">意境: {{ name.scoreBreakdown.mood }}</span>\n          </div>'
vue = vue.replace(oldScore, newScore)
fs.writeFileSync('src/pages/baby-name/BabyName.vue', vue)
console.log('Vue updated')

// Fix test
let test = fs.readFileSync('src/pages/baby-name/BaziNameEngine.test.js', 'utf8')
test = test.replace("b.mood + (b.surname||0) + (b.jitter||0)", "b.mood + b.sound + b.meaning + b.jitter")
fs.writeFileSync('src/pages/baby-name/BaziNameEngine.test.js', test)
console.log('Test updated')

console.log('=== Done ===')
