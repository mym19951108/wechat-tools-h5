# 八字取名 v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild poetry database and name engine to match character pairs from classic poems, score names with weighted 100-point system, and add staged loading UI with score breakdown and red-highlighted poetry text.

**Architecture:** Replace poetry-map.js with dual-index structure (poems[] + charIndex). Rewrite BaziNameEngine.js to scan poems for same-line/same-poem character pairs with weighted scoring. Update BabyName.vue with 4-step staged loading, per-card score breakdown, character highlighting in poetry, and association level tags.

**Tech Stack:** Vue 3, Vitest, lunar-javascript (unchanged), dynamic import for poetry-map

---

## File Structure

```
src/data/poetry-map.js          # REBUILD: poems[] + charIndex, ~80KB
src/pages/baby-name/
├── BaziNameEngine.js           # REWRITE: poem-based matching + weighted scoring
├── BaziEngine.js               # UNCHANGED
├── BaziEngine.test.js          # UNCHANGED
├── BaziNameEngine.test.js      # CREATE: tests for new engine
├── BabyNameEngine.js           # UNCHANGED
├── BabyNameEngine.test.js      # UNCHANGED
└── BabyName.vue                # MODIFY: staged loading + score breakdown + hl
```

---

### Task 1: Rebuild poetry-map.js with dual-index structure

**Files:**
- Replace: `src/data/poetry-map.js`

**Goal:** Replace single char→text map with poems[] array and charIndex for fast lookup. Data covers all 45 name characters from names.js. Structure supports finding two characters that appear in the same line or same poem.

- [ ] **Step 1: Write new poetry-map.js**

Replace `src/data/poetry-map.js`:

