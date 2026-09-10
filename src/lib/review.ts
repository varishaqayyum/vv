import type { StatementAnswers } from "@/lib/statement";
import {
  UCAS_QUESTIONS,
  TOTAL_CHARACTER_LIMIT,
  totalCharacters,
  characterCount,
} from "@/lib/statement";

/**
 * Personal statement review engine.
 *
 * Analyses a student's own writing and produces structured, evidence-linked
 * coaching feedback — it never rewrites or generates replacement text.
 * Every major point is backed, where possible, by a verbatim excerpt pulled
 * from the student's own answers so they can see exactly which part of
 * their statement a piece of feedback refers to.
 *
 * Implementation note: this is a deterministic, rule-based text analysis
 * (keyword/phrase pattern matching plus reflection and specificity
 * heuristics), not a call to a hosted language model — no AI service is
 * wired up in this project. The output shape is designed so this could
 * later be swapped for a real AI-backed implementation without changing
 * any UI code.
 */

export type QualityKey =
  | "communication"
  | "empathy"
  | "teamwork"
  | "leadership"
  | "resilience"
  | "reflection"
  | "organisation"
  | "responsibility"
  | "professionalism"
  | "problem_solving"
  | "academic_curiosity"
  | "motivation"
  | "understanding_of_profession"
  | "adaptability"
  | "initiative";

export type CoverageStatus =
  | "Strongly demonstrated"
  | "Well demonstrated"
  | "Partially demonstrated"
  | "Briefly mentioned"
  | "Little evidence"
  | "Not demonstrated";

export type ExcerptRef = {
  questionKey: keyof StatementAnswers;
  questionNumber: number;
  text: string; // verbatim substring from the student's own answer
  anchorId: string; // DOM id to scroll/link to within the statement view
};

export type QualityDetail = {
  key: QualityKey;
  label: string;
  score: number; // 0-100
  status: CoverageStatus;
  excerpt: ExcerptRef | null;
  whyItMatters: string;
  questions: string[];
};

export type PriorityItem = {
  id: string;
  title: string;
  priority: "High" | "Medium";
  excerpt: ExcerptRef | null;
  whatYoureDoing: string;
  whatsMissing: string;
  whatToThinkAboutNext: string;
};

export type StrengthItem = {
  key: QualityKey;
  label: string;
  excerpt: ExcerptRef | null;
};

export type ReaderPerspective = {
  positiveImpression: string;
  potentialConcern: string;
  biggestOpportunity: string;
};

export type AdmissionsReaderPerspective = {
  whatStandsOut: string;
  whatMayLeaveThemWantingMore: string;
  whatCouldStrengthenIt: string;
};

export type CharacterUsage = {
  total: number;
  limit: number;
  overBy: number;
  byQuestion: { questionKey: keyof StatementAnswers; questionNumber: number; count: number }[];
};

export type ReviewResult = {
  overallAssessment: string;
  qualities: QualityDetail[];
  strengths: StrengthItem[];
  priorities: PriorityItem[];
  readerPerspective: ReaderPerspective;
  admissionsReaderPerspective: AdmissionsReaderPerspective;
  characterUsage: CharacterUsage;
};

type QualityMeta = {
  key: QualityKey;
  label: string;
  keywords: string[];
  developArea: string; // what kind of evidence/reflection would strengthen this
  questions: string[];
};

