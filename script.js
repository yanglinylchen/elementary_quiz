const QUESTION_COUNT = 20;
const HISTORY_KEY = "elementaryQuizHistory.v1";

const questionBank = window.questionBank;

let currentSubject = "math";
let currentGrade = "g1";
let currentStandard = "all";
let currentQuestions = [];
let currentAttemptId = "";
let submitted = false;

const quizForm = document.querySelector("#quizForm");
const template = document.querySelector("#questionTemplate");
const scoreText = document.querySelector("#scoreText");
const subjectName = document.querySelector("#subjectName");
const gradeName = document.querySelector("#gradeName");
const answeredCount = document.querySelector("#answeredCount");
const standardName = document.querySelector("#standardName");
const questionCountText = document.querySelector("#questionCountText");
const subjectButtons = document.querySelectorAll(".subject-button");
const gradeButtons = document.querySelectorAll(".grade-button");
const standardSelect = document.querySelector("#standardSelect");
const refreshBtn = document.querySelector("#refreshBtn");
const submitBtn = document.querySelector("#submitBtn");
const resetBtn = document.querySelector("#resetBtn");
const resultPanel = document.querySelector("#resultPanel");
const resultText = document.querySelector("#resultText");
const historyStats = document.querySelector("#historyStats");
const historyList = document.querySelector("#historyList");
const exportHistoryBtn = document.querySelector("#exportHistoryBtn");