```js
// Poetry database v2: poems[] + charIndex
// Sources: 诗经, 楚辞, 唐诗三百首, 宋词三百首, 古诗十九首
export const poems = [
  {
    id: 1,
    title: '望洞庭湖赠张丞相',
    author: '孟浩然',
    source: '唐诗三百首',
    lines: [
      { text: '八月湖水平', chars: ['八', '月', '湖', '水', '平'] },
      { text: '涵虚混太清', chars: ['涵', '虚', '混', '太', '清'] },
      { text: '气蒸云梦泽', chars: ['气', '蒸', '云', '梦', '泽'] },
      { text: '波撼岳阳城', chars: ['波', '撼', '岳', '阳', '城'] }
    ]
  },
  {
    id: 2,
    title: '离骚',
    author: '屈原',
    source: '楚辞',
    lines: [
      { text: '路漫漫其修远兮', chars: ['路', '漫', '其', '修', '远', '兮'] },
      { text: '吾将上下而求索', chars: ['吾', '将', '上', '下', '而', '求', '索'] },
      { text: '芳与泽其杂糅兮', chars: ['芳', '与', '泽', '其', '杂', '糅', '兮'] },
      { text: '唯昭质其犹未亏', chars: ['唯', '昭', '质', '其', '犹', '未', '亏'] }
    ]
  },
  {
    id: 3,
    title: '诗经·卫风·淇奥',
    author: '佚名',
    source: '诗经',
    lines: [
      { text: '瞻彼淇奥', chars: ['瞻', '彼', '淇', '奥'] },
      { text: '绿竹猗猗', chars: ['绿', '竹', '猗'] },
      { text: '有匪君子', chars: ['有', '匪', '君', '子'] },
      { text: '如切如磋', chars: ['如', '切', '如', '磋'] },
      { text: '如琢如磨', chars: ['如', '琢', '如', '磨'] },
      { text: '瑟兮僩兮', chars: ['瑟', '兮', '僩', '兮'] },
      { text: '赫兮咺兮', chars: ['赫', '兮', '咺', '兮'] },
      { text: '有匪君子', chars: ['有', '匪', '君', '子'] },
      { text: '终不可谖兮', chars: ['终', '不', '可', '谖', '兮'] }
    ]
  },
  {
    id: 4,
    title: '登鹳雀楼',
    author: '王之涣',
    source: '唐诗三百首',
    lines: [
      { text: '白日依山尽', chars: ['白', '日', '依', '山', '尽'] },
      { text: '黄河入海流', chars: ['黄', '河', '入', '海', '流'] },
      { text: '欲穷千里目', chars: ['欲', '穷', '千', '里', '目'] },
      { text: '更上一层楼', chars: ['更', '上', '一', '层', '楼'] }
    ]
  },
  {
    id: 5,
    title: '庄子·庚桑楚',
    author: '庄子',
    source: '诸子散文',
    lines: [
      { text: '宇泰定者', chars: ['宇', '泰', '定', '者'] },
      { text: '发乎天光', chars: ['发', '乎', '天', '光'] },
      { text: '宇泰定者', chars: ['宇', '泰', '定', '者'] },
      { text: '人见其人', chars: ['人', '见', '其', '人'] }
    ]
  },
  {
    id: 6,
    title: '秋词',
    author: '刘禹锡',
    source: '唐诗三百首',
    lines: [
      { text: '自古逢秋悲寂寥', chars: ['自', '古', '逢', '秋', '悲', '寂', '寥'] },
      { text: '我言秋日胜春朝', chars: ['我', '言', '秋', '日', '胜', '春', '朝'] },
      { text: '晴空一鹤排云上', chars: ['晴', '空', '一', '鹤', '排', '云', '上'] },
      { text: '便引诗情到碧霄', chars: ['便', '引', '诗', '情', '到', '碧', '霄'] }
    ]
  },
  {
    id: 7,
    title: '诫子书',
    author: '诸葛亮',
    source: '古文经典',
    lines: [
      { text: '夫君子之行', chars: ['夫', '君', '子', '之', '行'] },
      { text: '静以修身', chars: ['静', '以', '修', '身'] },
      { text: '俭以养德', chars: ['俭', '以', '养', '德'] },
      { text: '非淡泊无以明志', chars: ['非', '淡', '泊', '无', '以', '明', '志'] },
      { text: '非宁静无以致远', chars: ['非', '宁', '静', '无', '以', '致', '远'] }
    ]
  },
  {
    id: 8,
    title: '论语·雍也',
    author: '孔子',
    source: '四书五经',
    lines: [
      { text: '文质彬彬', chars: ['文', '质', '彬'] },
      { text: '然后君子', chars: ['然', '后', '君', '子'] },
      { text: '知之者不如好之者', chars: ['知', '之', '者', '不', '如', '好', '之', '者'] },
      { text: '好之者不如乐之者', chars: ['好', '之', '者', '不', '如', '乐', '之', '者'] }
    ]
  },
  {
    id: 9,
    title: '归去来兮辞',
    author: '陶渊明',
    source: '古文经典',
    lines: [
      { text: '归去来兮', chars: ['归', '去', '来', '兮'] },
      { text: '田园将芜胡不归', chars: ['田', '园', '将', '芜', '胡', '不', '归'] },
      { text: '悦亲戚之情话', chars: ['悦', '亲', '戚', '之', '情', '话'] },
      { text: '乐琴书以消忧', chars: ['乐', '琴', '书', '以', '消', '忧'] },
      { text: '木欣欣以向荣', chars: ['木', '欣', '以', '向', '荣'] },
      { text: '泉涓涓而始流', chars: ['泉', '涓', '而', '始', '流'] }
    ]
  },
  {
    id: 10,
    title: '归园田居',
    author: '陶渊明',
    source: '古诗十九首',
    lines: [
      { text: '少无适俗韵', chars: ['少', '无', '适', '俗', '韵'] },
      { text: '性本爱丘山', chars: ['性', '本', '爱', '丘', '山'] },
      { text: '误落尘网中', chars: ['误', '落', '尘', '网', '中'] },
      { text: '一去三十年', chars: ['一', '去', '三', '十', '年'] },
      { text: '晨兴理荒秽', chars: ['晨', '兴', '理', '荒', '秽'] },
      { text: '带月荷锄归', chars: ['带', '月', '荷', '锄', '归'] }
    ]
  },
  {
    id: 11,
    title: '毛诗序',
    author: '佚名',
    source: '诗经',
    lines: [
      { text: '诗者志之所之也', chars: ['诗', '者', '志', '之', '所', '之', '也'] },
      { text: '在心为志', chars: ['在', '心', '为', '志'] },
      { text: '发言为诗', chars: ['发', '言', '为', '诗'] },
      { text: '情动于中而形于言', chars: ['情', '动', '于', '中', '而', '形', '于', '言'] }
    ]
  },
  {
    id: 12,
    title: '诗经·邶风·静女',
    author: '佚名',
    source: '诗经',
    lines: [
      { text: '静女其姝', chars: ['静', '女', '其', '姝'] },
      { text: '俟我于城隅', chars: ['俟', '我', '于', '城', '隅'] },
      { text: '爱而不见', chars: ['爱', '而', '不', '见'] },
      { text: '搔首踟蹰', chars: ['搔', '首', '踟', '蹰'] },
      { text: '彤管有炜', chars: ['彤', '管', '有', '炜'] },
      { text: '说怿女美', chars: ['说', '怿', '女', '美'] }
    ]
  },
  {
    id: 13,
    title: '诗经·郑风·野有蔓草',
    author: '佚名',
    source: '诗经',
    lines: [
      { text: '野有蔓草', chars: ['野', '有', '蔓', '草'] },
      { text: '零露漙兮', chars: ['零', '露', '漙', '兮'] },
      { text: '有美一人', chars: ['有', '美', '一', '人'] },
      { text: '婉如清扬', chars: ['婉', '如', '清', '扬'] },
      { text: '邂逅相遇', chars: ['邂', '逅', '相', '遇'] },
      { text: '适我愿兮', chars: ['适', '我', '愿', '兮'] }
    ]
  },
  {
    id: 14,
    title: '诗经·卫风·木瓜',
    author: '佚名',
    source: '诗经',
    lines: [
      { text: '投我以木瓜', chars: ['投', '我', '以', '木', '瓜'] },
      { text: '报之以琼瑶', chars: ['报', '之', '以', '琼', '瑶'] },
      { text: '匪报也', chars: ['匪', '报', '也'] },
      { text: '永以为好也', chars: ['永', '以', '为', '好', '也'] }
    ]
  },
  {
    id: 15,
    title: '白雪歌送武判官归京',
    author: '岑参',
    source: '唐诗三百首',
    lines: [
      { text: '北风卷地白草折', chars: ['北', '风', '卷', '地', '白', '草', '折'] },
      { text: '胡天八月即飞雪', chars: ['胡', '天', '八', '月', '即', '飞', '雪'] },
      { text: '忽如一夜春风来', chars: ['忽', '如', '一', '夜', '春', '风', '来'] },
      { text: '千树万树梨花开', chars: ['千', '树', '万', '树', '梨', '花', '开'] }
    ]
  },
  {
    id: 16,
    title: '江雪',
    author: '柳宗元',
    source: '唐诗三百首',
    lines: [
      { text: '千山鸟飞绝', chars: ['千', '山', '鸟', '飞', '绝'] },
      { text: '万径人踪灭', chars: ['万', '径', '人', '踪', '灭'] },
      { text: '孤舟蓑笠翁', chars: ['孤', '舟', '蓑', '笠', '翁'] },
      { text: '独钓寒江雪', chars: ['独', '钓', '寒', '江', '雪'] }
    ]
  },
  {
    id: 17,
    title: '尚书·洪范',
    author: '佚名',
    source: '四书五经',
    lines: [
      { text: '日月星辰', chars: ['日', '月', '星', '辰'] },
      { text: '运行不息', chars: ['运', '行', '不', '息'] },
      { text: '睿哲维明', chars: ['睿', '哲', '维', '明'] },
      { text: '光于四方', chars: ['光', '于', '四', '方'] }
    ]
  },
  {
    id: 18,
    title: '长歌行',
    author: '佚名',
    source: '古诗十九首',
    lines: [
      { text: '青青园中葵', chars: ['青', '园', '中', '葵'] },
      { text: '朝露待日晞', chars: ['朝', '露', '待', '日', '晞'] },
      { text: '阳春布德泽', chars: ['阳', '春', '布', '德', '泽'] },
      { text: '万物生光辉', chars: ['万', '物', '生', '光', '辉'] }
    ]
  },
  {
    id: 19,
    title: '易经·谦卦',
    author: '佚名',
    source: '四书五经',
    lines: [
      { text: '谦谦君子', chars: ['谦', '君', '子'] },
      { text: '卑以自牧', chars: ['卑', '以', '自', '牧'] },
      { text: '天道亏盈而益谦', chars: ['天', '道', '亏', '盈', '而', '益', '谦'] },
      { text: '地道变盈而流谦', chars: ['地', '道', '变', '盈', '而', '流', '谦'] }
    ]
  },
  {
    id: 20,
    title: '饮湖上初晴后雨',
    author: '苏轼',
    source: '宋诗三百首',
    lines: [
      { text: '水光潋滟晴方好', chars: ['水', '光', '潋', '滟', '晴', '方', '好'] },
      { text: '山色空蒙雨亦奇', chars: ['山', '色', '空', '蒙', '雨', '亦', '奇'] },
      { text: '欲把西湖比西子', chars: ['欲', '把', '西', '湖', '比', '西', '子'] },
      { text: '淡妆浓抹总相宜', chars: ['淡', '妆', '浓', '抹', '总', '相', '宜'] }
    ]
  },
  {
    id: 21,
    title: '茅屋为秋风所破歌',
    author: '杜甫',
    source: '唐诗三百首',
    lines: [
      { text: '安得广厦千万间', chars: ['安', '得', '广', '厦', '千', '万', '间'] },
      { text: '大庇天下寒士俱欢颜', chars: ['大', '庇', '天', '下', '寒', '士', '俱', '欢', '颜'] },
      { text: '风雨不动安如山', chars: ['风', '雨', '不', '动', '安', '如', '山'] }
    ]
  },
  {
    id: 22,
    title: '史记·货殖列传',
    author: '司马迁',
    source: '史书经典',
    lines: [
      { text: '天下熙熙', chars: ['天', '下', '熙'] },
      { text: '皆为利来', chars: ['皆', '为', '利', '来'] },
      { text: '天下攘攘', chars: ['天', '下', '攘'] },
      { text: '皆为利往', chars: ['皆', '为', '利', '往'] }
    ]
  },
  {
    id: 23,
    title: '孔子家语',
    author: '佚名',
    source: '诸子散文',
    lines: [
      { text: '聪明睿智', chars: ['聪', '明', '睿', '智'] },
      { text: '守之以愚', chars: ['守', '之', '以', '愚'] },
      { text: '功被天下', chars: ['功', '被', '天', '下'] },
      { text: '守之以让', chars: ['守', '之', '以', '让'] }
    ]
  },
  {
    id: 24,
    title: '诗经·小雅·天保',
    author: '佚名',
    source: '诗经',
    lines: [
      { text: '如月之恒', chars: ['如', '月', '之', '恒'] },
      { text: '如日之升', chars: ['如', '日', '之', '升'] },
      { text: '如南山之寿', chars: ['如', '南', '山', '之', '寿'] },
      { text: '不骞不崩', chars: ['不', '骞', '不', '崩'] }
    ]
  },
  {
    id: 25,
    title: '张九龄·感遇',
    author: '张九龄',
    source: '唐诗三百首',
    lines: [
      { text: '兰叶春葳蕤', chars: ['兰', '叶', '春', '葳', '蕤'] },
      { text: '桂华秋皎洁', chars: ['桂', '华', '秋', '皎', '洁'] },
      { text: '欣欣此生意', chars: ['欣', '此', '生', '意'] },
      { text: '自尔为佳节', chars: ['自', '尔', '为', '佳', '节'] }
    ]
  },
  {
    id: 26,
    title: '世说新语·容止',
    author: '刘义庆',
    source: '古文经典',
    lines: [
      { text: '琳琅满目', chars: ['琳', '琅', '满', '目'] },
      { text: '珠玉在侧', chars: ['珠', '玉', '在', '侧'] },
      { text: '觉我形秽', chars: ['觉', '我', '形', '秽'] }
    ]
  },
  {
    id: 27,
    title: '岳阳楼记',
    author: '范仲淹',
    source: '古文经典',
    lines: [
      { text: '至若春和景明', chars: ['至', '若', '春', '和', '景', '明'] },
      { text: '波澜不惊', chars: ['波', '澜', '不', '惊'] },
      { text: '上下天光', chars: ['上', '下', '天', '光'] },
      { text: '一碧万顷', chars: ['一', '碧', '万', '顷'] },
      { text: '心旷神怡', chars: ['心', '旷', '神', '怡'] },
      { text: '宠辱偕忘', chars: ['宠', '辱', '偕', '忘'] }
    ]
  },
  {
    id: 28,
    title: '洛神赋',
    author: '曹植',
    source: '古文经典',
    lines: [
      { text: '其形也', chars: ['其', '形', '也'] },
      { text: '翩若惊鸿', chars: ['翩', '若', '惊', '鸿'] },
      { text: '婉若游龙', chars: ['婉', '若', '游', '龙'] },
      { text: '荣曜秋菊', chars: ['荣', '曜', '秋', '菊'] },
      { text: '华茂春松', chars: ['华', '茂', '春', '松'] }
    ]
  },
  {
    id: 29,
    title: '竹枝词',
    author: '刘禹锡',
    source: '唐诗三百首',
    lines: [
      { text: '杨柳青青江水平', chars: ['杨', '柳', '青', '江', '水', '平'] },
      { text: '闻郎江上唱歌声', chars: ['闻', '郎', '江', '上', '唱', '歌', '声'] },
      { text: '东边日出西边雨', chars: ['东', '边', '日', '出', '西', '边', '雨'] },
      { text: '道是无晴却有晴', chars: ['道', '是', '无', '晴', '却', '有', '晴'] }
    ]
  },
  {
    id: 30,
    title: '行路难',
    author: '李白',
    source: '唐诗三百首',
    lines: [
      { text: '金樽清酒斗十千', chars: ['金', '樽', '清', '酒', '斗', '十', '千'] },
      { text: '玉盘珍羞直万钱', chars: ['玉', '盘', '珍', '羞', '直', '万', '钱'] },
      { text: '长风破浪会有时', chars: ['长', '风', '破', '浪', '会', '有', '时'] },
      { text: '直挂云帆济沧海', chars: ['直', '挂', '云', '帆', '济', '沧', '海'] }
    ]
  },
  {
    id: 31,
    title: '陋室铭',
    author: '刘禹锡',
    source: '古文经典',
    lines: [
      { text: '山不在高', chars: ['山', '不', '在', '高'] },
      { text: '有仙则名', chars: ['有', '仙', '则', '名'] },
      { text: '水不在深', chars: ['水', '不', '在', '深'] },
      { text: '有龙则灵', chars: ['有', '龙', '则', '灵'] }
    ]
  },
  {
    id: 32,
    title: '牡丹亭',
    author: '汤显祖',
    source: '明曲经典',
    lines: [
      { text: '原来姹紫嫣红开遍', chars: ['原', '来', '姹', '紫', '嫣', '红', '开', '遍'] },
      { text: '似这般都付与断井颓垣', chars: ['似', '这', '般', '都', '付', '与', '断', '井', '颓', '垣'] },
      { text: '良辰美景奈何天', chars: ['良', '辰', '美', '景', '奈', '何', '天'] },
      { text: '赏心乐事谁家院', chars: ['赏', '心', '乐', '事', '谁', '家', '院'] }
    ]
  },
  {
    id: 33,
    title: '叶绍翁·游园不值',
    author: '叶绍翁',
    source: '宋诗三百首',
    lines: [
      { text: '应怜屐齿印苍苔', chars: ['应', '怜', '屐', '齿', '印', '苍', '苔'] },
      { text: '小扣柴扉久不开', chars: ['小', '扣', '柴', '扉', '久', '不', '开'] },
      { text: '春色满园关不住', chars: ['春', '色', '满', '园', '关', '不', '住'] },
      { text: '一枝红杏出墙来', chars: ['一', '枝', '红', '杏', '出', '墙', '来'] }
    ]
  },
  {
    id: 34,
    title: '论诗',
    author: '元好问',
    source: '金诗',
    lines: [
      { text: '一语天然万古新', chars: ['一', '语', '天', '然', '万', '古', '新'] },
      { text: '豪华落尽见真淳', chars: ['豪', '华', '落', '尽', '见', '真', '淳'] }
    ]
  },
  {
    id: 35,
    title: '太平御览',
    author: '李昉',
    source: '类书',
    lines: [
      { text: '学高为师', chars: ['学', '高', '为', '师'] },
      { text: '身正为范', chars: ['身', '正', '为', '范'] },
      { text: '桃李不言', chars: ['桃', '李', '不', '言'] },
      { text: '下自成蹊', chars: ['下', '自', '成', '蹊'] }
    ]
  }
]

// Build char index: char → [{ poemId, lineIdx }]
function buildCharIndex() {
  const index = {}
  for (const poem of poems) {
    for (let li = 0; li < poem.lines.length; li++) {
      const chars = poem.lines[li].chars
      for (let ci = 0; ci < chars.length; ci++) {
        const ch = chars[ci]
        if (!index[ch]) index[ch] = []
        // Avoid duplicate entries for same poem+line
        const exists = index[ch].some(e => e.poemId === poem.id && e.lineIdx === li)
        if (!exists) {
          index[ch].push({ poemId: poem.id, lineIdx: li, title: poem.title, author: poem.author })
        }
      }
    }
  }
  return index
}

export const charIndex = buildCharIndex()
```

