// Build name entries from chinese-xinhua word database (264K+ words)
import fs from 'fs'
import path from 'path'

const SCRIPTS_DIR = path.resolve('./scripts')
const OUTPUT_DIR = path.resolve('./src/data')

const msPath = path.join(SCRIPTS_DIR, 'mood-heuristic.json')
const moodScores = JSON.parse(fs.readFileSync(msPath, 'utf8'))

const ciPath = path.join(SCRIPTS_DIR, 'ci.json')
if (!fs.existsSync(ciPath)) {
  console.error('ci.json not found. Run: cp /tmp/chengyu/data/ci.json scripts/')
  process.exit(1)
}

const words = JSON.parse(fs.readFileSync(ciPath, 'utf8'))
console.log(`Loaded ${words.length} words`)

const MANUAL_WUXING = {
  '宇':'土','泽':'水','轩':'土','辰':'土','铭':'金','睿':'金','博':'水','昊':'火','哲':'火','毅':'木','霖':'水','熙':'水','煜':'火','航':'水','瑞':'金','璟':'火','谦':'木','朗':'火','楷':'木','泓':'水','涵':'水','萱':'木','琪':'木','瑶':'火','悦':'金','诗':'金','雅':'木','婉':'土','晴':'火','欣':'木','琳':'木','怡':'土','彤':'火','昕':'火','蔓':'木','岚':'土','璇':'火','雪':'水','妍':'水','颖':'木','安':'土','文':'水','晨':'火','宁':'火','远':'土','清':'水','明':'火','华':'水','志':'火','思':'金','德':'火','仁':'金','义':'木','礼':'火','信':'金','智':'火','勇':'土','嘉':'木','永':'土','乐':'火','平':'水','康':'木','健':'木','杰':'木','豪':'水','英':'木','伟':'土','浩':'水','然':'金','达':'火','通':'火','畅':'火','和':'水','祥':'金','善':'金','美':'水','良':'火','真':'金','诚':'金','实':'金','子':'水','君':'木','若':'木','如':'金','心':'金','意':'土','天':'火','地':'土','日':'火','月':'木','星':'火','云':'水','风':'水','雨':'水','露':'水','霜':'水','山':'土','石':'土','岳':'木','峰':'土','岩':'土','岭':'土','江':'水','河':'水','湖':'水','海':'水','溪':'水','泉':'水','林':'木','树':'木','松':'木','柏':'木','柳':'木','梅':'木','竹':'木','兰':'木','菊':'木','莲':'木','荷':'木','桂':'木','龙':'火','凤':'水','鹤':'水','鹏':'水','鸿':'水','燕':'火','玉':'金','金':'金','银':'金','锦':'金','钧':'金','钦':'金','钰':'金','铎':'金','锐':'金','锋':'金','镜':'金','钟':'金','春':'木','夏':'火','秋':'金','冬':'水','朝':'金','夕':'金','东':'木','南':'火','西':'金','北':'水','中':'土','正':'金','一':'水','元':'木','亨':'水','利':'火','贞':'火','吉':'木','世':'金','代':'火','承':'金','继':'木','启':'木','开':'木','宏':'水','大':'火','光':'火','辉':'火','耀':'火','焕':'火','国':'木','庆':'木','盛':'金','昌':'火','兴':'水','隆':'火','庆':'木','丰':'火','富':'水','贵':'木','福':'水','寿':'金','延':'土','长':'火','茂':'木','荣':'木','芳':'木','秀':'金','静':'金','娴':'土','淑':'金','慧':'水','敏':'水','巧':'木','妙':'水','韵':'土','幽':'土','淡':'水','素':'金','纯':'金','洁':'水','白':'水','丹':'火','青':'金','紫':'金','翠':'金','思':'金','念':'火','怀':'水','忆':'土','望':'水','盼':'水','雄':'水','威':'土','猛':'水','刚':'金','强':'木','壮':'金','奇':'木','特':'火','异':'土','卓':'火','超':'金','越':'土','万':'水','千':'金','百':'水','九':'木','三':'木','十':'金','少':'金','伯':'水','仲':'火','叔':'金','季':'木','道':'火','理':'火','法':'水','则':'金','度':'木','章':'火'
}
const WHITELIST = new Set(Object.keys(MANUAL_WUXING))
const BLOCKLIST = new Set('悲恨死伤残亡绝弃败衰落病痛苦怨恨仇辱耻废毁灭丧凶邪恶毒灾祸咎丑劣殁殂夭折薨逝殒鬼魅妖孽'.split(''))
const NAME_BLOCKLIST = new Set(['山西','山东','河南','河北','湖南','湖北','广东','广西','江西','江苏','浙江','四川','贵州','云南','福建','安徽','陕西','甘肃','宁夏','西藏','新疆','海南','台湾','北京','上海','天津','重庆','江南','岭南','中原','关东','关西','永安','长安','建安','永和','太和','开元','天宝','贞观','洪武','永乐','乾隆','康熙'].concat('一国万一三万三十三百九十一十三十千百一十一夕一日一朝一春一月一秋三十三千十万百千三奇四方五洲六合七泽八方九重十方出国入门下山出水入山开春入秋过冬初夏晚春'.split(' ')))
const NEG_RE = /[哀悲怨恨讥讽刺危亡乱祸丧葬殁薨逝离别苦愁盼凄惨忧忡郁孤病痛苦疾]|无夫|孕|私通|淫乱|妖异|鬼怪|邪祟|可怖|狰狞|阴间|恐怖|恶魔|遭谗|遭妒害|被谗|遭害|贤愚不分|贤愚相混|玉石相混|杀屠戮/
const POS_RE = /[美善良好德仁智勇义礼信诚慧雅清嘉明光辉耀瑞祥福寿安康乐平和顺达通畅盛昌兴隆丰富贵荣华英杰秀芳兰莲梅竹松柏龙凤鹏鸿鹤燕玉金银锦钧瑞玺珍珠琳瑶璇璟琳琪]/

