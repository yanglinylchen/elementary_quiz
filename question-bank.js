function makeQuestion(tag, q, answer, options = [], image = null) {
  const question = { tag, q, answer: String(answer), options: options.map(String) };
  if (image) {
    question.image = image;
  }
  return question;
}

function emojiImage(symbol, count) {
  return { type: "emoji", symbol, count };
}

function shapeImage(shape, count) {
  return { type: "shapes", shape, count };
}

function tenFrameImage(filled) {
  return { type: "tenFrame", filled };
}

function coinsImage(coins) {
  return { type: "coins", coins };
}

function sceneImage(scene) {
  return { type: "scene", scene };
}

function uniqueByQuestion(questions) {
  const seen = new Set();
  return questions.filter((question) => {
    if (seen.has(question.q)) {
      return false;
    }
    seen.add(question.q);
    return true;
  });
}

function padTo100(questions, builders) {
  const bank = uniqueByQuestion(questions);
  let cursor = 0;
  while (bank.length < 100 && cursor < 1000) {
    const next = builders[cursor % builders.length](bank.length, cursor);
    if (!bank.some((question) => question.q === next.q)) {
      bank.push(next);
    } else {
      bank.push({ ...next, q: `${next.q}（練習 ${cursor + 1}）` });
    }
    cursor += 1;
  }
  if (bank.length < 100) {
    throw new Error("題庫產生失敗：無法補足 100 題");
  }
  return bank.slice(0, 100);
}

function numberOptions(answer, spread = 3) {
  const choices = new Set([answer]);
  for (let offset = 1; choices.size < 4; offset += 1) {
    choices.add(Math.max(0, answer - offset));
    choices.add(answer + offset + spread);
  }
  return [...choices].slice(0, 4).map(String);
}

function itemOptions(answer, unit) {
  const value = Number.parseInt(answer, 10);
  return numberOptions(value).map((option) => `${option} ${unit}`);
}

function mathG1Questions() {
  const questions = [
    makeQuestion("看圖數數", "圖上有幾個蘋果？", "5", numberOptions(5), emojiImage("🍎", 5)),
    makeQuestion("看圖數數", "圖上有幾顆球？", "4", numberOptions(4), emojiImage("⚽", 4)),
    makeQuestion("看圖數數", "圖上有幾顆星星？", "7", numberOptions(7), emojiImage("⭐", 7)),
    makeQuestion("看圖數數", "圖上有幾個三角形？", "6", numberOptions(6), shapeImage("triangle", 6)),
    makeQuestion("看圖數數", "圖上有幾個圓形？", "8", numberOptions(8), shapeImage("circle", 8)),
    makeQuestion("看圖數數", "圖上有幾個正方形？", "5", numberOptions(5), shapeImage("square", 5)),
    makeQuestion("十格板", "十格板中有幾格被塗色？", "6", numberOptions(6), tenFrameImage(6)),
    makeQuestion("十格板", "十格板中有幾格沒有塗色？", "3", numberOptions(3), tenFrameImage(7)),
    makeQuestion("看圖算錢", "圖上的錢幣合起來是多少元？", "12 元", itemOptions(12, "元"), coinsImage([10, 1, 1])),
    makeQuestion("看圖算錢", "圖上的錢幣合起來是多少元？（第 2 題）", "15 元", itemOptions(15, "元"), coinsImage([10, 5])),
    makeQuestion("形狀", "下列哪一個圖形的邊剛好是 3 個？", "三角形", ["三角形", "正方形", "長方形", "圓形"]),
    makeQuestion("形狀", "下列哪一個圖形沒有角？", "圓形", ["三角形", "正方形", "圓形", "長方形"]),
    makeQuestion("長短", "鉛筆比橡皮擦長，橡皮擦比尺短。誰最長？", "尺", ["鉛筆", "橡皮擦", "尺", "無法知道"]),
    makeQuestion("分類", "下列哪一組都是數字？", "1、3、5", ["1、3、5", "大、小、多", "紅、黃、藍", "貓、狗、鳥"]),
    makeQuestion("比較", "哪一個算式的答案比較大？", "4 + 4", ["2 + 3", "4 + 4", "1 + 5", "7 - 2"]),
    makeQuestion("位置", "排隊時，小明前面有 2 人，後面有 4 人，這一排共有幾人？", "7 人", itemOptions(7, "人")),
    makeQuestion("時間", "鐘面長針指向 12，短針指向 3，是幾點？", "3 點", ["12 點", "2 點", "3 點", "6 點"])
  ];

  for (let a = 1; a <= 9; a += 1) {
    for (let b = 1; b <= 9; b += 1) {
      if (a + b <= 20) {
        questions.push(makeQuestion(a + b <= 10 ? "10 以內加法" : "20 以內加法", `${a} + ${b} =？`, a + b, numberOptions(a + b)));
      }
    }
  }

  for (let a = 4; a <= 20; a += 1) {
    for (let b = 1; b < a; b += 1) {
      if (a - b <= 12) {
        questions.push(makeQuestion(a <= 10 ? "10 以內減法" : "20 以內減法", `${a} - ${b} =？`, a - b, numberOptions(a - b)));
      }
    }
  }

  const storyItems = [
    ["蘋果", "顆"], ["貼紙", "張"], ["積木", "塊"], ["鉛筆", "枝"], ["糖果", "顆"], ["球", "顆"]
  ];
  storyItems.forEach(([item, unit], index) => {
    const start = 5 + index;
    const more = 2 + (index % 4);
    const less = 1 + (index % 3);
    questions.push(makeQuestion("應用題", `小安有 ${start} ${unit}${item}，媽媽又給他 ${more} ${unit}，現在共有幾${unit}？`, `${start + more} ${unit}`, itemOptions(start + more, unit)));
    questions.push(makeQuestion("應用題", `小美有 ${start + more} ${unit}${item}，送給朋友 ${less} ${unit}，還剩幾${unit}？`, `${start + more - less} ${unit}`, itemOptions(start + more - less, unit)));
  });

  const choiceBuilders = [
    (index) => {
      const values = [index % 10, (index + 3) % 10, (index + 6) % 10, (index + 8) % 10].map((n) => n + 1);
      return makeQuestion("比較大小", `下列哪一個數最大？（第 ${index + 1} 組）`, Math.max(...values), values);
    },
    (index) => {
      const values = [index % 9, (index + 2) % 9, (index + 5) % 9, (index + 7) % 9].map((n) => n + 1);
      return makeQuestion("比較大小", `下列哪一個數最小？（第 ${index + 1} 組）`, Math.min(...values), values);
    },
    (index) => {
      const start = (index % 12) + 3;
      return makeQuestion("順序", `${start} 的後一個數是多少？`, start + 1, numberOptions(start + 1));
    },
    (index) => {
      const start = (index % 12) + 4;
      return makeQuestion("順序", `${start} 的前一個數是多少？`, start - 1, numberOptions(start - 1));
    }
  ];

  return padTo100(questions, choiceBuilders);
}