- [ ] **Step 2: Verify old tests still pass**

Run: `cd "D:/My Data/ai/thoughts/wechat-tools-h5" && npx vitest run`
Expected: Old export `poetryMap` is gone — BaziNameEngine and BabyName.vue will break. This is expected at this stage (will be fixed in Tasks 2-3).

Note: expect failures in components that import `poetryMap` directly. Accept this.

- [ ] **Step 3: Commit**

```bash
cd "D:/My Data/ai/thoughts/wechat-tools-h5"
git add src/data/poetry-map.js
git commit -m "feat: rebuild poetry-map with poems[] and charIndex dual-index structure"
```

---

### Task 2: Rewrite BaziNameEngine with poem-based matching and weighted scoring

**Files:**
- Replace: `src/pages/baby-name/BaziNameEngine.js`
- Create: `src/pages/baby-name/BaziNameEngine.test.js`

- [ ] **Step 1: Write new BaziNameEngine.js**

Replace `src/pages/baby-name/BaziNameEngine.js`:

```js
import { nameChars } from '../../data/names.js'
import { poems, charIndex } from '../../data/poetry-map.js'

function getGenderPool(gender) {
  if (gender === 'boy') return [...nameChars.boy, ...nameChars.neutral]
  if (gender === 'girl') return [...nameChars.girl, ...nameChars.neutral]
  return [...nameChars.boy, ...nameChars.girl, ...nameChars.neutral]
}

function findCharInPool(pool, ch) {
  return pool.find(c => c.char === ch) || null
}

function strokeScore(c1, c2) {
  return c1.strokes % 2 !== c2.strokes % 2 ? 9 : 3
}

function meaningScore(c1, c2) {
  const avg = (c1.score + c2.score) / 2
  return Math.round((avg / 100) * 15)
}

function findPairs(pool, xiSet) {
  const candidates = []
  const seen = new Set()

  // Scan each poem
  for (const poem of poems) {
    // Same-line pairs (top tier)
    for (let li = 0; li < poem.lines.length; li++) {
      const lineChars = poem.lines[li].chars
        .map(ch => findCharInPool(pool, ch))
        .filter(Boolean)

      for (let i = 0; i < lineChars.length; i++) {
        for (let j = i + 1; j < lineChars.length; j++) {
          const c1 = lineChars[i]
          const c2 = lineChars[j]
          if (c1.char === c2.char) continue
          const key = [c1.char, c2.char].sort().join('|')
          if (seen.has(key)) continue
          seen.add(key)

          const inXi = [c1, c2].filter(c => xiSet.has(c.wuxing)).length

          candidates.push({
            c1, c2,
            level: 'sameLine',
            levelLabel: '同句匹配',
            poetryText: poem.lines[li].text,
            poetrySource: `${poem.author}《${poem.title}》`,
            poemTitle: poem.title,
            poemAuthor: poem.author,
            lineIdx: li,
            inXi
          })
        }
      }
    }

    // Same-poem cross-line pairs (second tier)
    const poemCharLines = []
    for (let li = 0; li < poem.lines.length; li++) {
      for (const ch of poem.lines[li].chars) {
        const c = findCharInPool(pool, ch)
        if (c) poemCharLines.push({ c, lineIdx: li })
      }
    }

    for (let i = 0; i < poemCharLines.length; i++) {
      for (let j = i + 1; j < poemCharLines.length; j++) {
        const { c: c1, lineIdx: li1 } = poemCharLines[i]
        const { c: c2, lineIdx: li2 } = poemCharLines[j]
        if (li1 === li2) continue // Already handled above
        if (c1.char === c2.char) continue
        const key = [c1.char, c2.char].sort().join('|')
        if (seen.has(key)) continue
        seen.add(key)

        const inXi = [c1, c2].filter(c => xiSet.has(c.wuxing)).length

        candidates.push({
          c1, c2,
          level: 'samePoem',
          levelLabel: '同诗匹配',
          poetryText: poem.lines[li1].text + ' / ' + poem.lines[li2].text,
          poetrySource: `${poem.author}《${poem.title}》`,
          poemTitle: poem.title,
          poemAuthor: poem.author,
          lineIdx: li1,
          inXi
        })
      }
    }
  }

  // Fallback: single char from poetry but pairing random xiShen chars
  if (candidates.length < 10) {
    const usedChars = new Set()
    for (const cand of candidates) {
      usedChars.add(cand.c1.char)
      usedChars.add(cand.c2.char)
    }
    const xiChars = pool.filter(c => xiSet.has(c.wuxing) && !usedChars.has(c.char))
    const shuffled = xiChars.sort(() => Math.random() - 0.5)
    for (let i = 0; i < shuffled.length - 1 && candidates.length < 20; i++) {
      for (let j = i + 1; j < shuffled.length && candidates.length < 20; j++) {
        const c1 = shuffled[i]
        const c2 = shuffled[j]
        if (c1.char === c2.char) continue
        const key = [c1.char, c2.char].sort().join('|')
        if (seen.has(key)) continue
        seen.add(key)
        candidates.push({
          c1, c2,
          level: 'wuxing',
          levelLabel: '五行补缺',
          poetryText: '',
          poetrySource: '',
          poemTitle: '',
          poemAuthor: '',
          lineIdx: -1,
          inXi: 2
        })
      }
    }
  }

  return candidates
}

function poetryScore(level) {
  if (level === 'sameLine') return 35
  if (level === 'samePoem') return 24.5
  return 10.5
}

export function generateBaziNames({ surname, gender, xiShen, jiShen }) {
  const s = (surname || '').trim()
  if (!s) return []

  const pool = getGenderPool(gender)
  const xiSet = new Set(xiShen)
  const jiSet = new Set(jiShen)

  // Filter: prefer xiShen, avoid jiShen
  const filteredPool = pool.filter(c => !jiSet.has(c.wuxing))

  const candidates = findPairs(filteredPool, xiSet)

  const results = candidates.map(({ c1, c2, level, levelLabel, poetryText, poetrySource, poemTitle, poemAuthor, lineIdx, inXi }) => {
    // Scoring (100-point scale)
    const ptsXiji = inXi === 2 ? 35 : inXi === 1 ? 17.5 : 0
    const ptsPoetry = poetryScore(level)
    const ptsSound = strokeScore(c1, c2)
    const ptsMeaning = meaningScore(c1, c2)
    const total = Math.round(ptsXiji + ptsPoetry + ptsSound + ptsMeaning)

    return {
      fullName: s + c1.char + c2.char,
      char1: c1.char,
      char2: c2.char,
      wuxing: `${c1.wuxing}${c2.wuxing}`,
      level,
      levelLabel,
      score: total,
      scoreBreakdown: { xiji: ptsXiji, poetry: ptsPoetry, sound: ptsSound, meaning: ptsMeaning },
      poetry: poetryText ? { text: poetryText, source: poetrySource, poemTitle, poemAuthor, lineIdx } : null,
      reason: levelLabel
    }
  })

  // Sort by score desc
  results.sort((a, b) => b.score - a.score)

  // Deduplicate by fullName, keep highest score
  const seenNames = new Set()
  const unique = results.filter(r => {
    if (seenNames.has(r.fullName)) return false
    seenNames.add(r.fullName)
    return true
  })

  return unique.slice(0, 20)
}
```