const QUALITIES: QualityMeta[] = [
  {
    key: "communication",
    label: "Communication",
    keywords: [
      "explain",
      "explained",
      "explaining",
      "communicat",
      "listened",
      "listening",
      "presented",
      "presentation",
      "discuss",
      "wrote",
      "writing",
      "spoke",
      "speaking",
      "translat",
      "articulat",
      "conversation",
      "convey",
    ],
    developArea:
      "communicating clearly with a specific audience and what you noticed about how you adapted what you said",
    questions: [
      "Who exactly were you communicating with, and what made it challenging?",
      "What did you adapt about how you spoke or wrote for that audience?",
      "How did you know whether your communication had landed?",
    ],
  },
  {
    key: "empathy",
    label: "Empathy",
    keywords: [
      "empath",
      "compassion",
      "understand how",
      "understand their",
      "their perspective",
      "put myself in",
      "cared for",
      "caring for",
      "comfort",
      "reassure",
      "listen to their",
      "their feelings",
      "difficult for them",
      "how they felt",
      "how they must have felt",
    ],
    developArea:
      "a moment you noticed and responded to how someone else was feeling, not just that you were present",
    questions: [
      "What specifically did you notice about how the other person was feeling?",
      "How did you respond differently because of what you noticed?",
      "What did that interaction teach you about seeing things from someone else's position?",
    ],
  },
  {
    key: "teamwork",
    label: "Teamwork",
    keywords: [
      "team",
      "together with",
      "colleagues",
      "collaborat",
      "alongside",
      "as a group",
      "worked with others",
      "shared the workload",
      "supported each other",
      "multidisciplinary",
      "mdt",
      "different roles within",
      "different professionals",
    ],
    developArea:
      "your specific role within a team and what the team achieved because of it — including, where relevant, why teamwork across different roles matters in healthcare",
    questions: [
      "What was your specific role, and how did it differ from others in the team?",
      "What would have gone wrong if your role hadn't been done well?",
      "What did working with that team teach you about collaboration?",
    ],
  },
  {
    key: "leadership",
    label: "Leadership",
    keywords: [
      "led ",
      "leading",
      "leadership",
      "organised a",
      "organised the",
      "in charge of",
      "coordinat",
      "captain",
      "chaired",
      "delegat",
      "initiated a project",
      "ran a",
    ],
    developArea:
      "a specific situation where you took the lead and what you learned about leading others",
    questions: [
      "What decision did you have to make that others were relying on you for?",
      "How did you handle a moment where the group didn't agree with you?",
      "What did leading that experience teach you about yourself?",
    ],
  },
  {
    key: "resilience",
    label: "Resilience",
    keywords: [
      "resilien",
      "difficult time",
      "setback",
      "struggled",
      "overcame",
      "did not give up",
      "kept going",
      "persever",
      "challenging period",
      "despite the difficulty",
      "learned to cope",
      "under pressure",
    ],
    developArea:
      "a specific challenge you faced and what you did differently afterwards as a result",
    questions: [
      "What specifically made this difficult at the time?",
      "What did you do differently because of how it felt, rather than just pushing through?",
      "How do you approach similar pressure differently now?",
    ],
  },
  {
    key: "reflection",
    label: "Reflection",
    keywords: [
      "i learned",
      "i realised",
      "this taught me",
      "made me realise",
      "helped me understand",
      "this showed me",
      "i now understand",
      "reinforced my",
      "i came to appreciate",
      "on reflection",
      "looking back",
      "this experience changed",
      "i understood",
    ],
    developArea:
      "what you actually took away from an experience — try finishing the sentence 'this made me realise...'",
    questions: [
      "What did you notice during the experience that stayed with you?",
      "Why did it matter to you personally, beyond the obvious lesson?",
      "Did it challenge something you'd previously assumed?",
      "How has it changed the way you think about the course or profession?",
    ],
  },
  {
    key: "organisation",
    label: "Organisation",
    keywords: [
      "organis",
      "organiz",
      "planned",
      "planning",
      "scheduled",
      "managed my time",
      "balancing",
      "prioritis",
      "prioritiz",
      "structured my",
      "kept on top of",
    ],
    developArea:
      "a specific example of juggling competing demands and how you kept things on track",
    questions: [
      "What competing demands were you actually balancing?",
      "What system or approach did you use to stay on top of it?",
      "What would have happened if you hadn't planned it that way?",
    ],
  },
  {
    key: "responsibility",
    label: "Responsibility",
    keywords: [
      "responsib",
      "trusted with",
      "accountab",
      "in charge of",
      "looked after",
      "took ownership",
      "relied on me",
      "duty of",
      "entrusted",
    ],
    developArea: "a moment you were trusted with something and how you handled that trust",
    questions: [
      "What exactly were you trusted with, and by whom?",
      "What would have been the consequence of getting it wrong?",
      "How did that responsibility change how you approached the task?",
    ],
  },
  {
    key: "professionalism",
    label: "Professionalism",
    keywords: [
      "professional",
      "confidential",
      "ethic",
      "duty of candour",
      "acted appropriately",
      "maintained boundaries",
      "respected",
      "dignity",
      "gmc",
      "code of conduct",
    ],
    developArea:
      "a specific moment where you had to act with discretion, respect a boundary, or navigate something sensitive appropriately",
    questions: [
      "What specific situation called for professionalism or discretion?",
      "What did you do, and why was that the right approach?",
      "What did it teach you about the standards expected of a doctor?",
    ],
  },
  {
    key: "problem_solving",
    label: "Problem-solving",
    keywords: [
      "problem",
      "solution",
      "figured out",
      "worked out how",
      "resolved",
      "diagnos",
      "troubleshoot",
      "came up with a way",
      "found a way to",
    ],
    developArea:
      "the specific problem, the options you considered, and how you decided between them",
    questions: [
      "What made this problem genuinely difficult, rather than straightforward?",
      "What other options did you consider before landing on your approach?",
      "What would you do differently if you faced it again?",
    ],
  },
  {
    key: "academic_curiosity",
    label: "Academic curiosity",
    keywords: [
      "curious",
      "curiosity",
      "fascinat",
      "read about",
      "read widely",
      "podcast",
      "wider reading",
      "beyond the curriculum",
      "independent research",
      "explored the topic",
      "interested me",
      "sparked my interest",
      "further reading",
      "journal article",
    ],
    developArea:
      "a specific book, article, lecture or topic you explored independently and the question it left you with",
    questions: [
      "What specifically did you read, watch or explore beyond your course?",
      "What question or idea did it leave you with that you're still thinking about?",
      "How does it connect to what you'd want to study further?",
    ],
  },
  {
    key: "motivation",
    label: "Motivation",
    keywords: [
      "motivat",
      "passion",
      "drawn to",
      "why i want",
      "determined to",
      "driven by",
      "my ambition",
      "committed to",
      "eager to",
    ],
    developArea:
      "what specifically triggered your motivation, rather than stating that you are motivated",
    questions: [
      "What was the specific moment or experience that triggered this motivation?",
      "How has your reason for wanting this changed or developed over time?",
      "What would this course or career actually let you do that you can't do now?",
    ],
  },
  {
    key: "understanding_of_profession",
    label: "Understanding of Medicine",
    keywords: [
      "shadow",
      "work experience",
      "placement",
      "clinic",
      "hospital",
      "ward",
      "gp surgery",
      "care home",
      "patients",
      "healthcare team",
      "multidisciplinary",
      "consultant",
      "realities of the profession",
      "demands of the role",
      "day-to-day",
      "challenges of the role",
      "pressures of",
      "difficult decisions",
      "long hours",
      "responsibility of being a doctor",
      "uncertainty",
      "emotionally demanding",
    ],
    developArea:
      "something specific you observed about what the role actually involves day-to-day — including its pressures or difficulties, not only its positives — and how it shaped your understanding",
    questions: [
      "What specifically did you observe that surprised you or changed your expectations?",
      "What does that observation tell you about the demands of the role?",
      "How has it shaped what you now expect from a career in this field?",
    ],
  },
  {
    key: "adaptability",
    label: "Adaptability",
    keywords: [
      "adapt",
      "flexib",
      "changed my approach",
      "different situation",
      "unfamiliar",
      "had to adjust",
      "responded to change",
      "new environment",
    ],
    developArea:
      "a specific situation that changed unexpectedly and how you adjusted your approach",
    questions: [
      "What changed unexpectedly, and how did you first react?",
      "What specifically did you adjust about your approach?",
      "What did that experience teach you about handling the unexpected?",
    ],
  },
  {
    key: "initiative",
    label: "Initiative",
    keywords: [
      "initiat",
      "took it upon myself",
      "on my own",
      "started a",
      "set up a",
      "proactiv",
      "without being asked",
      "decided to create",
      "approached the",
    ],
    developArea: "something you started or pursued without being asked to, and why you chose to",
    questions: [
      "What made you decide to act without being asked?",
      "What was the outcome, and was it what you expected?",
      "What does that tell you about how you approach opportunities?",
    ],
  },
];