function mathG2Questions() {
  const questions = [
    makeQuestion("看圖乘法", "圖上有 3 盤蘋果，每盤 4 個，共有幾個蘋果？", "12 個", itemOptions(12, "個"), { type: "groups", symbol: "🍎", groups: [4, 4, 4] }),
    makeQuestion("看圖乘法", "圖上有 4 盒星星，每盒 3 顆，共有幾顆星星？", "12 顆", itemOptions(12, "顆"), { type: "groups", symbol: "⭐", groups: [3, 3, 3, 3] }),
    makeQuestion("看圖平分", "圖上有 12 顆糖，平均分成 3 組，每組幾顆？", "4 顆", itemOptions(4, "顆"), { type: "groups", symbol: "🍬", groups: [4, 4, 4] }),
    makeQuestion("看圖數數", "圖上有幾個長方形？", "6 個", itemOptions(6, "個"), shapeImage("rectangle", 6)),
    makeQuestion("看圖數數", "圖上有幾個圓形？", "9 個", itemOptions(9, "個"), shapeImage("circle", 9)),
    makeQuestion("十格板", "十格板中有幾格被塗色？", "8", numberOptions(8), tenFrameImage(8)),
    makeQuestion("十格板", "十格板中還差幾格才滿 10 格？", "2", numberOptions(2), tenFrameImage(8)),
    makeQuestion("看圖算錢", "圖上的錢幣合起來是多少元？", "27 元", itemOptions(27, "元"), coinsImage([10, 10, 5, 1, 1])),
    makeQuestion("看圖算錢", "圖上的錢幣合起來是多少元？（第 2 題）", "36 元", itemOptions(36, "元"), coinsImage([10, 10, 10, 5, 1])),
    makeQuestion("看圖加法", "左邊有 8 顆星星，右邊有 5 顆星星，共有幾顆？", "13 顆", itemOptions(13, "顆"), { type: "groups", symbol: "⭐", groups: [8, 5] }),
    makeQuestion("容量", "下列哪一個容器通常能裝最多水？", "水桶", ["湯匙", "水桶", "茶杯", "瓶蓋"]),
    makeQuestion("重量", "下列哪一個通常最重？", "一本書", ["一顆橡皮擦", "一本書", "一張紙", "一枝鉛筆"]),
    makeQuestion("位值", "68 裡面的 6 表示什麼？", "6 個十", ["6 個一", "6 個十", "8 個十", "68 個十"]),
    makeQuestion("圖形", "長方形有幾個角？", "4 個", itemOptions(4, "個")),
    makeQuestion("比較大小", "下列哪一個數最大？", "97", ["79", "97", "89", "69"])
  ];

  for (let a = 21; a <= 78; a += 3) {
    const b = 12 + (a % 9);
    questions.push(makeQuestion("二位數加法", `${a} + ${b} =？`, a + b, numberOptions(a + b)));
  }

  for (let a = 42; a <= 99; a += 3) {
    const b = 13 + (a % 12);
    questions.push(makeQuestion("二位數減法", `${a} - ${b} =？`, a - b, numberOptions(a - b)));
  }

  for (let a = 2; a <= 9; a += 1) {
    for (let b = 2; b <= 9; b += 1) {
      questions.push(makeQuestion("乘法", `${a} × ${b} =？`, a * b, numberOptions(a * b)));
    }
  }

  const wordItems = [
    ["餅乾", "片"], ["糖果", "顆"], ["鉛筆", "枝"], ["貼紙", "張"], ["雞蛋", "顆"], ["積木", "塊"]
  ];
  wordItems.forEach(([item, unit], index) => {
    const group = 2 + (index % 4);
    const each = 3 + (index % 5);
    questions.push(makeQuestion("乘法應用", `${group} 盒${item}，每盒 ${each} ${unit}，共有幾${unit}？`, `${group * each} ${unit}`, itemOptions(group * each, unit)));
    questions.push(makeQuestion("平分", `${group * each} ${unit}${item}平均分給 ${group} 人，每人幾${unit}？`, `${each} ${unit}`, itemOptions(each, unit)));
  });

  const builders = [
    (index) => {
      const start = 2 + (index % 6);
      return makeQuestion("規律", `找規律：${start}、${start + 2}、${start + 4}、${start + 6}、（　）`, start + 8, numberOptions(start + 8));
    },
    (index) => {
      const value = 40 + (index % 50);
      return makeQuestion("位值", `${value} 裡面的 ${Math.floor(value / 10)} 表示什麼？`, `${Math.floor(value / 10)} 個十`, [`${Math.floor(value / 10)} 個一`, `${Math.floor(value / 10)} 個十`, `${value % 10} 個十`, `${value} 個十`]);
    },
    (index) => {
      const values = [31 + index % 60, 28 + (index * 2) % 60, 35 + (index * 3) % 60, 25 + (index * 5) % 60];
      return makeQuestion("比較大小", `下列哪一個數最大？（第 ${index + 1} 組）`, Math.max(...values), values);
    }
  ];

  return padTo100(questions, builders);
}