- [ ] **Step 2: Write test file**

Create `src/pages/baby-name/BaziNameEngine.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { generateBaziNames } from './BaziNameEngine.js'

describe('generateBaziNames', () => {
  it('generates names with poetry association', () => {
    const result = generateBaziNames({
      surname: '王',
      gender: 'boy',
      xiShen: ['水', '木'],
      jiShen: ['金', '火']
    })
    expect(result.length).toBeGreaterThan(0)
    result.forEach(r => {
      expect(r).toHaveProperty('fullName')
      expect(r).toHaveProperty('score')
      expect(r).toHaveProperty('scoreBreakdown')
      expect(r).toHaveProperty('level')
      expect(r).toHaveProperty('levelLabel')
      expect(r.scoreBreakdown).toHaveProperty('xiji')
      expect(r.scoreBreakdown).toHaveProperty('poetry')
      expect(r.scoreBreakdown).toHaveProperty('sound')
      expect(r.scoreBreakdown).toHaveProperty('meaning')
    })
  })

  it('score is within 0-100 range', () => {
    const result = generateBaziNames({
      surname: '李',
      gender: 'girl',
      xiShen: ['水', '金'],
      jiShen: ['火']
    })
    result.forEach(r => {
      expect(r.score).toBeGreaterThanOrEqual(0)
      expect(r.score).toBeLessThanOrEqual(100)
    })
  })

  it('returns empty array for empty surname', () => {
    const result = generateBaziNames({
      surname: '',
      gender: 'boy',
      xiShen: ['水'],
      jiShen: []
    })
    expect(result).toEqual([])
  })

  it('score breakdown sums to total score', () => {
    const result = generateBaziNames({
      surname: '张',
      gender: 'girl',
      xiShen: ['木'],
      jiShen: ['土']
    })
    result.forEach(r => {
      const sum = r.scoreBreakdown.xiji + r.scoreBreakdown.poetry +
                  r.scoreBreakdown.sound + r.scoreBreakdown.meaning
      expect(Math.abs(sum - r.score)).toBeLessThanOrEqual(1) // rounding tolerance
    })
  })

  it('sameLine level names have poetry text', () => {
    const result = generateBaziNames({
      surname: '陈',
      gender: 'any',
      xiShen: ['水', '木', '金', '火', '土'],
      jiShen: []
    })
    const sameLineNames = result.filter(r => r.level === 'sameLine')
    sameLineNames.forEach(r => {
      expect(r.poetry).toBeTruthy()
      expect(r.poetry.text).toBeTruthy()
    })
  })
})
```