const PRIMARY_KEYS: QualityKey[] = [
  "understanding_of_profession",
  "communication",
  "reflection",
  "academic_curiosity",
];

const REFLECTION_MARKERS = [
  "i learned",
  "i realised",
  "i realized",
  "this taught me",
  "made me realise",
  "made me realize",
  "helped me understand",
  "this showed me",
  "i now understand",
  "reinforced my",
  "i came to appreciate",
  "on reflection",
  "looking back",
  "this experience changed",
  "i understood",
  "i understand now",
];

const SPECIFICITY_MARKERS = [
  /\b\d+\s*(weeks?|months?|years?|hours?|days?)\b/i,
  /\b\d{1,4}\b/,
  /\b(hospital|clinic|ward|gp surgery|care home|school|laboratory|lab|charity|hospice)\b/i,
];

// Connector/transition phrases used to distinguish connected, reasoned prose
// from a bare list of activities strung together with no explained links
// between them — part of assessing structure and flow, not a "quality".
const STRUCTURE_CONNECTORS = [
  "this meant",
  "as a result",
  "because of this",
  "which meant",
  "for example",
  "in particular",
  "however",
  "furthermore",
  "in addition",
  "similarly",
  "this is because",
  "which led to",
  "consequently",
  "as well as",
  "this experience",
];