function getWuxing(ch) { return MANUAL_WUXING[ch] || null }

const results = []
const seen = new Set()

for (const item of words) {
  const w = item.ci
  const explanation = item.explanation
  if (!w || w.length !== 2) continue
  if (NEG_RE.test(explanation)) continue
  if (!POS_RE.test(explanation)) continue
  if (/[地名官名殿名宫名朝代帝王年号县州省名寺庙祠书名河江湖山水名]/.test(explanation)) continue
  const c1 = w[0], c2 = w[1]
  if (!WHITELIST.has(c1) || !WHITELIST.has(c2)) continue
  if (BLOCKLIST.has(c1) || BLOCKLIST.has(c2)) continue
  if (c1 === c2) continue
  if (NAME_BLOCKLIST.has(w)) continue
  const w1 = getWuxing(c1), w2 = getWuxing(c2)
  if (!w1 || !w2) continue
  const key = w
  if (seen.has(key)) continue
  seen.add(key)
  results.push({
    chars: w, char1: c1, char2: c2,
    wuxing: w1 + w2,
    text: w,
    poem: '典故',
    source: '典故词语',
    coherent: true,
    annotation: explanation.replace(/^\d+\./, ''),
    mood: moodScores[w] || 5
  })
}
console.log(`Extracted ${results.length} name pairs from words`)

const groups = {}
for (const r of results) {
  if (!groups[r.wuxing]) groups[r.wuxing] = []
  groups[r.wuxing].push({
    chars: r.chars, char1: r.char1, char2: r.char2,
    text: r.text, poem: r.poem, source: r.source,
    coherent: r.coherent, annotation: r.annotation, mood: r.mood
  })
}

const content = `// Generated from chinese-xinhua word database (264K+ words)
export const dianguNames = ${JSON.stringify(groups, null, 2)}
`
fs.writeFileSync(path.join(OUTPUT_DIR, 'diangu-names.js'), content)
console.log(`Written: src/data/diangu-names.js (${(content.length / 1024).toFixed(1)} KB)`)
console.log('=== Done ===')