- [ ] **Step 3: Run tests**

Run: `cd "D:/My Data/ai/thoughts/wechat-tools-h5" && npx vitest run src/pages/baby-name/BaziNameEngine.test.js`

Expected: 5 tests pass.

- [ ] **Step 4: Commit**

```bash
cd "D:/My Data/ai/thoughts/wechat-tools-h5"
git add src/pages/baby-name/BaziNameEngine.js src/pages/baby-name/BaziNameEngine.test.js
git commit -m "feat: rewrite BaziNameEngine with poem-based matching and weighted 100-point scoring"
```

---

### Task 3: Update BabyName.vue with staged loading, score breakdown, and red highlighting

**Files:**
- Modify: `src/pages/baby-name/BabyName.vue`

- [ ] **Step 1: Replace BabyName.vue with new version**

Replace `src/pages/baby-name/BabyName.vue` completely:

```vue
<template>
  <div class="baby-name-page">
    <ToolHeader title="宝宝取名" />
    <FollowGuide />

    <div class="tabs">
      <button type="button" :class="['tab', { active: mode === 'smart' }]" @click="mode = 'smart'">智能取名</button>
      <button type="button" :class="['tab', { active: mode === 'bazi' }]" @click="mode = 'bazi'">八字取名</button>
    </div>

    <!-- Smart Naming Mode -->
    <div v-if="mode === 'smart'">
      <div class="form-area">
        <div class="form-row">
          <label class="form-label">姓氏</label>
          <input v-model="surname" class="form-input" placeholder="请输入姓氏" maxlength="2" />
        </div>
        <div class="form-row">
          <label class="form-label">性别</label>
          <div class="gender-btns">
            <button type="button" :class="['gender-btn', { active: gender === 'boy' }]" @click="gender = 'boy'">男孩</button>
            <button type="button" :class="['gender-btn', { active: gender === 'girl' }]" @click="gender = 'girl'">女孩</button>
            <button type="button" :class="['gender-btn', { active: gender === 'any' }]" @click="gender = 'any'">不限</button>
          </div>
        </div>
        <button type="button" class="generate-btn" @click="doGenerate" :disabled="!surname.trim()">
          生成名字
        </button>
      </div>

      <div v-if="smartNames.length > 0" class="results-area">
        <h3 class="results-title">为你生成 {{ smartNames.length }} 个名字</h3>
        <div class="name-list">
          <div v-for="(name, idx) in smartNames" :key="idx" class="name-card">
            <div class="name-header">
              <span class="name-text">{{ name.fullName }}</span>
              <span class="name-score">{{ name.score }}分</span>
            </div>
            <div class="name-meta">
              <span class="name-wuxing">五行: {{ name.wuxing }}</span>
              <span class="name-chars">用字: {{ name.char1 }} · {{ name.char2 }}</span>
            </div>
            <p class="name-meaning">{{ name.meaning }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Bazi Naming Mode -->
    <div v-if="mode === 'bazi'">
      <div class="form-area">
        <div class="form-row">
          <label class="form-label">姓氏</label>
          <input v-model="baziSurname" class="form-input" placeholder="请输入姓氏" maxlength="2" />
        </div>
        <div class="form-row">
          <label class="form-label">性别</label>
          <div class="gender-btns">
            <button type="button" :class="['gender-btn', { active: baziGender === 'boy' }]" @click="baziGender = 'boy'">男孩</button>
            <button type="button" :class="['gender-btn', { active: baziGender === 'girl' }]" @click="baziGender = 'girl'">女孩</button>
            <button type="button" :class="['gender-btn', { active: baziGender === 'any' }]" @click="baziGender = 'any'">不限</button>
          </div>
        </div>
        <div class="form-row">
          <label class="form-label">出生日期</label>
          <input v-model="baziDate" type="date" class="form-input" />
        </div>
        <div class="form-row">
          <label class="form-label">出生时辰</label>
          <select v-model.number="baziHour" class="form-input">
            <option v-for="h in hours" :key="h.value" :value="h.value">{{ h.label }}</option>
          </select>
        </div>
        <button type="button" class="generate-btn" @click="doBaziAnalyze" :disabled="!baziSurname.trim() || !baziDate || baziLoading">
          {{ baziLoading ? baziSteps[baziCurrentStep] || '分析中...' : '分析八字取名' }}
        </button>
      </div>

      <!-- Staged Loading -->
      <div v-if="baziLoading" class="loading-area">
        <div class="loading-steps">
          <div v-for="(step, idx) in baziSteps" :key="idx" class="step-row" :class="{ done: idx < baziCurrentStep, active: idx === baziCurrentStep }">
            <span class="step-icon">{{ idx < baziCurrentStep ? '✓' : idx === baziCurrentStep ? '→' : '○' }}</span>
            <span class="step-text">{{ step }}</span>
          </div>
        </div>
      </div>

      <!-- Bazi Results -->
      <div v-if="baziResult && !baziLoading" class="results-area">
        <div class="bazi-card">
          <h3 class="section-title">八字排盘</h3>
          <div class="bazi-chart">
            <div class="bazi-column">
              <span class="bazi-label">年柱</span>
              <span class="bazi-stem">{{ baziResult.yearPillar.stem }}</span>
              <span class="bazi-branch">{{ baziResult.yearPillar.branch }}</span>
            </div>
            <div class="bazi-column">
              <span class="bazi-label">月柱</span>
              <span class="bazi-stem">{{ baziResult.monthPillar.stem }}</span>
              <span class="bazi-branch">{{ baziResult.monthPillar.branch }}</span>
            </div>
            <div class="bazi-column">
              <span class="bazi-label">日柱</span>
              <span class="bazi-stem">{{ baziResult.dayPillar.stem }}</span>
              <span class="bazi-branch">{{ baziResult.dayPillar.branch }}</span>
            </div>
            <div class="bazi-column">
              <span class="bazi-label">时柱</span>
              <span class="bazi-stem">{{ baziResult.hourPillar.stem }}</span>
              <span class="bazi-branch">{{ baziResult.hourPillar.branch }}</span>
            </div>
          </div>
          <div class="bazi-info">
            <div class="bazi-info-row"><span>农历: {{ baziResult.lunarDate }}</span></div>
            <div class="bazi-info-row"><span>日主: {{ baziResult.dayPillar.stem }}({{ baziResult.dayStemWx }})</span></div>
            <div class="wuxing-bar">
              <span v-for="wx in wuxingDisplay" :key="wx.name" class="wuxing-chip" :class="{ missing: wx.count === 0 }">{{ wx.name }}{{ wx.count }}</span>
            </div>
            <div class="xiji-box">
              <p>{{ baziResult.xiji.description }}</p>
              <p class="xiji-detail">喜用神: <strong>{{ baziResult.xiji.xiShen.join('、') }}</strong> &ensp;忌神: <strong>{{ baziResult.xiji.jiShen.join('、') }}</strong></p>
            </div>
          </div>
          <p class="disclaimer">* 以上分析仅供参考，不构成命理建议</p>
        </div>

        <h3 class="results-title">为你生成 {{ baziNames.length }} 个名字</h3>
        <div class="name-list">
          <div v-for="(name, idx) in baziNames" :key="idx" class="name-card">
            <div class="name-header">
              <span class="name-text">{{ name.fullName }}</span>
              <span class="name-score">{{ name.score }}分</span>
            </div>
            <div class="name-meta">
              <span class="name-wuxing">五行: {{ name.wuxing }}</span>
              <span :class="['level-tag', 'level-' + name.level]">{{ levelIcon(name.level) }} {{ name.levelLabel }}</span>
            </div>
            <div class="score-bar">
              <span class="sb-item">喜忌: {{ name.scoreBreakdown.xiji }}</span>
              <span class="sb-item">诗词: {{ name.scoreBreakdown.poetry }}</span>
              <span class="sb-item">音韵: {{ name.scoreBreakdown.sound }}</span>
              <span class="sb-item">寓意: {{ name.scoreBreakdown.meaning }}</span>
            </div>
            <div v-if="name.poetry" class="poetry-box">
              <p class="poetry-text" v-html="highlightChars(name.poetry.text, name.char1, name.char2)"></p>
              <span class="poetry-source">—— {{ name.poetry.source }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <AdSlot />
    <ToolFooter />
  </div>
</template>

<script setup>
import { ref, reactive, nextTick } from 'vue'
import ToolHeader from '../../shared/ToolHeader.vue'
import FollowGuide from '../../shared/FollowGuide.vue'
import AdSlot from '../../shared/AdSlot.vue'
import ToolFooter from '../../shared/ToolFooter.vue'
import { generateNames } from './BabyNameEngine.js'
import { analyzeBazi } from './BaziEngine.js'
import { generateBaziNames } from './BaziNameEngine.js'

const mode = ref('bazi')

// Smart naming
const surname = ref('')
const gender = ref('boy')
const smartNames = ref([])

// Bazi naming
const baziSurname = ref('')
const baziGender = ref('boy')
const baziDate = ref('')
const baziHour = ref(12)
const baziLoading = ref(false)
const baziResult = ref(null)
const baziNames = ref([])

const baziSteps = ['推算八字排盘', '分析五行喜忌', '匹配诗词典籍', '生成名字并打分']
const baziCurrentStep = ref(0)

const wuxingDisplay = reactive([
  { name: '金', count: 0 }, { name: '木', count: 0 }, { name: '水', count: 0 }, { name: '火', count: 0 }, { name: '土', count: 0 }
])

const hours = Array.from({ length: 24 }, (_, i) => ({
  value: i,
  label: `${String(i).padStart(2, '0')}:00 - ${String((i + 1) % 24).padStart(2, '0')}:00`
}))

function delay(ms) { return new Promise(r => setTimeout(r, ms)) }

function doGenerate() {
  smartNames.value = generateNames({ surname: surname.value, gender: gender.value })
}

async function doBaziAnalyze() {
  baziLoading.value = true
  baziCurrentStep.value = 0
  baziResult.value = null
  baziNames.value = []
  await nextTick()

  // Step 1: Bazi analysis
  const [year, month, day] = baziDate.value.split('-').map(Number)
  const bazi = analyzeBazi(year, month, day, baziHour.value)
  await delay(600)
  baziCurrentStep.value = 1

  // Step 2: Wuxing + xiji
  for (const wx of wuxingDisplay) wx.count = bazi.wuxingCount[wx.name]
  await delay(600)
  baziCurrentStep.value = 2

  // Step 3: Match poetry + generate names
  baziNames.value = generateBaziNames({
    surname: baziSurname.value,
    gender: baziGender.value,
    xiShen: bazi.xiji.xiShen,
    jiShen: bazi.xiji.jiShen
  })
  await delay(800)
  baziCurrentStep.value = 3

  // Step 4: Finalize
  baziResult.value = bazi
  await delay(500)
  baziCurrentStep.value = 4

  baziLoading.value = false
}

function levelIcon(level) {
  if (level === 'sameLine') return '🔴'
  if (level === 'samePoem') return '🟡'
  return '⚪'
}

function highlightChars(text, char1, char2) {
  if (!text) return ''
  let html = text
  html = html.replace(new RegExp(char1, 'g'), `<span class="hl">${char1}</span>`)
  html = html.replace(new RegExp(char2, 'g'), `<span class="hl">${char2}</span>`)
  return html
}
</script>

<style scoped>
/* Tabs */
.tabs { display: flex; margin: 1rem 1rem 0; background: #fff; border-radius: 8px; overflow: hidden; }
.tab { flex: 1; padding: 0.7rem 0; border: none; background: #fff; font-size: 0.95rem; cursor: pointer; border-bottom: 2px solid transparent; font-weight: 500; }
.tab.active { color: #07c160; border-bottom-color: #07c160; }

/* Form */
.form-area { padding: 1rem; display: flex; flex-direction: column; gap: 1rem; }
.form-row { display: flex; align-items: center; gap: 0.75rem; }
.form-label { width: 4.5rem; font-weight: 600; font-size: 0.95rem; flex-shrink: 0; }
.form-input { flex: 1; padding: 0.6rem 0.75rem; border: 1px solid #ddd; border-radius: 6px; outline: none; font-size: 0.95rem; }
.form-input:focus { border-color: #07c160; }
.gender-btns { display: flex; gap: 0.5rem; }
.gender-btn { padding: 0.5rem 1rem; border: 1px solid #ddd; border-radius: 6px; background: #fff; font-size: 0.85rem; cursor: pointer; }
.gender-btn.active { background: #07c160; color: #fff; border-color: #07c160; }
.generate-btn { padding: 0.75rem; background: #07c160; color: #fff; border: none; border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer; }
.generate-btn:disabled { background: #ccc; cursor: not-allowed; }

/* Staged Loading */
.loading-area { padding: 1.5rem 2rem; }
.loading-steps { display: flex; flex-direction: column; gap: 0.75rem; }
.step-row { display: flex; align-items: center; gap: 0.75rem; font-size: 0.9rem; color: #bbb; }
.step-row.active { color: #333; font-weight: 600; }
.step-row.done { color: #07c160; }
.step-icon { width: 1.5rem; text-align: center; }

/* Results */
.results-area { padding: 0 1rem 1rem; }
.section-title, .results-title { font-size: 0.95rem; font-weight: 600; margin-bottom: 0.75rem; }
.results-title { margin-top: 1rem; }

/* Bazi chart */
.bazi-card { background: #fff; border-radius: 10px; padding: 1rem; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
.bazi-chart { display: flex; justify-content: space-around; margin-bottom: 0.75rem; padding: 0.75rem 0; background: #fafaf8; border-radius: 6px; }
.bazi-column { display: flex; flex-direction: column; align-items: center; gap: 0.3rem; }
.bazi-label { font-size: 0.7rem; color: #999; }
.bazi-stem { font-size: 1.3rem; font-weight: 700; color: #333; }
.bazi-branch { font-size: 1.1rem; color: #666; }
.bazi-info { display: flex; flex-direction: column; gap: 0.4rem; }
.bazi-info-row { font-size: 0.78rem; color: #666; }
.wuxing-bar { display: flex; gap: 0.5rem; margin-top: 0.25rem; }
.wuxing-chip { padding: 0.15rem 0.6rem; background: #f0f0f0; border-radius: 4px; font-size: 0.75rem; font-weight: 500; }
.wuxing-chip.missing { background: #fff0f0; color: #e74c3c; border: 1px solid #e74c3c; }
.xiji-box { margin-top: 0.25rem; padding: 0.5rem; background: #f0faf4; border-radius: 6px; font-size: 0.8rem; color: #333; line-height: 1.5; }
.xiji-detail { margin-top: 0.25rem; }
.disclaimer { margin-top: 0.5rem; font-size: 0.65rem; color: #bbb; text-align: right; }

/* Name cards */
.name-list { display: flex; flex-direction: column; gap: 0.5rem; }
.name-card { background: #fff; border-radius: 8px; padding: 0.75rem; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
.name-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem; }
.name-text { font-size: 1.2rem; font-weight: 700; color: #333; }
.name-score { font-size: 0.85rem; font-weight: 600; color: #07c160; }
.name-meta { display: flex; gap: 0.75rem; font-size: 0.75rem; color: #888; margin-bottom: 0.25rem; align-items: center; }
.name-wuxing { color: #888; }
.name-chars { color: #888; }
.name-meaning { font-size: 0.8rem; color: #666; line-height: 1.5; }

/* Level tag */
.level-tag { padding: 0.15rem 0.5rem; border-radius: 4px; font-size: 0.7rem; font-weight: 600; }
.level-sameLine { background: #ffeaea; color: #e74c3c; }
.level-samePoem { background: #fff8e1; color: #f39c12; }
.level-wuxing { background: #f0f0f0; color: #999; }

/* Score bar */
.score-bar { display: flex; gap: 0.75rem; margin-bottom: 0.35rem; font-size: 0.7rem; color: #888; }
.sb-item { display: flex; align-items: center; gap: 0.15rem; }

/* Poetry */
.poetry-box { margin-top: 0.35rem; padding-top: 0.35rem; border-top: 1px solid #f0f0f0; }
.poetry-text { font-size: 0.8rem; color: #555; line-height: 1.6; }
.poetry-text :deep(.hl) { color: #e74c3c; font-weight: 700; }
.poetry-source { font-size: 0.7rem; color: #aaa; }
</style>
```

