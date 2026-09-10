import { Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { UCAS_QUESTIONS } from "@/lib/statement";
import type { StatementAnswers } from "@/lib/statement";
import type { ExcerptRef, ReviewResult } from "@/lib/review";
import { trackEvent } from "@/lib/analytics";

function scoreTone(score: number) {
  if (score >= 60) return "text-primary";
  if (score >= 40) return "text-foreground";
  return "text-muted-foreground";
}

export type ReviewHistoryContext = {
  /** e.g. "Medicine Personal Statement — Check 2" */
  label: string;
  /** e.g. "Checked 10 September 2026" */
  checkedOn: string;
};

/**
 * Renders a full check result page. Shared by the guest results page (which
 * reads from sessionStorage) and the signed-in account history detail page
 * (which reads a saved row from Supabase) — same component, same design,
 * different data source. `historyContext`, when provided, adds a small
 * "which check is this and when" header without changing anything else.
 */
export function ReviewContent({
  answers,
  review,
  historyContext,
}: {
  answers: StatementAnswers;
  review: ReviewResult;
  historyContext?: ReviewHistoryContext;
}) {
  // Group excerpts by which question they belong to, so we can highlight them
  // inline against the student's actual statement.
  const excerptsByQuestion = new Map<keyof StatementAnswers, ExcerptRef[]>();
  for (const q of review.qualities) {
    if (!q.excerpt) continue;
    const list = excerptsByQuestion.get(q.excerpt.questionKey) ?? [];
    list.push(q.excerpt);
    excerptsByQuestion.set(q.excerpt.questionKey, list);
  }

  const strongQualities = review.qualities.filter(
    (q) => q.status === "Strongly demonstrated" || q.status === "Well demonstrated",
  );
  const developingQualities = review.qualities.filter(
    (q) =>
      q.status === "Partially demonstrated" ||
      q.status === "Briefly mentioned" ||
      q.status === "Little evidence",
  );
  const missingQualities = review.qualities.filter((q) => q.status === "Not demonstrated");

  return (
    <SiteLayout>
      <div className="mx-auto w-full max-w-3xl px-5 py-12">
        {/* HEADER */}
        {historyContext && (
          <div className="mb-4">
            <Button asChild variant="outline" size="sm">
              <Link to="/account">← Back to My Account</Link>
            </Button>
            <h1 className="mt-4 text-2xl">{historyContext.label}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{historyContext.checkedOn}</p>
          </div>
        )}
        <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
          Your Personal Statement
        </p>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-foreground">
          {review.overallAssessment}
        </p>

        {/* AT A GLANCE — qualitative, no numbers or scores */}
        <div className="mt-8 grid gap-5 rounded-lg border border-rule/70 bg-card p-5 sm:grid-cols-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Strongly demonstrated</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {strongQualities.length > 0
                ? strongQualities.map((q) => q.label).join(", ")
                : "Nothing stands out strongly yet — see the categories below for specifics."}
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Could be developed further</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {developingQualities.length > 0
                ? developingQualities.map((q) => q.label).join(", ")
                : "Nothing flagged here."}
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              Currently missing / not clearly demonstrated
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {missingQualities.length > 0
                ? missingQualities.map((q) => q.label).join(", ")
                : "Nothing missing at this level of analysis."}
            </p>
          </div>
        </div>

        {/* YOUR STATEMENT */}
        <section className="mt-12">
          <h2 className="text-xl">Your statement</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Exactly what you submitted. Highlighted sentences are linked to feedback further down
            the page.
          </p>
          <div className="mt-5 space-y-5">
            {UCAS_QUESTIONS.map((q) => (
              <div key={q.key} className="rounded-lg border border-rule/70 bg-card p-6">
                <span className="font-display text-xl text-primary">0{q.number}</span>
                <h3 className="mt-1 text-sm font-semibold text-muted-foreground">{q.title}</h3>
                <HighlightedAnswer
                  text={answers[q.key] ?? ""}
                  excerpts={excerptsByQuestion.get(q.key) ?? []}
                />
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            {review.characterUsage.total.toLocaleString()} /{" "}
            {review.characterUsage.limit.toLocaleString()} characters total
            {review.characterUsage.overBy > 0 && (
              <span className="text-destructive">
                {" "}
                — ⚠️ {review.characterUsage.overBy.toLocaleString()} over the limit
              </span>
            )}
          </p>
        </section>

        {/* WHAT YOU'RE DOING WELL */}
        {review.strengths.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl">What you're doing well</h2>
            <ul className="mt-4 space-y-3">
              {review.strengths.map((s) => (
                <li
                  key={s.key}
                  className="rounded-lg border border-rule/70 bg-card p-4 text-sm sm:flex sm:items-start sm:justify-between sm:gap-4"
                >
                  <span className="flex gap-2 font-medium text-foreground">
                    <span className="text-primary">✓</span> {s.label}
                  </span>
                  {s.excerpt && (
                    <a
                      href={`#${s.excerpt.anchorId}`}
                      className="mt-1 block text-xs text-primary underline underline-offset-2 sm:mt-0 sm:shrink-0"
                    >
                      See it in your statement →
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* WHAT I'D WORK ON FIRST */}
        {review.priorities.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl">What I'd work on first</h2>
            <div className="mt-4 space-y-5">
              {review.priorities.map((p, i) => (
                <div key={p.id} className="rounded-lg border border-rule/70 bg-card p-6">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-base font-semibold">
                      <span className="text-primary">0{i + 1} —</span> {p.title}
                    </p>
                    <Badge variant={p.priority === "High" ? "default" : "secondary"}>
                      Priority: {p.priority}
                    </Badge>
                  </div>
                  {p.excerpt && (
                    <blockquote className="mt-3 border-l-2 border-primary/40 pl-3 text-sm text-muted-foreground italic">
                      "{p.excerpt.text}"
                    </blockquote>
                  )}
                  <div className="mt-4 space-y-2 text-sm">
                    <p>
                      <span className="font-semibold">What you're doing: </span>
                      <span className="text-muted-foreground">{p.whatYoureDoing}</span>
                    </p>
                    <p>
                      <span className="font-semibold">What's missing: </span>
                      <span className="text-muted-foreground">{p.whatsMissing}</span>
                    </p>
                    <p>
                      <span className="font-semibold">What to think about next: </span>
                      <span className="text-muted-foreground">{p.whatToThinkAboutNext}</span>
                    </p>
                  </div>
                  {p.excerpt && (
                    <a
                      href={`#${p.excerpt.anchorId}`}
                      className="mt-3 inline-block text-xs text-primary underline underline-offset-2"
                    >
                      Jump to this in your statement →
                    </a>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CATEGORY DEEP-DIVE */}
        <section className="mt-12">
          <h2 className="text-xl">Your qualities and skills, in detail</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Tap a category to see exactly where it comes from in your writing, why it matters, and
            questions to help you develop it yourself.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            These reflect structured medicine-focused criteria we use to look for strengths and gaps
            — not an official medical-school marking scheme. Different universities and courses may
            place different emphasis on different areas.
          </p>
          <Accordion type="single" collapsible className="mt-4">
            {review.qualities.map((q) => (
              <AccordionItem key={q.key} value={q.key}>
                <AccordionTrigger>
                  <span className="flex flex-1 items-center justify-between pr-4">
                    <span>{q.label}</span>
                    <span className={`text-xs font-medium ${scoreTone(q.score)}`}>
                      {q.status} · {q.score}%
                    </span>
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <Progress value={q.score} className="mb-3 h-1.5" />
                  {q.excerpt && (
                    <div className="mb-3">
                      <p className="text-xs font-semibold text-muted-foreground uppercase">
                        Your writing
                      </p>
                      <blockquote className="mt-1 border-l-2 border-primary/40 pl-3 text-sm italic">
                        "{q.excerpt.text}"
                      </blockquote>
                      <a
                        href={`#${q.excerpt.anchorId}`}
                        className="mt-1 inline-block text-xs text-primary underline underline-offset-2"
                      >
                        See it in your statement →
                      </a>
                    </div>
                  )}
                  <p className="text-xs font-semibold text-muted-foreground uppercase">
                    Why this matters
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{q.whyItMatters}</p>
                  <p className="mt-3 text-xs font-semibold text-muted-foreground uppercase">
                    Questions to consider
                  </p>
                  <ul className="mt-1 space-y-1 text-sm text-muted-foreground">
                    {q.questions.map((question) => (
                      <li key={question}>• {question}</li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        {/* READER PERSPECTIVE */}
        <section className="mt-12 rounded-lg border border-primary/40 bg-card p-6 sm:p-8">
          <h2 className="text-xl">How your statement currently comes across</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            An informed perspective on how the writing may read to an admissions reader — not a
            claim about what any specific reader or university will think.
          </p>
          <div className="mt-5 space-y-4 text-sm">
            <div>
              <p className="font-semibold text-foreground">Positive impression</p>
              <p className="mt-1 text-muted-foreground">
                {review.readerPerspective.positiveImpression}
              </p>
            </div>
            <div>
              <p className="font-semibold text-foreground">Potential concern</p>
              <p className="mt-1 text-muted-foreground">
                {review.readerPerspective.potentialConcern}
              </p>
            </div>
            <div>
              <p className="font-semibold text-foreground">Biggest opportunity</p>
              <p className="mt-1 text-muted-foreground">
                {review.readerPerspective.biggestOpportunity}
              </p>
            </div>
          </div>
        </section>

        {/* ADMISSIONS-READER PERSPECTIVE (additive) */}
        {review.admissionsReaderPerspective && (
          <section className="mt-12 rounded-lg border border-primary/40 bg-card p-6 sm:p-8">
            <h2 className="text-xl">How this may come across to an admissions reader</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              An additional, informed perspective based on your actual writing and feedback above —
              not a claim about exactly what any admissions team would think.
            </p>
            <div className="mt-5 space-y-4 text-sm">
              <div>
                <p className="font-semibold text-foreground">What stands out</p>
                <p className="mt-1 text-muted-foreground">
                  {review.admissionsReaderPerspective.whatStandsOut}
                </p>
              </div>
              <div>
                <p className="font-semibold text-foreground">
                  What may leave the reader wanting more
                </p>
                <p className="mt-1 text-muted-foreground">
                  {review.admissionsReaderPerspective.whatMayLeaveThemWantingMore}
                </p>
              </div>
              <div>
                <p className="font-semibold text-foreground">
                  What could strengthen the impression
                </p>
                <p className="mt-1 text-muted-foreground">
                  {review.admissionsReaderPerspective.whatCouldStrengthenIt}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* HUMAN REVIEW CTA */}
        <div className="mt-12 rounded-lg border border-rule/70 bg-paper/70 p-6">
          <Badge>Want more detailed feedback?</Badge>
          <p className="mt-3 text-muted-foreground">
            Get your personal statement personally reviewed with detailed feedback tailored to your
            writing.
          </p>
          <Button asChild className="mt-4">
            <Link to="/pricing" onClick={() => trackEvent("human_review_clicked")}>
              Get Human Review
            </Link>
          </Button>
        </div>

        {/* NEXT STEP */}
        <section className="mt-10 rounded-lg border border-rule/70 bg-card p-6 text-center">
          <h2 className="text-xl">Ready to improve it?</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Use the feedback above to revise your own statement, then come back and check it again.
          </p>
          <div className="mt-5 flex justify-center">
            <Button asChild variant="outline">
              <Link to="/check">Edit my statement</Link>
            </Button>
          </div>
        </section>

        <p className="mt-6 text-xs text-muted-foreground">
          Your statement should remain your own. Use this feedback to strengthen your ideas, writing
          and reflection.
        </p>
      </div>
    </SiteLayout>
  );
}

/** Renders an answer's text with any linked excerpts highlighted and anchored. */
function HighlightedAnswer({ text, excerpts }: { text: string; excerpts: ExcerptRef[] }) {
  if (!text.trim()) {
    return <p className="mt-3 text-sm text-muted-foreground italic">Not answered yet.</p>;
  }
  if (excerpts.length === 0) {
    return <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{text}</p>;
  }

  const ranges = excerpts
    .map((e) => {
      const start = text.indexOf(e.text);
      if (start === -1) return null;
      return { start, end: start + e.text.length, anchorId: e.anchorId };
    })
    .filter((r): r is { start: number; end: number; anchorId: string } => r !== null)
    .sort((a, b) => a.start - b.start);

  // Multiple qualities can point at the exact same sentence. Merge those into
  // one highlighted range, but keep every anchor id so "jump to this" links
  // for any of them still land on the right spot.
  const merged: { start: number; end: number; anchorIds: string[] }[] = [];
  for (const r of ranges) {
    const last = merged[merged.length - 1];
    if (last && r.start < last.end) {
      last.anchorIds.push(r.anchorId);
      continue;
    }
    merged.push({ start: r.start, end: r.end, anchorIds: [r.anchorId] });
  }

  const segments: { type: "text" | "mark"; content: string; anchorIds?: string[] }[] = [];
  let cursor = 0;
  for (const r of merged) {
    if (r.start > cursor) segments.push({ type: "text", content: text.slice(cursor, r.start) });
    segments.push({ type: "mark", content: text.slice(r.start, r.end), anchorIds: r.anchorIds });
    cursor = r.end;
  }
  if (cursor < text.length) segments.push({ type: "text", content: text.slice(cursor) });

  return (
    <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">
      {segments.map((seg, i) =>
        seg.type === "mark" && seg.anchorIds ? (
          <mark
            key={i}
            id={seg.anchorIds[0]}
            className="scroll-mt-24 rounded bg-primary/15 px-0.5 text-foreground"
          >
            {seg.anchorIds.slice(1).map((extraId) => (
              <span key={extraId} id={extraId} className="scroll-mt-24" />
            ))}
            {seg.content}
          </mark>
        ) : (
          <span key={i}>{seg.content}</span>
        ),
      )}
    </p>
  );
}