function chineseG1Questions() {
  const questions = [];
  const categories = [
    ["動物", "小狗", ["小狗", "鉛筆", "書包", "桌子"]],
    ["植物", "小花", ["小花", "水壺", "椅子", "帽子"]],
    ["可以吃", "蘋果", ["蘋果", "鉛筆", "雨傘", "桌子"]],
    ["可以閱讀", "書", ["書", "山", "水", "手"]],
    ["學用品", "橡皮擦", ["橡皮擦", "香蕉", "小狗", "帽子"]]
  ];
  categories.forEach(([tag, answer, options]) => {
    questions.push(makeQuestion("詞語", `下列哪一個是${tag}？`, answer, options));
  });

  const measures = [
    ["書", "本", ["本", "隻", "朵", "條"]],
    ["花", "朵", ["朵", "本", "張", "枝"]],
    ["紙", "張", ["張", "隻", "朵", "條"]],
    ["魚", "條", ["條", "本", "張", "朵"]],
    ["鳥", "隻", ["隻", "本", "條", "張"]]
  ];
  measures.forEach(([word, answer, options]) => questions.push(makeQuestion("量詞", `一（　）${word}，括號中應填？`, answer, options)));

  const opposites = [
    ["大", "小", ["小", "多", "高", "長"]],
    ["上", "下", ["左", "右", "下", "前"]],
    ["多", "少", ["少", "大", "高", "遠"]],
    ["前", "後", ["後", "左", "右", "中"]],
    ["白", "黑", ["黑", "紅", "黃", "藍"]]
  ];
  opposites.forEach(([word, answer, options]) => questions.push(makeQuestion("反義詞", `「${word}」的相反詞是什麼？`, answer, options)));

  const readings = [
    ["小明去上學。", "小明去哪裡？", "學校", ["學校", "公園", "市場", "醫院"]],
    ["妹妹喝牛奶。", "妹妹喝什麼？", "牛奶", ["水", "果汁", "牛奶", "茶"]],
    ["爸爸拿雨傘出門。", "爸爸拿了什麼？", "雨傘", ["雨傘", "書包", "水壺", "帽子"]],
    ["哥哥在公園跑步。", "哥哥在哪裡？", "公園", ["學校", "公園", "房間", "廚房"]],
    ["媽媽買了蘋果。", "媽媽買了什麼？", "蘋果", ["蘋果", "鉛筆", "皮球", "衣服"]]
  ];
  readings.forEach(([sentence, q, answer, options]) => questions.push(makeQuestion("閱讀", `「${sentence}」${q}`, answer, options)));

  const builders = [
    (index) => {
      const words = [["早安", "早上"], ["晚安", "晚上"], ["雨天", "下雨"], ["開心", "快樂"], ["口渴", "想喝水"]];
      const [word, answer] = words[index % words.length];
      return makeQuestion("詞義", `「${word}」的意思最接近哪一個？`, answer, [answer, "很生氣", "跑很快", "睡很久"]);
    },
    (index) => {
      const choices = [
        ["我愛媽媽。", "很漂亮的", "在學校", "小小的"],
        ["弟弟在畫畫。", "很多很多", "因為天氣", "紅紅的"],
        ["老師正在說故事。", "在桌子上", "非常可愛的", "如果下雨"]
      ][index % 3];
      return makeQuestion("句子", "下列哪一句是完整句子？", choices[0], choices);
    },
    (index) => {
      const pairs = [["你叫什麼名字", "？"], ["好漂亮啊", "！"], ["我今天很開心", "。"]];
      const [sentence, answer] = pairs[index % pairs.length];
      return makeQuestion("標點", `「${sentence}」句尾最適合加什麼？`, answer, ["。", "？", "！", "、"]);
    },
    (index) => {
      const words = [["小手", "小守", "小首", "小受"], ["白雲", "白芸", "白云", "白員"], ["雨傘", "雨散", "雨閃", "雨三"]];
      return makeQuestion("字形", "下列哪一個詞語正確？", words[index % words.length][0], words[index % words.length]);
    }
  ];

  return padTo100(questions, builders);
}