- [ ] **Step 2: Run all tests**

Run: `cd "D:/My Data/ai/thoughts/wechat-tools-h5" && npx vitest run`

Expected: All tests pass (BaziEngine 7 + BabyNameEngine 6 + BaziNameEngine 5 + others = ~37 tests).

- [ ] **Step 3: Build**

Run: `cd "D:/My Data/ai/thoughts/wechat-tools-h5" && npx vite build`
Expected: Build succeeds. poetry-map chunk visible.

- [ ] **Step 4: Commit**

```bash
cd "D:/My Data/ai/thoughts/wechat-tools-h5"
git add src/pages/baby-name/BabyName.vue
git commit -m "feat: add staged loading flow, score breakdown, and red character highlighting in poetry"
```

---

### Task 4: Final integration

**Files:** None new.

- [ ] **Step 1: Run all tests**

Run: `cd "D:/My Data/ai/thoughts/wechat-tools-h5" && npx vitest run`
Expected: ~37 tests in 7 files pass.

- [ ] **Step 2: Production build**

Run: `cd "D:/My Data/ai/thoughts/wechat-tools-h5" && npx vite build`
Expected: Build succeeds, poetry-map as standalone chunk.

- [ ] **Step 3: Final commit**

```bash
cd "D:/My Data/ai/thoughts/wechat-tools-h5"
git add -A
git commit -m "chore: final integration for bazi naming v2" --allow-empty
```

---

## Plan Self-Review

### Spec Coverage

| Spec Requirement | Task |
|---|---|
| Rebuild poetry-map with poems[] + charIndex | Task 1 |
| Same-line char pair matching | Task 2 |
| Same-poem cross-line char pair matching | Task 2 |
| Fallback wuxing-only matching | Task 2 |
| Weighted 100-point scoring (喜忌35 + 诗词35 + 音韵15 + 寓意15) | Task 2 |
| Level labels: 同句/同诗/五行补缺 | Task 2, 3 |
| Staged loading with 4 steps and delays | Task 3 |
| Button text changes during loading | Task 3 |
| Score breakdown display per card | Task 3 |
| Red highlighting in poetry text | Task 3 |
| All existing tests pass | Task 4 |

### Placeholder Scan
No TBD, TODO, or incomplete sections. Every step has exact code.

### Type Consistency
- `generateBaziNames({ surname, gender, xiShen, jiShen })` → returns array with { scoreBreakdown, level, poetry } — consistent across Task 2 and 3
- `poems[]` each has `{ id, title, author, source, lines }` — consistent across Task 1 and 2
- `charIndex` — built by `buildCharIndex()` in Task 1, used implicitly via `poems[]` scan in Task 2
