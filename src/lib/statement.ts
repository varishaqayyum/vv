export const TOTAL_CHARACTER_LIMIT = 4000;

export const UCAS_QUESTIONS = [
  {
    key: "answer_one" as const,
    number: 1,
    title: "Why do you want to study this course or subject?",
    hint: "Show us where your interest in the subject comes from, and what has made you want to take it further. Strong answers connect your motivation to specific experiences, ideas or things you've explored.",
  },
  {
    key: "answer_two" as const,
    number: 2,
    title: "How have your qualifications and studies helped you to prepare?",
    hint: "Go beyond listing what you've studied. Show how your subjects, projects or wider academic exploration have prepared you for the course and helped you develop relevant skills.",
  },
  {
    key: "answer_three" as const,
    number: 3,
    title:
      "What else have you done to prepare outside of education, and why are these experiences useful?",
    hint: "Work, volunteering, clubs, competitions, caring responsibilities — whatever you've done, focus on what you learned and why it matters for your future course.",
  },
];

export type StatementAnswers = {
  answer_one: string;
  answer_two: string;
  answer_three: string;
};

/**
 * The single, intentional character-counting rule for the whole app.
 *
 * - Every character the student actually typed counts, including spaces and
 *   line breaks — that matches how UCAS itself counts the real form, and
 *   means we must NOT trim the stored answer (trimming would silently
 *   under-count real content while the student is mid-sentence).
 * - We do strip characters that are never really "content" the student
 *   intended: zero-width/invisible unicode characters (zero-width space,
 *   zero-width non-joiner/joiner, and a stray BOM) that some browsers,
 *   extensions, or rich-text paste sources can silently insert. Left
 *   uncleaned, a handful of these are invisible but still count toward
 *   `.length`, which is exactly the "count doesn't return to 0 after
 *   clearing the box" symptom this fixes.
 * - Windows-style "\r\n" line endings are normalised to "\n" so the same
 *   text pasted from different sources counts identically everywhere.
 *
 * Every place in the app that shows or totals a character count must go
 * through this function (or `totalCharacters`, which uses it) rather than
 * calling `.length` directly, so the number can never drift between the
 * checker, the sticky counter, and the results page.
 */
const INVISIBLE_CHARACTERS_PATTERN = /[\u200B-\u200D\uFEFF]/g;

export function sanitizeAnswer(value: string): string {
  return value.replace(/\r\n/g, "\n").replace(INVISIBLE_CHARACTERS_PATTERN, "");
}

export function characterCount(value: string): number {
  return sanitizeAnswer(value).length;
}

export function totalCharacters(answers: StatementAnswers) {
  return (
    characterCount(answers.answer_one) +
    characterCount(answers.answer_two) +
    characterCount(answers.answer_three)
  );
}
