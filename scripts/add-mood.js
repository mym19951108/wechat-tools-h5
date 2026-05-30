// Add heuristic mood scores to existing name files (safe JSON approach)
import fs from 'fs'

const scores = JSON.parse(fs.readFileSync('scripts/mood-heuristic.json', 'utf8'))
console.log(`Loaded ${Object.keys(scores).length} mood scores`)

for (const file of ['src/data/chengyu-names.js', 'src/data/diangu-names.js']) {
  let content = fs.readFileSync(file, 'utf8')
  // Find the JSON object
  const match = content.match(/export const \w+ = ([\s\S]*)/)
  if (!match) { console.log(`No export in ${file}`); continue }
  const data = JSON.parse(match[1])
  let updated = 0
  for (const key of Object.keys(data)) {
    for (const entry of data[key]) {
      const word = entry.chars
      entry.mood = scores[word] || 5
      updated++
    }
  }
  // Reconstruct the export
  const varName = file.includes('chengyu') ? 'chengyuNames' : 'dianguNames'
  const newContent = `// Generated with heuristic mood scores
export const ${varName} = ${JSON.stringify(data, null, 2)}
`
  fs.writeFileSync(file, newContent)
  console.log(`Updated ${file}: ${updated} entries with mood`)
}
console.log('Done')