function shuffle(items) {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function pickQuestions(subject, grade) {
  const allQuestions = questionBank[subject].grades[grade].questions;
  const questions = (currentStandard === "all"
    ? allQuestions
    : allQuestions.filter((question) => question.standard === currentStandard))
    .sort((a, b) => a.sequence - b.sequence);

  if (currentStandard !== "all") {
    return shuffle(questions)
      .slice(0, QUESTION_COUNT)
      .map((question) => ({
        ...question,
        options: question.options ? shuffle(question.options) : []
      }));
  }

  const buckets = groupByStandard(questions);
  const selected = [];

  buckets.forEach((bucket) => {
    const quota = Math.max(1, Math.round((bucket.length / questions.length) * QUESTION_COUNT));
    selected.push(...shuffle(bucket).slice(0, quota));
  });

  if (selected.length < QUESTION_COUNT) {
    const selectedSet = new Set(selected.map((question) => question.q));
    selected.push(...shuffle(questions.filter((question) => !selectedSet.has(question.q))).slice(0, QUESTION_COUNT - selected.length));
  }

  return shuffle(selected.slice(0, QUESTION_COUNT))
    .map((question) => ({
      ...question,
      options: question.options ? shuffle(question.options) : []
    }));
}

function groupByStandard(questions) {
  const groups = new Map();
  questions.forEach((question) => {
    if (!groups.has(question.standard)) {
      groups.set(question.standard, []);
    }
    groups.get(question.standard).push(question);
  });
  return [...groups.values()];
}

function renderQuiz() {
  submitted = false;
  currentAttemptId = "";
  currentQuestions = pickQuestions(currentSubject, currentGrade);
  quizForm.innerHTML = "";
  subjectName.textContent = questionBank[currentSubject].name;
  gradeName.textContent = questionBank[currentSubject].grades[currentGrade].name;
  standardName.textContent = getStandardLabel(currentStandard);
  questionCountText.textContent = `${currentQuestions.length} 題`;
  scoreText.textContent = "尚未交卷";
  resultText.textContent = "尚未交卷";
  resultPanel.hidden = true;
  answeredCount.textContent = "0 題";

  currentQuestions.forEach((question, index) => {
    const node = template.content.firstElementChild.cloneNode(true);
    node.dataset.index = String(index);
    node.querySelector(".question-number").textContent = `第 ${index + 1} 題`;
    node.querySelector(".question-tag").textContent = `${question.standard} · ${question.tag}`;
    node.querySelector(".question-title").textContent = question.q;

    if (question.image) {
      node.querySelector(".question-title").after(renderQuestionImage(question.image));
    }

    const options = node.querySelector(".options");
    if (usesTextAnswer(question)) {
      options.classList.add("answer-area");
      options.innerHTML = `
        <label class="answer-label" for="q${index}-answer">填寫答案</label>
        <input class="answer-input" type="text" name="q${index}" id="q${index}-answer" autocomplete="off" inputmode="text" placeholder="請輸入答案">
      `;
    } else {
      question.options.forEach((option, optionIndex) => {
        const id = `q${index}-option${optionIndex}`;
        const label = document.createElement("label");
        label.className = "option";
        label.innerHTML = `
          <input type="radio" name="q${index}" value="${escapeHtml(option)}" id="${id}">
          <span class="option-copy">
            <span class="option-text">${escapeHtml(option)}</span>
          </span>
        `;
        options.append(label);
      });
    }

    quizForm.append(node);
  });
}

function updateStandardOptions() {
  const standards = getAvailableStandards();
  if (currentStandard !== "all" && !standards.some((item) => item.value === currentStandard)) {
    currentStandard = "all";
  }

  standardSelect.innerHTML = [
    `<option value="all">全部課綱</option>`,
    ...standards.map((item) => `<option value="${escapeHtml(item.value)}">${escapeHtml(item.label)}</option>`)
  ].join("");
  standardSelect.value = currentStandard;
}

function getAvailableStandards() {
  const questions = questionBank[currentSubject].grades[currentGrade].questions;
  const byStandard = new Map();
  questions.forEach((question) => {
    if (!byStandard.has(question.standard)) {
      byStandard.set(question.standard, {
        value: question.standard,
        label: `${question.standard} ${standardDescriptions[question.standard] || question.standard}`,
        sequence: question.sequence
      });
    }
  });
  return [...byStandard.values()].sort((a, b) => a.sequence - b.sequence);
}

function getStandardLabel(standard) {
  if (standard === "all") {
    return "全部";
  }
  return `${standard} ${standardDescriptions[standard] || ""}`.trim();
}

function renderQuestionImage(image) {
  const frame = document.createElement("div");
  frame.className = `visual-question visual-type-${image.type}`;
  frame.setAttribute("aria-hidden", "true");

  if (image.type === "emoji") {
    for (let index = 0; index < image.count; index += 1) {
      const item = document.createElement("span");
      item.className = "visual-emoji";
      item.textContent = image.symbol;
      frame.append(item);
    }
    return frame;
  }

  if (image.type === "shapes") {
    for (let index = 0; index < image.count; index += 1) {
      const shape = document.createElement("span");
      shape.className = `visual-shape shape-${image.shape}`;
      frame.append(shape);
    }
    return frame;
  }

  if (image.type === "tenFrame") {
    for (let index = 0; index < 10; index += 1) {
      const cell = document.createElement("span");
      cell.className = index < image.filled ? "ten-cell filled" : "ten-cell";
      frame.append(cell);
    }
    return frame;
  }

  if (image.type === "coins") {
    image.coins.forEach((value) => {
      const coin = document.createElement("span");
      coin.className = "coin";
      coin.textContent = `${value}元`;
      frame.append(coin);
    });
    return frame;
  }

  if (image.type === "groups") {
    image.groups.forEach((count) => {
      const group = document.createElement("span");
      group.className = "visual-group";
      for (let index = 0; index < count; index += 1) {
        const item = document.createElement("span");
        item.className = "visual-emoji small";
        item.textContent = image.symbol;
        group.append(item);
      }
      frame.append(group);
    });
    return frame;
  }

  return frame;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function updateAnsweredCount() {
  const answered = currentQuestions.filter((_, index) => {
    const answer = getUserAnswer(index, currentQuestions[index]);
    return answer.length > 0;
  }).length;
  answeredCount.textContent = `${answered} 題`;
}

function submitQuiz() {
  submitted = true;
  let correctCount = 0;
  const wrongItems = [];

  currentQuestions.forEach((question, index) => {
    const card = quizForm.querySelector(`[data-index="${index}"]`);
    const selectedValue = getUserAnswer(index, question);
    const isCorrect = isAnswerCorrect(selectedValue, question.answer);
    const feedback = card.querySelector(".feedback");

    card.classList.toggle("correct", isCorrect);
    card.classList.toggle("incorrect", !isCorrect);

    if (usesTextAnswer(question)) {
      const answerInput = card.querySelector(".answer-input");
      answerInput.classList.toggle("right-answer", isCorrect);
      answerInput.classList.toggle("user-wrong", !isCorrect && selectedValue.length > 0);
    } else {
      card.querySelectorAll(".option").forEach((option) => {
        const input = option.querySelector("input");
        option.classList.toggle("right-answer", input.value === question.answer);
        option.classList.toggle("user-wrong", input.checked && input.value !== question.answer);
      });
    }

    if (isCorrect) {
      correctCount += 1;
      feedback.textContent = "答對了";
      feedback.className = "feedback good";
    } else {
      wrongItems.push({
        tag: question.tag,
        standard: question.standard,
        question: question.q,
        answer: question.answer,
        userAnswer: selectedValue || "未作答"
      });
      feedback.textContent = selectedValue ? `答錯了，正確答案是：${question.answer}` : `尚未作答，正確答案是：${question.answer}`;
      feedback.className = "feedback bad";
    }
  });

  const totalQuestions = currentQuestions.length || QUESTION_COUNT;
  const scoreNumber = Math.round((correctCount / totalQuestions) * 100);
  const score = `${scoreNumber} 分`;
  scoreText.textContent = score;
  resultText.textContent = score;
  resultPanel.hidden = false;
  saveAttempt(scoreNumber, correctCount, wrongItems);
  renderHistory();
  resultPanel.scrollIntoView({ behavior: "smooth", block: "center" });
}

function saveAttempt(scoreNumber, correctCount, wrongItems) {
  if (!currentAttemptId) {
    currentAttemptId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  const records = loadHistory();
  const record = {
    id: currentAttemptId,
    createdAt: new Date().toISOString(),
    subject: questionBank[currentSubject].name,
    grade: questionBank[currentSubject].grades[currentGrade].name,
    score: scoreNumber,
    correct: correctCount,
    total: currentQuestions.length,
    wrongCount: wrongItems.length,
    wrongTags: countBy(wrongItems.map((item) => item.tag)),
    wrongStandards: countBy(wrongItems.map((item) => item.standard)),
    wrongItems
  };

  const index = records.findIndex((item) => item.id === currentAttemptId);
  if (index >= 0) {
    records[index] = record;
  } else {
    records.unshift(record);
  }

  localStorage.setItem(HISTORY_KEY, JSON.stringify(records.slice(0, 200)));
}

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  } catch {
    return [];
  }
}

function countBy(items) {
  return items.reduce((result, item) => {
    result[item] = (result[item] || 0) + 1;
    return result;
  }, {});
}

function renderHistory() {
  const records = loadHistory();
  if (records.length === 0) {
    historyStats.innerHTML = `<div><span class="label">尚無紀錄</span><strong>完成一次測驗後會自動保存</strong></div>`;
    historyList.innerHTML = "";
    return;
  }

  const recent = records.slice(0, 10);
  const average = Math.round(recent.reduce((sum, record) => sum + record.score, 0) / recent.length);
  const weakTags = countBy(records.flatMap((record) => Object.keys(record.wrongTags || {})));
  const weakStandards = countBy(records.flatMap((record) => Object.keys(record.wrongStandards || {})));
  const weakList = Object.entries(weakTags)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([tag, count]) => `${tag} ${count} 次`)
    .join("、") || "暫無";
  const weakStandardList = Object.entries(weakStandards)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([standard, count]) => `${standard} ${count} 次`)
    .join("、") || "暫無";

  historyStats.innerHTML = `
    <div><span class="label">總測驗</span><strong>${records.length} 次</strong></div>
    <div><span class="label">近 10 次平均</span><strong>${average} 分</strong></div>
    <div><span class="label">常錯課綱</span><strong>${escapeHtml(weakStandardList)}</strong></div>
    <div><span class="label">常錯題型</span><strong>${escapeHtml(weakList)}</strong></div>
  `;

  historyList.innerHTML = records.slice(0, 6).map((record) => `
    <article class="history-item">
      <div>
        <strong>${record.score} 分</strong>
        <span>${escapeHtml(record.subject)} ${escapeHtml(record.grade)} · ${formatDate(record.createdAt)}</span>
      </div>
      <span>${record.correct}/${record.total}，錯 ${record.wrongCount} 題</span>
    </article>
  `).join("");
}