function normalise(text: string) {
  return text.toLowerCase();
}

function countHits(haystack: string, needles: string[]) {
  let hits = 0;
  for (const needle of needles) {
    let idx = haystack.indexOf(needle);
    while (idx !== -1) {
      hits += 1;
      idx = haystack.indexOf(needle, idx + needle.length);
    }
  }
  return hits;
}

function reflectionNearby(haystack: string, needle: string, windowSize = 180) {
  const idx = haystack.indexOf(needle);
  if (idx === -1) return false;
  const start = Math.max(0, idx - windowSize);
  const end = Math.min(haystack.length, idx + needle.length + windowSize);
  return REFLECTION_MARKERS.some((marker) => haystack.slice(start, end).includes(marker));
}

function scoreForQuality(meta: QualityMeta, combinedTextLower: string): number {
  const hits = countHits(combinedTextLower, meta.keywords);
  if (hits === 0) return 0;

  let reflectionBonus = 0;
  for (const keyword of meta.keywords) {
    if (reflectionNearby(combinedTextLower, keyword)) reflectionBonus += 1;
  }

  const specificityHits = SPECIFICITY_MARKERS.reduce(
    (sum, pattern) => sum + (pattern.test(combinedTextLower) ? 1 : 0),
    0,
  );

  const mentionScore = Math.min(45, hits * 16);
  const reflectionScore = Math.min(35, reflectionBonus * 18);
  const specificityScore = Math.min(20, specificityHits * 7);

  return Math.max(0, Math.min(100, mentionScore + reflectionScore + specificityScore));
}

function statusForScore(score: number): CoverageStatus {
  if (score >= 80) return "Strongly demonstrated";
  if (score >= 60) return "Well demonstrated";
  if (score >= 40) return "Partially demonstrated";
  if (score >= 20) return "Briefly mentioned";
  if (score >= 1) return "Little evidence";
  return "Not demonstrated";
}

// Split into sentences, keeping enough context to be a readable excerpt.
function splitSentences(text: string): string[] {
  const matches = text.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g);
  if (!matches) return [];
  return matches.map((s) => s.trim()).filter((s) => s.length > 0);
}

/**
 * A lightweight structure/flow check: does the writing read as connected,
 * reasoned prose, or as a bare list of activities with no explained links
 * between them? Not a proxy for grammar/spelling (out of scope for a
 * rule-based checker) — just whether ideas are joined up.
 */
function assessStructure(answers: StatementAnswers): { score: number; listy: boolean } {
  const combined = [answers.answer_one, answers.answer_two, answers.answer_three].join(" ");
  const sentences = splitSentences(combined);
  if (sentences.length === 0) return { score: 100, listy: false };

  const startsWithI = sentences.filter((s) => /^i\s/i.test(s.trim())).length;
  const iRatio = startsWithI / sentences.length;
  const lower = normalise(combined);
  const connectorHits = STRUCTURE_CONNECTORS.filter((c) => lower.includes(c)).length;

  let score = 50 + connectorHits * 12;
  if (iRatio > 0.6) score -= 25;
  score = Math.max(0, Math.min(100, score));

  return { score, listy: iRatio > 0.6 };
}

