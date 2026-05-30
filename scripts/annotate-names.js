// Generate context-aware name annotations (结合诗句含义) using Claude API
// Usage: ANTHROPIC_API_KEY=sk-xxx node scripts/annotate-names.js
import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import Anthropic from '@anthropic-ai/sdk'

const SCRIPTS_DIR = path.dirname(fileURLToPath(import.meta.url))
const DATA_FILE = path.join(SCRIPTS_DIR, '..', 'src', 'data', 'poetry-map.js')
const OUTPUT = path.join(SCRIPTS_DIR, 'name-annotations.json')
const BATCH_SIZE = 15

// Collect unique (name + poem text) combos
const { wuxingPoetryNames } = await import(pathToFileURL(DATA_FILE).href)
const combos = []
const seen = new Set()
for (const arr of Object.values(wuxingPoetryNames)) {
  for (const e of arr) {
    const key = e.chars
    if (!seen.has(key)) {
      seen.add(key)
      combos.push({ chars: e.chars, text: e.text, poem: e.poem, source: e.source })
    }
  }
}
console.log(`Unique name words: ${combos.length}`)

// Load existing
let annotated = {}
if (fs.existsSync(OUTPUT)) {
  annotated = JSON.parse(fs.readFileSync(OUTPUT, 'utf8'))
  console.log(`Already annotated: ${Object.keys(annotated).length}`)
}
const remaining = combos.filter(c => !annotated[c.chars])
console.log(`Remaining: ${remaining.length}`)
if (remaining.length === 0) { console.log('All done!'); process.exit(0) }

const client = new Anthropic()

async function annotateBatch(batch) {
  const items = batch.map((c, i) =>
    `${i + 1}. 词语「${c.chars}」出自诗句「${c.text.replace(/\n/g, ' ').substring(0, 80)}」(${c.source})`
  ).join('\n')

  const prompt = `你是古典文学鉴赏专家。为以下词语结合其诗句上下文，写注解（15字左右），说明词语在诗意中的意境与寓意。

格式：{"词语": "注解", ...}

${items}`

  try {
    const resp = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      thinking: { type: 'disabled' },
      messages: [{ role: 'user', content: prompt }]
    })
    let text = ''
    for (const block of resp.content) { if (block.type === 'text') text += block.text }
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('No JSON object: ' + text.substring(0, 200))
    return JSON.parse(match[0])
  } catch (e) {
    console.error(`  Error: ${e.message}`)
    return null
  }
}

async function main() {
  // Regenerate all to get context-aware annotations
  const batches = []
  for (let i = 0; i < remaining.length; i += BATCH_SIZE) {
    batches.push(remaining.slice(i, i + BATCH_SIZE))
  }
  console.log(`Total batches: ${batches.length}`)

  for (let bi = 0; bi < batches.length; bi++) {
    const batch = batches[bi]
    console.log(`\nBatch ${bi + 1}/${batches.length} (${batch.length} words)...`)

    let result = null
    for (let retry = 0; retry < 3; retry++) {
      result = await annotateBatch(batch)
      if (result && Object.keys(result).length > 0) break
      console.log(`  Retry ${retry + 1}...`)
      await new Promise(r => setTimeout(r, 2000))
    }

    if (result) {
      Object.assign(annotated, result)
      fs.writeFileSync(OUTPUT, JSON.stringify(annotated, null, 2))
      console.log(`  Progress: ${Object.keys(annotated).length}/${combos.length}`)
    } else {
      console.log('  Failed, saving...')
      fs.writeFileSync(OUTPUT, JSON.stringify(annotated, null, 2))
    }
    await new Promise(r => setTimeout(r, 500))
  }

  console.log(`\nDone! Total: ${Object.keys(annotated).length}`)
}

main()