function formatDate(value) {
  return new Intl.DateTimeFormat("zh-Hant", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function exportHistory() {
  const records = loadHistory();
  const blob = new Blob([JSON.stringify(records, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `learning-history-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function getUserAnswer(index, question) {
  if (usesTextAnswer(question)) {
    const input = quizForm.querySelector(`input[name="q${index}"]`);
    return input ? input.value.trim() : "";
  }

  const selected = quizForm.querySelector(`input[name="q${index}"]:checked`);
  return selected ? selected.value : "";
}

function normalizeAnswer(value) {
  return String(value)
    .trim()
    .replace(/[０-９]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xfee0))
    .replace(/\s+/g, "")
    .replace(/[，。！？、；：]/g, "");
}

function isAnswerCorrect(userAnswer, correctAnswer) {
  const user = normalizeAnswer(userAnswer);
  const correct = normalizeAnswer(correctAnswer);
  if (!user) {
    return false;
  }

  if (user === correct) {
    return true;
  }

  if (currentSubject === "math") {
    const userNumber = user.match(/^\d+/)?.[0];
    const correctNumber = correct.match(/^\d+/)?.[0];
    return Boolean(userNumber && correctNumber && userNumber === correctNumber);
  }

  return false;
}

function usesTextAnswer(question) {
  if (currentSubject !== "math") {
    return false;
  }

  if (isChoiceStyleQuestion(question)) {
    return false;
  }

  const answer = normalizeAnswer(question.answer);
  return /^\d/.test(answer) && !/[+×xX*/／、]/.test(answer);
}

function isChoiceStyleQuestion(question) {
  return /下列|哪一個|哪一組|誰|哪一種|哪個/.test(question.q);
}

const standardDescriptions = {
  "N-1-1": "一百以內的數",
  "N-1-2": "加法和減法",
  "N-1-3": "基本加減法",
  "N-1-4": "錢幣",
  "N-1-6": "日常時間",
  "S-1-1": "長度比較",
  "S-1-2": "常見形體",
  "D-1-1": "簡單分類",
  "N-2-1": "一千以內的數",
  "N-2-2": "加減計算",
  "N-2-6": "乘法",
  "N-2-7": "平分與分裝",
  "N-2-10": "錢幣應用",
  "N-2-12": "容量重量",
  "N-2-13": "時間",
  "S-2-1": "平面圖形",
  "R-2-1": "規律",
  "Ab-I-1": "常用字形音義",
  "Ab-I-5": "常用語詞",
  "Ac-I-2": "句子與段落",
  "Ac-I-3": "基本表述",
  "Ad-I-2": "篇章閱讀"
};

function clearAnswers() {
  submitted = false;
  quizForm.reset();
  scoreText.textContent = "尚未交卷";
  resultText.textContent = "尚未交卷";
  resultPanel.hidden = true;
  answeredCount.textContent = "0 題";
  quizForm.querySelectorAll(".question-card").forEach((card) => {
    card.classList.remove("correct", "incorrect");
    card.querySelector(".feedback").textContent = "";
    card.querySelector(".feedback").className = "feedback";
    card.querySelectorAll(".option").forEach((option) => {
      option.classList.remove("right-answer", "user-wrong");
    });
    card.querySelectorAll(".answer-input").forEach((input) => {
      input.classList.remove("right-answer", "user-wrong");
    });
  });
}

function setActiveButton(buttons, activeButton) {
  buttons.forEach((item) => {
    const isActive = item === activeButton;
    item.classList.toggle("active", isActive);
    item.setAttribute("aria-selected", String(isActive));
  });
}

subjectButtons.forEach((button) => {
  button.addEventListener("click", () => {
    currentSubject = button.dataset.subject;
    setActiveButton(subjectButtons, button);
    updateStandardOptions();
    renderQuiz();
  });
});

gradeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    currentGrade = button.dataset.grade;
    setActiveButton(gradeButtons, button);
    updateStandardOptions();
    renderQuiz();
  });
});

standardSelect.addEventListener("change", () => {
  currentStandard = standardSelect.value;
  renderQuiz();
});

quizForm.addEventListener("change", () => {
  updateAnsweredCount();
  if (submitted) {
    submitQuiz();
  }
});

quizForm.addEventListener("input", () => {
  updateAnsweredCount();
  if (submitted) {
    submitQuiz();
  }
});

refreshBtn.addEventListener("click", renderQuiz);
submitBtn.addEventListener("click", submitQuiz);
resetBtn.addEventListener("click", clearAnswers);
exportHistoryBtn.addEventListener("click", exportHistory);

updateStandardOptions();
renderHistory();
renderQuiz();
