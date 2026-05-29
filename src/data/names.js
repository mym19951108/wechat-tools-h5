export const nameChars = {
  boy: [
    { char: '宇', wuxing: '土', meaning: '宇宙，胸怀广阔', strokes: 6, score: 95 },
    { char: '泽', wuxing: '水', meaning: '恩泽，温润宽厚', strokes: 8, score: 93 },
    { char: '轩', wuxing: '土', meaning: '气宇轩昂', strokes: 7, score: 92 },
    { char: '辰', wuxing: '土', meaning: '星辰，光明璀璨', strokes: 7, score: 94 },
    { char: '铭', wuxing: '金', meaning: '铭记，聪慧过人', strokes: 11, score: 90 },
    { char: '睿', wuxing: '金', meaning: '睿智，深谋远虑', strokes: 14, score: 96 },
    { char: '博', wuxing: '水', meaning: '博学，学识渊博', strokes: 12, score: 91 },
    { char: '昊', wuxing: '火', meaning: '昊天，广阔天空', strokes: 8, score: 93 },
    { char: '哲', wuxing: '火', meaning: '哲学，明理通达', strokes: 10, score: 89 },
    { char: '毅', wuxing: '木', meaning: '毅力，坚韧不拔', strokes: 15, score: 88 },
    { char: '霖', wuxing: '水', meaning: '甘霖，恩泽广被', strokes: 16, score: 90 },
    { char: '熙', wuxing: '水', meaning: '光明，兴盛和乐', strokes: 13, score: 92 },
    { char: '煜', wuxing: '火', meaning: '照耀，光辉灿烂', strokes: 13, score: 89 },
    { char: '航', wuxing: '水', meaning: '远航，志向远大', strokes: 10, score: 87 },
    { char: '瑞', wuxing: '金', meaning: '祥瑞，吉祥如意', strokes: 13, score: 91 },
    { char: '璟', wuxing: '火', meaning: '玉的光彩，温润如玉', strokes: 17, score: 94 },
    { char: '谦', wuxing: '木', meaning: '谦虚，品德高尚', strokes: 17, score: 88 },
    { char: '朗', wuxing: '火', meaning: '开朗，阳光活泼', strokes: 10, score: 86 },
    { char: '楷', wuxing: '木', meaning: '楷模，品学兼优', strokes: 13, score: 90 },
    { char: '泓', wuxing: '水', meaning: '水深而广，胸怀宽广', strokes: 8, score: 89 }
  ],
  girl: [
    { char: '涵', wuxing: '水', meaning: '内涵，有修养', strokes: 11, score: 95 },
    { char: '萱', wuxing: '木', meaning: '忘忧草，快乐无忧', strokes: 12, score: 93 },
    { char: '琪', wuxing: '木', meaning: '美玉，珍贵美好', strokes: 12, score: 92 },
    { char: '瑶', wuxing: '火', meaning: '美玉，高贵典雅', strokes: 14, score: 94 },
    { char: '悦', wuxing: '金', meaning: '喜悦，开心快乐', strokes: 10, score: 90 },
    { char: '诗', wuxing: '金', meaning: '诗意，富有才情', strokes: 8, score: 91 },
    { char: '雅', wuxing: '木', meaning: '优雅，端庄大方', strokes: 12, score: 93 },
    { char: '婉', wuxing: '土', meaning: '温婉，温柔美好', strokes: 11, score: 92 },
    { char: '晴', wuxing: '火', meaning: '晴天，明朗开朗', strokes: 12, score: 89 },
    { char: '欣', wuxing: '木', meaning: '欣喜，充满活力', strokes: 8, score: 88 },
    { char: '琳', wuxing: '木', meaning: '琳琅，美好珍贵', strokes: 12, score: 91 },
    { char: '怡', wuxing: '土', meaning: '愉悦，心旷神怡', strokes: 8, score: 87 },
    { char: '彤', wuxing: '火', meaning: '红彤彤，喜气洋洋', strokes: 7, score: 86 },
    { char: '昕', wuxing: '火', meaning: '黎明，希望之光', strokes: 8, score: 90 },
    { char: '蔓', wuxing: '木', meaning: '蔓延，生机勃勃', strokes: 14, score: 85 },
    { char: '岚', wuxing: '土', meaning: '山间雾气，淡雅清新', strokes: 7, score: 89 },
    { char: '璇', wuxing: '火', meaning: '美玉，温润', strokes: 15, score: 92 },
    { char: '雪', wuxing: '水', meaning: '洁白纯净', strokes: 11, score: 90 },
    { char: '妍', wuxing: '水', meaning: '美丽，娇艳', strokes: 7, score: 88 },
    { char: '颖', wuxing: '木', meaning: '聪颖，才华出众', strokes: 13, score: 93 }
  ],
  neutral: [
    { char: '安', wuxing: '土', meaning: '平安，安稳', strokes: 6, score: 88 },
    { char: '文', wuxing: '水', meaning: '文采，文化', strokes: 4, score: 90 },
    { char: '晨', wuxing: '火', meaning: '早晨，朝气蓬勃', strokes: 11, score: 89 },
    { char: '宁', wuxing: '火', meaning: '安宁，宁静致远', strokes: 5, score: 87 },
    { char: '远', wuxing: '土', meaning: '远大，志向高远', strokes: 7, score: 86 }
  ]
}

export const wuxingMap = {
  '金': ['铭', '瑞', '悦', '诗', '锦', '钧', '钦', '钰'],
  '木': ['毅', '谦', '楷', '萱', '琪', '雅', '欣', '琳', '颖', '蔓'],
  '水': ['泽', '博', '霖', '熙', '航', '涵', '雪', '妍', '文', '泓'],
  '火': ['昊', '哲', '煜', '璟', '朗', '瑶', '晴', '彤', '昕', '璇', '晨', '宁'],
  '土': ['宇', '轩', '辰', '婉', '怡', '岚', '安', '远']
}