function chineseG2Questions() {
  const questions = [];
  const synonyms = [
    ["漂亮", "美麗", ["美麗", "骯髒", "寒冷", "遙遠"]],
    ["立刻", "馬上", ["馬上", "慢慢", "永遠", "剛才"]],
    ["仔細", "認真", ["認真", "吵鬧", "快速", "害怕"]],
    ["快樂", "開心", ["開心", "難過", "生氣", "口渴"]],
    ["安靜", "寧靜", ["寧靜", "熱鬧", "用力", "乾淨"]]
  ];
  synonyms.forEach(([word, answer, options]) => questions.push(makeQuestion("近義詞", `「${word}」的近義詞是什麼？`, answer, options)));

  const antonyms = [
    ["乾淨", "骯髒", ["骯髒", "明亮", "整齊", "安靜"]],
    ["勇敢", "膽小", ["膽小", "快速", "明亮", "整齊"]],
    ["寒冷", "炎熱", ["炎熱", "清楚", "快樂", "安靜"]],
    ["高興", "難過", ["難過", "美麗", "用心", "仔細"]],
    ["前進", "後退", ["後退", "開始", "完成", "休息"]]
  ];
  antonyms.forEach(([word, answer, options]) => questions.push(makeQuestion("反義詞", `「${word}」的反義詞是什麼？`, answer, options)));

  const measureWords = [
    ["信", "封", ["封", "張", "條", "朵"]],
    ["魚", "條", ["條", "本", "張", "朵"]],
    ["牛", "頭", ["頭", "隻", "條", "本"]],
    ["樹", "棵", ["棵", "封", "張", "枝"]],
    ["衣服", "件", ["件", "朵", "條", "頭"]]
  ];
  measureWords.forEach(([word, answer, options]) => questions.push(makeQuestion("量詞", `一（　）${word}，括號中應填？`, answer, options)));

  const readings = [
    ["妹妹先洗手，再吃點心。", "妹妹先做什麼？", "洗手", ["洗手", "吃點心", "睡覺", "寫字"]],
    ["媽媽把熱湯放在桌上，提醒弟弟小心。", "弟弟應該注意什麼？", "湯很燙", ["湯很燙", "湯很冷", "桌子很高", "媽媽要出門"]],
    ["小華每天整理書包，所以很少忘記帶課本。", "小華為什麼很少忘記帶課本？", "每天整理書包", ["每天整理書包", "每天跑步", "每天看電視", "每天買點心"]],
    ["下雨了，爸爸請小安穿雨衣再出門。", "爸爸請小安穿什麼？", "雨衣", ["雨衣", "外套", "帽子", "球鞋"]],
    ["老師說，借書後要按時歸還。", "借書後要怎麼做？", "按時歸還", ["按時歸還", "放在地上", "送給朋友", "藏起來"]]
  ];
  readings.forEach(([sentence, q, answer, options]) => questions.push(makeQuestion("閱讀", `「${sentence}」${q}`, answer, options)));

  const builders = [
    (index) => {
      const groups = [
        ["清楚", "青楚", "晴楚", "請楚"],
        ["努力", "努立", "怒力", "奴力"],
        ["快樂", "快洛", "怏樂", "快落"],
        ["乾淨", "乾靜", "干淨", "乾靖"],
        ["操場", "澡場", "操埸", "噪場"]
      ];
      return makeQuestion("字形", "下列哪一個詞語用字正確？", groups[index % groups.length][0], groups[index % groups.length]);
    },
    (index) => {
      const items = [
        ["因為下雨，＿＿＿＿。", "所以我們帶傘出門", ["所以我們帶傘出門", "但是昨天很熱", "如果書包很重", "而且天空很藍"]],
        ["如果明天天氣好，＿＿＿＿。", "我們就去公園", ["我們就去公園", "昨天吃晚餐", "書包很紅", "所以因為下雨"]],
        ["他不但會畫畫，＿＿＿＿。", "而且會唱歌", ["而且會唱歌", "所以昨天", "但是桌子", "如果很遠"]]
      ];
      const [q, answer, options] = items[index % items.length];
      return makeQuestion("句型", q, answer, options);
    },
    (index) => {
      const items = [
        ["河", "水部（三點水）", ["水部（三點水）", "木", "口", "日"]],
        ["林", "木", ["木", "水", "火", "心"]],
        ["明", "日", ["日", "木", "水", "口"]],
        ["想", "心", ["心", "手", "足", "言"]]
      ];
      const [word, answer, options] = items[index % items.length];
      return makeQuestion("部首", `「${word}」字的部首是什麼？`, answer, options);
    },
    (index) => {
      const items = [
        ["天空中／飄著／白雲", "白雲／天空／中／飄著", "飄著／天空中／白雲", "天空／白雲／飄著／中"],
        ["小明／正在／看書", "看書／正在／小明", "正在／小明／看書", "小明／看書／正在"],
        ["妹妹／喜歡／畫畫", "畫畫／喜歡／妹妹", "喜歡／妹妹／畫畫", "妹妹／畫畫／喜歡"]
      ];
      return makeQuestion("語詞排序", "下列哪一組排列成句子最通順？", items[index % items.length][0], items[index % items.length]);
    },
    (index) => {
      const pairs = [["你今天要去圖書館嗎", "？"], ["哇，好漂亮的花", "！"], ["弟弟正在寫功課", "。"]];
      const [sentence, answer] = pairs[index % pairs.length];
      return makeQuestion("標點", `「${sentence}」句尾應加什麼？`, answer, ["？", "。", "！", "、"]);
    }
  ];

  return padTo100(questions, builders);
}

function mathStandard(question, gradeKey) {
  if (gradeKey === "g1") {
    if (/看圖數數|比較大小|順序|數數/.test(question.tag)) return ["M1-U1", 10];
    if (/錢/.test(question.tag)) return ["M1-U7", 70];
    if (/長短|長度/.test(question.tag)) return ["M1-U3", 30];
    if (/時間|幾月|幾日/.test(question.tag)) return ["M1-U6", 60];
    if (/形狀|圖形/.test(question.tag)) return ["M1-U5", 50];
    if (/分類|紀錄|記錄/.test(question.tag)) return ["M1-U9", 90];
    if (/二位數/.test(question.tag)) return ["M1-U8", 80];
    if (/減法/.test(question.tag) || /送給|還剩|飛走/.test(question.q)) return ["M1-U4", 40];
    if (/加法|應用題|位置/.test(question.tag)) return ["M1-U2", 20];
    return ["M1-U1", 10];
  }

  if (/看圖數數|位值|比較大小|百數/.test(question.tag)) return ["N-2-1", 10];
  if (/二位數|加減|看圖加法/.test(question.tag)) return ["N-2-2", 20];
  if (/乘法|看圖乘法/.test(question.tag)) return ["N-2-6", 30];
  if (/平分/.test(question.tag)) return ["N-2-7", 40];
  if (/錢/.test(question.tag)) return ["N-2-10", 50];
  if (/圖形|看圖數數/.test(question.tag)) return ["S-2-1", 60];
  if (/容量|重量/.test(question.tag)) return ["N-2-12", 70];
  if (/時間/.test(question.tag)) return ["N-2-13", 80];
  if (/規律/.test(question.tag)) return ["R-2-1", 90];
  return ["N-2-1", 95];
}

