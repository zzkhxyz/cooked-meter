// Tiny i18n layer: UI strings + the Cooked Meter verdict labels in EN/RU.
// The chosen language is also sent to the API so the LLM answers in it.

export type Lang = "ru" | "en";

export interface Strings {
  subtitle1: string;
  subtitle2: string;
  dropTitle: string;
  dropChange: string;
  dropHint: string;
  knowledgeLabel: string;
  knowledgePlaceholder: string;
  daysLabel: string;
  optional: string;
  btnIdle: string;
  btnReading: string;
  btnAnalyzing: string;
  errNotPdf: string;
  errNoFile: string;
  errNoKnowledge: string;
  errScan: string;
  errUnexpected: string;
  truncated: string;
  footer: string;
  meterLabel: string;
  topicsTitle: string;
  topicsSub: string;
  winsTitle: string;
  winsSub: string;
  planTitle: string;
  planSub: string;
}

export const STRINGS: Record<Lang, Strings> = {
  en: {
    subtitle1: "Upload your exam. Confess how little you studied.",
    subtitle2: "Get roasted — then get an actual escape plan. 🔥",
    dropTitle: "Drop your exam PDF here, or click to browse",
    dropChange: "Click to choose a different file",
    dropHint: "PDF with a text layer (no scans)",
    knowledgeLabel: "How much have you actually studied?",
    knowledgePlaceholder:
      "e.g. read 2 of 10 lectures, don't remember any formulas, panicking",
    daysLabel: "Days until the exam",
    optional: "(optional)",
    btnIdle: "Am I cooked?",
    btnReading: "Reading your PDF…",
    btnAnalyzing: "Cooking the verdict… 🔥",
    errNotPdf: "That's not a PDF. Upload your exam as a PDF file.",
    errNoFile: "Upload your exam PDF first.",
    errNoKnowledge: "Describe your current level — be honest.",
    errScan:
      "I can't see any text in that PDF — looks like a scan. Upload a PDF with a real text layer (OCR isn't supported yet).",
    errUnexpected: "Unexpected error.",
    truncated: "Heads up: your exam was long, so I analyzed the first part of it.",
    footer: "Built with Next.js + Groq · Roasts are jokes, the study plan is real.",
    meterLabel: "Cooked Meter",
    topicsTitle: "🎯 Key topics",
    topicsSub: "What this exam is really testing",
    winsTitle: "⚡ Quick wins",
    winsSub: "Cheap points you can grab tonight",
    planTitle: "🗓️ Study plan",
    planSub: "Your escape route",
  },
  ru: {
    subtitle1: "Загрузи свой экзамен. Признайся, как мало ты готовился.",
    subtitle2: "Получи роаст — и реальный план спасения. 🔥",
    dropTitle: "Перетащи PDF экзамена сюда или нажми, чтобы выбрать",
    dropChange: "Нажми, чтобы выбрать другой файл",
    dropHint: "PDF с текстовым слоем (не скан)",
    knowledgeLabel: "Сколько ты реально успел подготовиться?",
    knowledgePlaceholder:
      "напр. прочитал 2 из 10 лекций, формулы не помню, паникую",
    daysLabel: "Дней до экзамена",
    optional: "(необязательно)",
    btnIdle: "Насколько я попал?",
    btnReading: "Читаю твой PDF…",
    btnAnalyzing: "Готовлю приговор… 🔥",
    errNotPdf: "Это не PDF. Загрузи экзамен в формате PDF.",
    errNoFile: "Сначала загрузи PDF экзамена.",
    errNoKnowledge: "Опиши свой текущий уровень — честно.",
    errScan:
      "Не вижу текста в PDF — похоже, это скан. Загрузи PDF с текстовым слоем (OCR пока не поддерживается).",
    errUnexpected: "Неожиданная ошибка.",
    truncated: "Учти: экзамен длинный, я проанализировал его первую часть.",
    footer: "Сделано на Next.js + Groq · Роасты — это шутка, план подготовки — нет.",
    meterLabel: "Cooked Meter",
    topicsTitle: "🎯 Ключевые темы",
    topicsSub: "Что на самом деле проверяет экзамен",
    winsTitle: "⚡ Быстрые победы",
    winsSub: "Дешёвые баллы, которые можно урвать за вечер",
    planTitle: "🗓️ План подготовки",
    planSub: "Твой путь к спасению",
  },
};

/** Cooked Meter verdict label + emoji for a 0–100 level. */
export function verdict(level: number, lang: Lang): { label: string; emoji: string } {
  const en = [
    { max: 25, label: "Lightly toasted — you got this", emoji: "😎" },
    { max: 50, label: "Medium rare — needs work", emoji: "😅" },
    { max: 75, label: "Well done — start grinding", emoji: "😰" },
    { max: 90, label: "Burnt — code red", emoji: "🔥" },
    { max: 101, label: "Cremated — pray & grind", emoji: "💀" },
  ];
  const ru = [
    { max: 25, label: "Лёгкая прожарка — ты справишься", emoji: "😎" },
    { max: 50, label: "Средняя прожарка — есть над чем поработать", emoji: "😅" },
    { max: 75, label: "Хорошо прожарен — пора впахивать", emoji: "😰" },
    { max: 90, label: "Подгорел — красный уровень", emoji: "🔥" },
    { max: 101, label: "Сгорел дотла — молись и зубри", emoji: "💀" },
  ];
  const table = lang === "ru" ? ru : en;
  return table.find((row) => level < row.max) ?? table[table.length - 1];
}
