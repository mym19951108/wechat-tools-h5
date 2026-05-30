// Score poetry texts for artistic beauty (意境) using Claude API
// Usage: ANTHROPIC_API_KEY=sk-xxx node scripts/score-mood.js
import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import Anthropic from '@anthropic-ai/sdk'

const SCRIPTS_DIR = path.dirname(fileURLToPath(import.meta.url))
const DATA_FILE = path.join(SCRIPTS_DIR, '..', 'src', 'data', 'poetry-map.js')
const OUTPUT = path.join(SCRIPTS_DIR, 'mood-scores.json')
const BATCH_SIZE = 20

// Collect unique poetry texts
const { wuxingPoetryNames } = await import(pathToFileURL(DATA_FILE).href)
const textSet = new Set()
for (const arr of Object.values(wuxingPoetryNames)) {
  for (const e of arr) textSet.add(e.text)
}
const texts = [...textSet]
console.log(`Unique poetry texts to score: ${texts.length}`)

// Load existing scores to resume
let scored = {}
if (fs.existsSync(OUTPUT)) {
  scored = JSON.parse(fs.readFileSync(OUTPUT, 'utf8'))
  console.log(`Already scored: ${Object.keys(scored).length}`)
}

const remaining = texts.filter(t => !scored[t])
console.log(`Remaining: ${remaining.length}`)

if (remaining.length === 0) {
  console.log('All texts scored. Done!')
  process.exit(0)
}

const client = new Anthropic()

async function scoreBatch(batch) {
  const prompt = `你是一位中国古典文学鉴赏专家。请为以下诗句的意境评分。

对每句诗给出三个维度的 1-10 分：
- 意境（深度、画面感、情感层次）
- 美感（语言优美程度）
- 命名（这句诗中的名字是否适合作为人名）

请严格按此 JSON 格式返回，不要有其他文字：
[
  {"text": "诗句原文", "mood": 8, "beauty": 7, "naming": 6},
  ...
]

诗句列表：
${batch.map((t, i) => `${i + 1}. ${t}`).join('\n')}`

  try {
    const resp = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      thinking: { type: 'disabled' },
      messages: [{ role: 'user', content: prompt }]
    })
    // Extract text from response
    let text = ''
    for (const block of resp.content) {
      if (block.type === 'text') text += block.text
    }
    if (!text) throw new Error('Empty response from API')
    // Try to extract JSON array
    const match = text.match(/\[[\s\S]*\]/)
    if (!match) {
      console.error('  Raw response:', text.substring(0, 200))
      throw new Error('No JSON array in response')
    }
    return JSON.parse(match[0])
  } catch (e) {
    console.error(`  Batch error: ${e.message}`)
    if (e.status) console.error(`  HTTP status: ${e.status}`)
    return null
  }
}

async function main() {
  const batches = []
  for (let i = 0; i < remaining.length; i += BATCH_SIZE) {
    batches.push(remaining.slice(i, i + BATCH_SIZE))
  }
  console.log(`Total batches: ${batches.length}`)

  for (let bi = 0; bi < batches.length; bi++) {
    const batch = batches[bi]
    console.log(`\nBatch ${bi + 1}/${batches.length} (${batch.length} texts)...`)

    let result = null
    for (let retry = 0; retry < 3; retry++) {
      result = await scoreBatch(batch)
      if (result && result.length === batch.length) break
      console.log(`  Retry ${retry + 1}...`)
      await new Promise(r => setTimeout(r, 2000))
    }

    if (result) {
      for (const item of result) {
        if (item.text && item.mood) {
          scored[item.text] = {
            mood: item.mood,
            beauty: item.beauty,
            naming: item.naming,
            total: Math.round((item.mood + item.beauty + item.naming) / 3)
          }
        }
      }
      // Save after each batch
      fs.writeFileSync(OUTPUT, JSON.stringify(scored, null, 2))
      console.log(`  Progress: ${Object.keys(scored).length}/${texts.length}`)
    } else {
      console.log(`  Failed after retries, saving progress...`)
      fs.writeFileSync(OUTPUT, JSON.stringify(scored, null, 2))
    }

    // Rate limit
    await new Promise(r => setTimeout(r, 1000))
  }

  console.log(`\nDone! Total scored: ${Object.keys(scored).length}`)
}

main()