function chineseStandard(question, gradeKey) {
  const base = gradeKey === "g1" ? 0 : 100;
  if (/字形|字義|部首|國字/.test(question.tag)) return ["Ab-I-1", base + 10];
  if (/詞語|詞義|近義詞|反義詞|量詞|生活語詞|成語|詞性|錯別字/.test(question.tag)) return ["Ab-I-5", base + 20];
  if (/句子|句型|排序|語詞排序|造句|關聯詞|標點/.test(question.tag)) return ["Ac-I-2", base + 30];
  if (/閱讀/.test(question.tag)) return ["Ad-I-2", base + 40];
  if (/修辭/.test(question.tag)) return ["Ac-I-3", base + 50];
  return ["Ab-I-5", base + 90];
}

function applyStandards(bank) {
  Object.entries(bank).forEach(([subjectKey, subject]) => {
    Object.entries(subject.grades).forEach(([gradeKey, grade]) => {
      grade.questions = grade.questions.map((question, index) => {
        const [standard, baseSequence] = subjectKey === "math"
          ? mathStandard(question, gradeKey)
          : chineseStandard(question, gradeKey);
        return {
          ...question,
          standard,
          sequence: baseSequence * 1000 + index
        };
      });
    });
  });
  return bank;
}

const curriculumTargets = {
  math: {
    g1: ["M1-U1", "M1-U2", "M1-U3", "M1-U4", "M1-U5", "M1-U6", "M1-U7", "M1-U8", "M1-U9"],
    g2: ["N-2-1", "N-2-2", "N-2-6", "N-2-7", "N-2-10", "N-2-12", "N-2-13", "S-2-1", "R-2-1"]
  },
  chinese: {
    g1: ["Ab-I-1", "Ab-I-5", "Ac-I-2", "Ad-I-2"],
    g2: ["Ab-I-1", "Ab-I-5", "Ac-I-2", "Ad-I-2"]
  }
};

function padCurriculumStandards(bank) {
  Object.entries(curriculumTargets).forEach(([subjectKey, grades]) => {
    Object.entries(grades).forEach(([gradeKey, standards]) => {
      const grade = bank[subjectKey].grades[gradeKey];
      standards.forEach((standard, standardIndex) => {
        let cursor = 0;
        while (grade.questions.filter((question) => question.standard === standard).length < 100 && cursor < 500) {
          const next = buildSupplementQuestion(subjectKey, gradeKey, standard, cursor);
          const duplicate = grade.questions.some((question) => question.q === next.q);
          if (!duplicate) {
            grade.questions.push({
              ...next,
              standard,
              sequence: (standardIndex + 1) * 100000 + cursor
            });
          }
          cursor += 1;
        }
      });
      standards.forEach((standard, standardIndex) => {
        let localIndex = 0;
        grade.questions = grade.questions.map((question) => {
          if (question.standard !== standard) {
            return question;
          }
          const next = {
            ...question,
            sequence: (standardIndex + 1) * 100000 + localIndex
          };
          localIndex += 1;
          return next;
        });
      });
      grade.questions.sort((a, b) => a.sequence - b.sequence);
    });
  });
  return bank;
}

function removeAmbiguousShapeChoices(bank) {
  Object.values(bank).forEach((subject) => {
    Object.values(subject.grades).forEach((grade) => {
      grade.questions = grade.questions.map((question) => {
        const hasSquareAndRectangle = question.options?.includes("正方形") && question.options?.includes("長方形");
        let nextQuestion = question;
        if (/有 3 個邊|有3個邊|有三個邊/.test(nextQuestion.q)) {
          nextQuestion = {
            ...nextQuestion,
            q: nextQuestion.q
              .replace(/有 3 個邊/g, "的邊剛好是 3 個")
              .replace(/有3個邊/g, "的邊剛好是 3 個")
              .replace(/有三個邊/g, "的邊剛好是三個")
          };
        }
        if (/有 4 個一樣長的邊|有4個一樣長的邊|有四個一樣長的邊/.test(nextQuestion.q)) {
          nextQuestion = {
            ...nextQuestion,
            q: nextQuestion.q
              .replace(/有 4 個一樣長的邊/g, "的 4 個邊都一樣長")
              .replace(/有4個一樣長的邊/g, "的 4 個邊都一樣長")
              .replace(/有四個一樣長的邊/g, "的四個邊都一樣長")
          };
        }
        if (hasSquareAndRectangle && /4 個角|四個角|4個角/.test(nextQuestion.q)) {
          return {
            ...nextQuestion,
            q: nextQuestion.answer === "正方形"
              ? nextQuestion.q.replace(/4 個角|四個角|4個角/g, "4 個一樣大的角，且 4 個邊一樣長")
              : nextQuestion.q.replace(/4 個角|四個角|4個角/g, "4 個一樣大的角，且通常有 2 條長邊和 2 條短邊")
          };
        }
        return nextQuestion;
      });
    });
  });
  return bank;
}