/** Finds the single best verbatim excerpt for a quality across the student's three answers. */
function findExcerpt(meta: QualityMeta, answers: StatementAnswers): ExcerptRef | null {
  let best: { score: number; ref: ExcerptRef } | null = null;

  for (const q of UCAS_QUESTIONS) {
    const raw = answers[q.key] ?? "";
    if (!raw.trim()) continue;
    const sentences = splitSentences(raw);
    for (const sentence of sentences) {
      const lower = sentence.toLowerCase();
      const hasKeyword = meta.keywords.some((k) => lower.includes(k));
      if (!hasKeyword) continue;
      const hasReflection = REFLECTION_MARKERS.some((m) => lower.includes(m));
      const length = sentence.length;
      // Prefer sentences that also show reflection, then longer/more detailed ones.
      const candidateScore = (hasReflection ? 1000 : 0) + Math.min(length, 220);
      if (!best || candidateScore > best.score) {
        best = {
          score: candidateScore,
          ref: {
            questionKey: q.key,
            questionNumber: q.number,
            text: sentence,
            anchorId: `excerpt-${meta.key}`,
          },
        };
      }
    }
  }
  return best?.ref ?? null;
}

function whyItMatters(
  meta: QualityMeta,
  status: CoverageStatus,
  excerpt: ExcerptRef | null,
): string {
  const quoted = excerpt ? `"${truncate(excerpt.text, 140)}"` : null;
  switch (status) {
    case "Strongly demonstrated":
    case "Well demonstrated":
      return quoted
        ? `This comes through clearly — ${quoted} shows this in a specific, credible way rather than just being asserted.`
        : `This comes through clearly across your answers as a genuine strength.`;
    case "Partially demonstrated":
      return quoted
        ? `You show this here — ${quoted} — but the writing stays closer to describing what happened than fully unpacking it. There's room to develop ${meta.developArea}.`
        : `There are signs of this in your writing, but it isn't fully developed yet. Consider developing ${meta.developArea}.`;
    case "Briefly mentioned":
      return quoted
        ? `You touch on this — ${quoted} — but the statement moves on quickly without explaining why it mattered or what you took from it.`
        : `This is only briefly touched on. Consider developing ${meta.developArea}.`;
    case "Little evidence":
      return quoted
        ? `There's a hint of this — ${quoted} — but not enough for a reader to be confident it's a genuine strength yet.`
        : `There's very little in your current answers that shows this clearly.`;
    default:
      return `Nothing in your current answers clearly demonstrates this yet. That's not necessarily a problem — it may simply not be relevant to your experiences — but if it is genuinely true of you, consider whether ${meta.developArea} could be worked in.`;
  }
}