function buildSupplementQuestion(subjectKey, gradeKey, standard, index) {
  if (subjectKey === "math") {
    return buildMathQuestion(gradeKey, standard, index);
  }
  return buildChineseQuestion(gradeKey, standard, index);
}

function buildMathQuestion(gradeKey, standard, index) {
  const n = index + 1;
  const a = (index % 9) + 1;
  const b = ((index * 2) % 9) + 1;
  const c = ((index * 3) % 9) + 1;

  if (standard === "M1-U1") {
    const value = (index % 99) + 1;
    if (index % 4 === 0) return makeQuestion("數到100", `從 ${a} 往後數 ${b} 個數，會數到哪一個？（練習 ${n}）`, a + b, numberOptions(a + b));
    if (index % 4 === 1) return makeQuestion("數到100", `下列哪一個數最大？（練習 ${n}）`, Math.max(value, value + 3, value + 8, value + 1), [value, value + 3, value + 8, value + 1]);
    if (index % 4 === 2) return makeQuestion("數到100", `${value} 的後一個數是多少？（練習 ${n}）`, value + 1, numberOptions(value + 1));
    return makeQuestion("看圖數數", `圖上有幾個蘋果？（練習 ${n}）`, a, numberOptions(a), emojiImage("🍎", a));
  }

  if (standard === "M1-U2") {
    const x = (index % 9) + 1;
    const y = ((index * 2) % 9) + 1;
    if (index % 2 === 0) return makeQuestion("18以內的加法", `${x} + ${y} =？（練習 ${n}）`, x + y, numberOptions(x + y));
    return makeQuestion("18以內的加法", `小安有 ${x} 顆糖，媽媽又給他 ${y} 顆，現在共有幾顆？（練習 ${n}）`, `${x + y} 顆`, itemOptions(x + y, "顆"));
  }

  if (standard === "M1-U3") {
    const items = [["鉛筆", "尺", "橡皮擦"], ["繩子", "吸管", "牙籤"], ["桌子", "椅子", "書本"]];
    const [longest, middle, shortest] = items[index % items.length];
    return makeQuestion("長度", `${longest}比${middle}長，${middle}比${shortest}長。誰最長？（練習 ${n}）`, longest, [longest, middle, shortest, "無法知道"]);
  }

  if (standard === "M1-U4") {
    const x = (index % 9) + 1;
    const y = ((index * 2) % 8) + 1;
    if (index % 2 === 0) return makeQuestion("18以內的減法", `${x + y} - ${y} =？（練習 ${n}）`, x, numberOptions(x));
    return makeQuestion("18以內的減法", `小美有 ${x + y} 張貼紙，送給朋友 ${y} 張，還剩幾張？（練習 ${n}）`, `${x} 張`, itemOptions(x, "張"));
  }

  if (standard === "M1-U5") {
    const prompts = [
      ["下列哪一個圖形的邊剛好是 3 個？", "三角形", ["三角形", "正方形", "圓形", "橢圓形"]],
      ["下列哪一個圖形沒有角？", "圓形", ["圓形", "三角形", "正方形", "長方形"]],
      ["下列哪一個圖形的 4 個邊都一樣長？", "正方形", ["正方形", "長方形", "三角形", "圓形"]],
      ["下列哪一個圖形通常有 2 條長邊和 2 條短邊？", "長方形", ["長方形", "正方形", "三角形", "圓形"]]
    ];
    const [q, answer, options] = prompts[index % prompts.length];
    return makeQuestion("圖形和形體", `${q}（練習 ${n}）`, answer, options);
  }

  if (standard === "M1-U6") {
    const month = (index % 12) + 1;
    const day = (index % 28) + 1;
    if (index % 2 === 0) return makeQuestion("幾月幾日", `${month} 月 ${day} 日的後一天是幾月幾日？（練習 ${n}）`, `${month} 月 ${day + 1} 日`, [`${month} 月 ${day + 1} 日`, `${month} 月 ${day} 日`, `${month} 月 ${Math.max(1, day - 1)} 日`, `${month === 12 ? 1 : month + 1} 月 ${day} 日`]);
    return makeQuestion("幾月幾日", `一年有幾個月？（練習 ${n}）`, "12 個月", ["10 個月", "11 個月", "12 個月", "13 個月"]);
  }

  if (standard === "M1-U7") {
    const sums = [[1, 1, 5], [10, 1, 1], [10, 5], [50, 10, 1], [10, 10, 5]];
    const coins = sums[index % sums.length];
    const total = coins.reduce((sum, coin) => sum + coin, 0);
    return makeQuestion("錢幣", `圖上的錢幣合起來是多少元？（練習 ${n}）`, `${total} 元`, itemOptions(total, "元"), coinsImage(coins));
  }

  if (standard === "M1-U8") {
    const x = 20 + (index % 60);
    const y = 10 + ((index * 3) % 20);
    if (index % 2 === 0) return makeQuestion("二位數的加減", `${x} + ${y} =？（練習 ${n}）`, x + y, numberOptions(x + y));
    return makeQuestion("二位數的加減", `${x + y} - ${y} =？（練習 ${n}）`, x, numberOptions(x));
  }

  if (standard === "M1-U9") {
    const apples = (index % 5) + 2;
    const bananas = ((index * 2) % 5) + 1;
    const grapes = ((index * 3) % 5) + 1;
    const max = Math.max(apples, bananas, grapes);
    const answer = max === apples ? "蘋果" : max === bananas ? "香蕉" : "葡萄";
    return makeQuestion("做紀錄", `小安記錄水果數量：蘋果 ${apples} 個、香蕉 ${bananas} 根、葡萄 ${grapes} 串。哪一種最多？（練習 ${n}）`, answer, ["蘋果", "香蕉", "葡萄", "一樣多"]);
  }

  if (standard === "N-1-1") {
    const value = (index % 99) + 1;
    if (index % 4 === 0) return makeQuestion("數數", `從 ${a} 往後數 ${b} 個數，會數到哪一個？（練習 ${n}）`, a + b, numberOptions(a + b));
    if (index % 4 === 1) return makeQuestion("比較大小", `下列哪一個數最大？（練習 ${n}）`, Math.max(value, value + 3, value + 8, value + 1), [value, value + 3, value + 8, value + 1]);
    if (index % 4 === 2) return makeQuestion("順序", `${value} 的後一個數是多少？`, value + 1, numberOptions(value + 1));
    return makeQuestion("看圖數數", `圖上有幾個蘋果？（練習 ${n}）`, a, numberOptions(a), emojiImage("🍎", a));
  }

  if (standard === "N-1-2") {
    if (index % 2 === 0) return makeQuestion("加法和減法", `小安有 ${a + 3} 顆糖，媽媽又給他 ${b} 顆，現在共有幾顆？（練習 ${n}）`, `${a + b + 3} 顆`, itemOptions(a + b + 3, "顆"));
    return makeQuestion("加法和減法", `小美有 ${a + b + 5} 張貼紙，送給朋友 ${b} 張，還剩幾張？（練習 ${n}）`, `${a + 5} 張`, itemOptions(a + 5, "張"));
  }

  if (standard === "N-1-3") {
    if (index % 2 === 0) return makeQuestion("基本加法", `${a} + ${b} =？（練習 ${n}）`, a + b, numberOptions(a + b));
    return makeQuestion("基本減法", `${a + b} - ${b} =？（練習 ${n}）`, a, numberOptions(a));
  }

  if (standard === "N-1-4") {
    const sums = [[1, 1, 5], [10, 1, 1], [10, 5], [50, 10, 1], [10, 10, 5]];
    const coins = sums[index % sums.length];
    const total = coins.reduce((sum, coin) => sum + coin, 0);
    return makeQuestion("錢幣", `圖上的錢幣合起來是多少元？（練習 ${n}）`, `${total} 元`, itemOptions(total, "元"), coinsImage(coins));
  }

  if (standard === "N-1-6") {
    const hour = (index % 12) + 1;
    const period = ["上午", "中午", "下午", "晚上"][index % 4];
    return makeQuestion("時間", `現在是${period} ${hour} 點，再過 1 小時是幾點？（練習 ${n}）`, `${period} ${hour === 12 ? 1 : hour + 1} 點`, [`${period} ${hour === 12 ? 1 : hour + 1} 點`, `${period} ${hour} 點`, `${period} ${Math.max(1, hour - 1)} 點`, `${period} ${((hour + 2 - 1) % 12) + 1} 點`]);
  }

  if (standard === "S-1-1") {
    const items = [["鉛筆", "尺", "橡皮擦"], ["繩子", "吸管", "牙籤"], ["桌子", "椅子", "書本"]];
    const [longest, middle, shortest] = items[index % items.length];
    return makeQuestion("長度比較", `${longest}比${middle}長，${middle}比${shortest}長。誰最長？（練習 ${n}）`, longest, [longest, middle, shortest, "無法知道"]);
  }

  if (standard === "S-1-2") {
    const prompts = [
      ["下列哪一個圖形的邊剛好是 3 個？", "三角形", ["三角形", "正方形", "圓形", "橢圓形"]],
      ["下列哪一個圖形沒有角？", "圓形", ["圓形", "三角形", "正方形", "長方形"]],
      ["下列哪一個圖形的 4 個邊都一樣長？", "正方形", ["正方形", "長方形", "三角形", "圓形"]],
      ["下列哪一個圖形通常有 2 條長邊和 2 條短邊？", "長方形", ["長方形", "正方形", "三角形", "圓形"]]
    ];
    const [q, answer, options] = prompts[index % prompts.length];
    return makeQuestion("常見形體", `${q}（練習 ${n}）`, answer, options);
  }

  if (standard === "D-1-1") {
    const groups = [
      ["都是水果", "蘋果、香蕉、葡萄", ["蘋果、香蕉、葡萄", "鉛筆、尺、橡皮擦", "紅、黃、藍", "貓、狗、鳥"]],
      ["都是文具", "鉛筆、尺、橡皮擦", ["蘋果、香蕉、葡萄", "鉛筆、尺、橡皮擦", "紅、黃、藍", "貓、狗、鳥"]],
      ["都是顏色", "紅、黃、藍", ["蘋果、香蕉、葡萄", "鉛筆、尺、橡皮擦", "紅、黃、藍", "貓、狗、鳥"]]
    ];
    const [clue, answer, options] = groups[index % groups.length];
    return makeQuestion("簡單分類", `下列哪一組${clue}？（練習 ${n}）`, answer, options);
  }

  const x = 20 + (index % 70);
  const y = 10 + (index % 20);
  if (standard === "N-2-1") return makeQuestion("一千以內的數", `${100 + x} 裡面的 ${Math.floor((100 + x) / 100)} 表示什麼？（練習 ${n}）`, "1 個百", ["1 個百", "1 個十", `${x} 個一`, `${100 + x} 個百`]);
  if (standard === "N-2-2") return index % 2 === 0 ? makeQuestion("加減計算", `${x} + ${y} =？（練習 ${n}）`, x + y, numberOptions(x + y)) : makeQuestion("加減計算", `${x + y} - ${y} =？（練習 ${n}）`, x, numberOptions(x));
  if (standard === "N-2-6") return makeQuestion("乘法", `${(index % 8) + 2} × ${((index + 3) % 8) + 2} =？（練習 ${n}）`, ((index % 8) + 2) * (((index + 3) % 8) + 2), numberOptions(((index % 8) + 2) * (((index + 3) % 8) + 2)));
  if (standard === "N-2-7") return makeQuestion("平分與分裝", `${a * b} 顆糖平均分給 ${a} 人，每人幾顆？（練習 ${n}）`, `${b} 顆`, itemOptions(b, "顆"));
  if (standard === "N-2-10") {
    const coinSets = [[10, 10, 5, 1], [50, 10, 5], [10, 10, 10, 5, 1], [50, 10, 10, 1, 1], [10, 5, 5, 1, 1]];
    const coins = coinSets[index % coinSets.length];
    const total = coins.reduce((sum, coin) => sum + coin, 0);
    return makeQuestion("錢幣應用", `圖上的錢幣合起來是多少元？（練習 ${n}）`, `${total} 元`, itemOptions(total, "元"), coinsImage(coins));
  }
  if (standard === "N-2-12") return makeQuestion("容量重量", `下列哪一個通常最重？（練習 ${n}）`, "一本書", ["一張紙", "一本書", "一枝鉛筆", "一顆橡皮擦"]);
  if (standard === "N-2-13") return makeQuestion("時間", `上午 ${a} 點再過 ${b % 3 + 1} 小時，是幾點？（練習 ${n}）`, `上午 ${a + (b % 3 + 1)} 點`, [`上午 ${a + (b % 3 + 1)} 點`, `上午 ${a} 點`, `上午 ${a + 1} 點`, `下午 ${a} 點`]);
  if (standard === "S-2-1") return makeQuestion("平面圖形", `圖上有幾個長方形？（練習 ${n}）`, `${a} 個`, itemOptions(a, "個"), shapeImage("rectangle", a));
  return makeQuestion("規律", `找規律：${a}、${a + c}、${a + c * 2}、${a + c * 3}、（　）（練習 ${n}）`, a + c * 4, numberOptions(a + c * 4));
}

function buildChineseQuestion(gradeKey, standard, index) {
  const n = index + 1;
  const wordSets = {
    "Ab-I-1": [["清楚", "青楚", "晴楚", "請楚"], ["努力", "努立", "怒力", "奴力"], ["白雲", "白芸", "白云", "白員"], ["雨傘", "雨散", "雨閃", "雨三"]],
    "Ab-I-5": [["漂亮", "美麗", "骯髒", "寒冷"], ["立刻", "馬上", "慢慢", "剛才"], ["乾淨", "骯髒", "明亮", "整齊"], ["開心", "快樂", "生氣", "害怕"]]
  };

  if (standard === "Ab-I-1") {
    const options = wordSets["Ab-I-1"][index % wordSets["Ab-I-1"].length];
    return makeQuestion("字形", `下列哪一個詞語用字正確？（練習 ${n}）`, options[0], options);
  }

  if (standard === "Ab-I-5") {
    const [word, answer, wrong1, wrong2] = wordSets["Ab-I-5"][index % wordSets["Ab-I-5"].length];
    const prompt = index % 2 === 0 ? `「${word}」的意思最接近哪一個？` : `下列哪一個詞語可以和「${word}」配成意思相近的詞？`;
    return makeQuestion("常用語詞", `${prompt}（練習 ${n}）`, answer, [answer, wrong1, wrong2, "口渴"]);
  }

  if (standard === "Ac-I-2") {
    const patterns = [
      ["因為下雨，＿＿＿＿。", "所以我們帶傘出門", ["所以我們帶傘出門", "但是昨天很熱", "如果書包很重", "而且天空很藍"]],
      ["如果明天天氣好，＿＿＿＿。", "我們就去公園", ["我們就去公園", "昨天吃晚餐", "書包很紅", "所以因為下雨"]],
      ["下列哪一句是完整句子？", "小明正在看書。", ["小明正在看書。", "在公園裡", "很多漂亮的", "因為早上"]]
    ];
    const [q, answer, options] = patterns[index % patterns.length];
    return makeQuestion("句子與段落", `${q}（練習 ${n}）`, answer, options);
  }

  const readings = [
    ["妹妹先洗手，再吃點心。", "妹妹先做什麼？", "洗手", ["洗手", "吃點心", "睡覺", "寫字"]],
    ["爸爸拿雨傘出門。", "爸爸拿了什麼？", "雨傘", ["雨傘", "書包", "水壺", "帽子"]],
    ["小華每天整理書包，所以很少忘記帶課本。", "小華為什麼很少忘記帶課本？", "每天整理書包", ["每天整理書包", "每天跑步", "每天看電視", "每天買點心"]],
    ["老師說，借書後要按時歸還。", "借書後要怎麼做？", "按時歸還", ["按時歸還", "放在地上", "送給朋友", "藏起來"]]
  ];
  const [sentence, q, answer, options] = readings[index % readings.length];
  return makeQuestion("篇章閱讀", `「${sentence}」${q}（練習 ${n}）`, answer, options);
}

const baseQuestionBank = applyStandards({
  math: {
    name: "數學",
    grades: {
      g1: { name: "一年級", questions: mathG1Questions() },
      g2: { name: "二年級", questions: mathG2Questions() }
    }
  },
  chinese: {
    name: "國語",
    grades: {
      g1: { name: "一年級", questions: chineseG1Questions() },
      g2: { name: "二年級", questions: chineseG2Questions() }
    }
  }
});

window.questionBank = removeAmbiguousShapeChoices(padCurriculumStandards(baseQuestionBank));