function truncate(text: string, max: number) {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

function buildCharacterUsage(answers: StatementAnswers): CharacterUsage {
  const total = totalCharacters(answers);
  return {
    total,
    limit: TOTAL_CHARACTER_LIMIT,
    overBy: Math.max(0, total - TOTAL_CHARACTER_LIMIT),
    byQuestion: UCAS_QUESTIONS.map((q) => ({
      questionKey: q.key,
      questionNumber: q.number,
      count: characterCount(answers[q.key] ?? ""),
    })),
  };
}

function buildPriorities(
  qualities: QualityDetail[],
  answers: StatementAnswers,
  characterUsage: CharacterUsage,
): PriorityItem[] {
  const weak = [...qualities]
    .filter((q) => q.score < 60)
    .sort((a, b) => a.score - b.score)
    .slice(0, 2);

  const priorities: PriorityItem[] = weak.map((q, i) => {
    const meta = QUALITIES.find((m) => m.key === q.key)!;
    const whatYoureDoing = q.excerpt
      ? `You mention this — "${truncate(q.excerpt.text, 140)}" — so it isn't completely absent.`
      : `There's currently little to nothing in your answers that clearly shows this.`;
    const whatsMissing =
      q.status === "Not demonstrated"
        ? `A specific moment or example that actually demonstrates ${meta.label.toLowerCase()}.`
        : `The writing describes what happened but doesn't fully explain why it mattered or what you personally took from it.`;
    return {
      id: `quality-${q.key}`,
      title:
        q.key === "reflection"
          ? "Go deeper with reflection"
          : q.key === "academic_curiosity"
            ? "Make your academic interest more specific"
            : `Develop ${meta.label.toLowerCase()} further`,
      priority: i === 0 ? "High" : "Medium",
      excerpt: q.excerpt,
      whatYoureDoing,
      whatsMissing,
      whatToThinkAboutNext: meta.questions[0] ?? `Consider developing ${meta.developArea}.`,
    };
  });

  // Structural priority: character usage. Included if there's meaningful room left,
  // or if descriptive writing dominates over reflective writing.
  const combinedLower = normalise(
    [answers.answer_one, answers.answer_two, answers.answer_three].join(" "),
  );
  const reflectionMentions = REFLECTION_MARKERS.filter((m) => combinedLower.includes(m)).length;
  const usageRatio = characterUsage.total / characterUsage.limit;

  // Structural priority: connected prose vs. a bare list of activities.
  // Checked before the character-space suggestion when it's a clear, severe
  // case, so an obviously "listy" statement doesn't always lose that slot to
  // a milder, less specific suggestion.
  const structure = assessStructure(answers);
  if (priorities.length < 3 && structure.score < 40) {
    priorities.push({
      id: "structural-flow",
      title: "Connect your ideas rather than listing them",
      priority: priorities.length === 0 ? "High" : "Medium",
      excerpt: null,
      whatYoureDoing:
        "Several sentences read as a list of separate things you did, one after another, rather than a connected account.",
      whatsMissing:
        "Words or phrases that show how one point leads to the next, rather than each sentence standing alone.",
      whatToThinkAboutNext:
        "Try joining two of your points with a phrase like 'because of this' or 'which meant that', to show how one idea led to the next rather than just listing what happened.",
    });
  }

  if (priorities.length < 3 && (usageRatio < 0.9 || reflectionMentions <= 2)) {
    priorities.push({
      id: "structural-character-space",
      title: "Use your character space strategically",
      priority: priorities.length === 0 ? "High" : "Medium",
      excerpt: null,
      whatYoureDoing:
        usageRatio < 0.9
          ? `You're currently using ${characterUsage.total.toLocaleString()} of your ${characterUsage.limit.toLocaleString()} shared characters.`
          : `You're using most of your character allowance, but a lot of it currently goes on describing events.`,
      whatsMissing:
        usageRatio < 0.9
          ? `There's unused space that could be spent on reflection or academic depth rather than description.`
          : `Some of the space currently used on describing what happened could instead explain why it mattered.`,
      whatToThinkAboutNext:
        "For each experience you describe, ask: have I explained what I learned, not just what happened?",
    });
  }

  // Milder structural cases still get a chance if a slot remains (skip if
  // already added above as a severe case).
  const structureAlreadyAdded = priorities.some((p) => p.id === "structural-flow");
  if (!structureAlreadyAdded && priorities.length < 3 && structure.score < 55) {
    priorities.push({
      id: "structural-flow",
      title: "Connect your ideas rather than listing them",
      priority: priorities.length === 0 ? "High" : "Medium",
      excerpt: null,
      whatYoureDoing:
        "The writing covers relevant ground, but the links between one idea and the next could be clearer.",
      whatsMissing:
        "Words or phrases that show how one point leads to the next, rather than each sentence standing alone.",
      whatToThinkAboutNext:
        "Try joining two of your points with a phrase like 'because of this' or 'which meant that', to show how one idea led to the next rather than just listing what happened.",
    });
  }

  return priorities.slice(0, 3);
}

function buildReaderPerspective(
  qualities: QualityDetail[],
  priorities: PriorityItem[],
): ReaderPerspective {
  const sorted = [...qualities].sort((a, b) => b.score - a.score);
  const top = sorted.filter((q) => q.score >= 60).slice(0, 2);
  const weakest = [...qualities].sort((a, b) => a.score - b.score)[0];

  const positiveImpression =
    top.length > 0
      ? `A reader would likely come away with a clear sense of your ${top
          .map((q) => q.label.toLowerCase())
          .join(" and ")} — these come through with specific evidence rather than general claims.`
      : `A reader can see genuine effort and relevant experience, though no single quality yet stands out strongly.`;

  const potentialConcern = weakest
    ? `A reader might notice that ${weakest.label.toLowerCase()} isn't clearly shown yet, which could make parts of the statement feel more like a list of experiences than a considered reflection on them.`
    : `Nothing stands out as a concern at this level of analysis.`;

  const biggestOpportunity = priorities[0]
    ? `The single change most likely to lift the overall impression is ${priorities[0].title.toLowerCase()} — this is where the gap between what you've done and what you've shown is currently largest.`
    : `Continue to refine specific examples so each one clearly demonstrates a quality rather than simply naming it.`;

  return { positiveImpression, potentialConcern, biggestOpportunity };
}

// Additive: a distinct "admissions reader" framing, added alongside the
// existing reader-perspective section without changing it. Uses the same
// underlying analysis (qualities, strengths, priorities) but careful,
// hedged language about how the writing may come across to a reader.
function buildAdmissionsReaderPerspective(
  qualities: QualityDetail[],
  strengths: StrengthItem[],
  priorities: PriorityItem[],
): AdmissionsReaderPerspective {
  const topStrengths = strengths.slice(0, 2);
  const weakest = [...qualities].sort((a, b) => a.score - b.score)[0];

  const whatStandsOut =
    topStrengths.length > 0
      ? `Your writing may come across as genuine, particularly around ${topStrengths
          .map((s) => s.label.toLowerCase())
          .join(
            " and ",
          )} — an admissions reader might notice these come through with real evidence rather than general claims.`
      : `An admissions reader might notice genuine effort and relevant experience, even though no single quality stands out strongly yet.`;

  const whatMayLeaveThemWantingMore = weakest
    ? `${weakest.label} could leave the reader wanting more — there's limited evidence in your writing that fully shows this yet, which may make that part of the statement feel less developed than the rest.`
    : `Nothing in particular is likely to leave a reader wanting more at this level of analysis.`;

  const whatCouldStrengthenIt = priorities[0]
    ? `The most useful improvement based on your actual statement is ${priorities[0].title.toLowerCase()} — this is where your writing currently has the most room to show your own thinking more clearly.`
    : `Continuing to develop specific examples would strengthen the overall impression.`;

  return { whatStandsOut, whatMayLeaveThemWantingMore, whatCouldStrengthenIt };
}

export function generateReview(answers: StatementAnswers): ReviewResult {
  const combinedLower = normalise(
    [answers.answer_one, answers.answer_two, answers.answer_three].join("\n\n"),
  );

  const qualities: QualityDetail[] = QUALITIES.map((meta) => {
    const score = scoreForQuality(meta, combinedLower);
    const status = statusForScore(score);
    const excerpt = score > 0 ? findExcerpt(meta, answers) : null;
    return {
      key: meta.key,
      label: meta.label,
      score,
      status,
      excerpt,
      whyItMatters: whyItMatters(meta, status, excerpt),
      questions: meta.questions,
    };
  });

  const strengths: StrengthItem[] = [...qualities]
    .filter((q) => q.score >= 55)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((q) => ({ key: q.key, label: q.label, excerpt: q.excerpt }));

  const characterUsage = buildCharacterUsage(answers);
  const priorities = buildPriorities(qualities, answers, characterUsage);
  const readerPerspective = buildReaderPerspective(qualities, priorities);
  const admissionsReaderPerspective = buildAdmissionsReaderPerspective(
    qualities,
    strengths,
    priorities,
  );

  const primary = qualities.filter((q) => PRIMARY_KEYS.includes(q.key));
  const strongPrimary = primary.filter((q) => q.score >= 60);
  const weakestPrimary = [...primary].sort((a, b) => a.score - b.score)[0];

  const overallAssessment = `Your statement ${
    strongPrimary.length > 0
      ? `demonstrates genuine ${strongPrimary.map((q) => q.label.toLowerCase()).join(" and ")}`
      : "shows some relevant experience"
  }${strengths.length > 0 ? ", and uses specific experiences effectively in places" : ""}. Your biggest opportunity is ${
    priorities[0] ? priorities[0].title.toLowerCase() : "developing your reflection further"
  }${
    weakestPrimary && weakestPrimary.score < 40
      ? `, particularly around ${weakestPrimary.label.toLowerCase()}`
      : ""
  }.`;

  return {
    overallAssessment,
    qualities,
    strengths,
    priorities,
    readerPerspective,
    admissionsReaderPerspective,
    characterUsage,
  };
}
