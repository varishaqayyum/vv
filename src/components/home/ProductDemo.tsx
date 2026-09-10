import { Fragment } from "react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/Reveal";
import { characterCount } from "@/lib/statement";

const EXAMPLE_ANSWER =
  "My interest in Medicine developed further through volunteering at a care home, where I saw how doctors and other healthcare professionals interact with patients. I realised that Medicine is not only about having scientific knowledge, but also about communicating effectively and understanding the needs of different people. I would like to study Medicine to develop my understanding of the human body while gaining the skills needed to provide care and make a positive difference to patients.";

const REFLECTION_EXCERPT =
  "Medicine is not only about having scientific knowledge, but also about communicating effectively and understanding the needs of different people.";

const SPECIFICITY_EXCERPT =
  "gaining the skills needed to provide care and make a positive difference to patients.";

// "Use of Experience" was previously labelled "Specificity" — renamed for
// clarity; the scoring, notes and underlying feedback are unchanged.
const ASSESSMENT_AREAS = [
  {
    label: "Motivation",
    score: 76,
    note: "Shows clear motivation, but could be more personal and specific.",
  },
  {
    label: "Reflection",
    score: 52,
    note: "Some reflection is present, but several points could be developed further.",
  },
  {
    label: "Understanding of Medicine",
    score: 61,
    note: "Shows awareness of communication and scientific knowledge, but could demonstrate a more developed understanding of the profession.",
  },
  {
    label: "Use of Experience",
    score: 48,
    note: "Several ideas are broad and could be linked more closely to what the student actually observed.",
  },
  {
    label: "Academic engagement",
    score: 55,
    note: "Some scientific motivation is present, but the answer could show more evidence of curiosity about Medicine beyond wanting to understand the human body.",
  },
];

const STRENGTHS = [
  {
    title: "Clear motivation",
    body: "You give a direct reason for wanting to study Medicine.",
  },
  {
    title: "Relevant experience",
    body: "Your care-home volunteering provides context for how your interest developed.",
  },
  {
    title: "Awareness of communication",
    body: "You recognise that Medicine involves more than scientific knowledge.",
  },
  {
    title: "Focused answer",
    body: "The response remains relevant to your motivation for studying Medicine.",
  },
];

const PRIORITIES = [
  {
    title: "Develop your reflection",
    priority: "High" as const,
    body: "Your experiences are relevant, but some points stop at telling the reader what you realised rather than showing how you reached that conclusion.",
  },
  {
    title: "Make your motivation more specific",
    priority: "High" as const,
    body: 'Some phrases are broad, such as "understanding the needs of different people" and "make a positive difference". Link these ideas more closely to your own observations and thinking.',
  },
  {
    title: "Demonstrate realistic understanding of Medicine",
    priority: "Medium" as const,
    body: "Consider whether the answer shows enough awareness of Medicine as a demanding profession involving responsibility, uncertainty, teamwork and sustained commitment.",
  },
];

const REFLECTION_JOURNEY = [
  "Experience",
  "What I noticed",
  "Why it mattered",
  "What I learned",
  "How it strengthened my motivation",
];

function HighlightedExample() {
  const firstIdx = EXAMPLE_ANSWER.indexOf(REFLECTION_EXCERPT);
  const secondIdx = EXAMPLE_ANSWER.indexOf(SPECIFICITY_EXCERPT);
  const before = EXAMPLE_ANSWER.slice(0, firstIdx);
  const between = EXAMPLE_ANSWER.slice(firstIdx + REFLECTION_EXCERPT.length, secondIdx);
  const after = EXAMPLE_ANSWER.slice(secondIdx + SPECIFICITY_EXCERPT.length);

  return (
    <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed sm:text-base">
      {before}
      <mark
        id="demo-excerpt-reflection"
        className="scroll-mt-24 rounded bg-primary/15 px-0.5 text-foreground"
      >
        {REFLECTION_EXCERPT}
      </mark>
      {between}
      <mark
        id="demo-excerpt-specificity"
        className="scroll-mt-24 rounded bg-primary/15 px-0.5 text-foreground"
      >
        {SPECIFICITY_EXCERPT}
      </mark>
      {after}
    </p>
  );
}

function ReflectionJourneyDiagram() {
  return (
    <div className="mt-4 flex flex-col items-stretch gap-1 sm:flex-row sm:items-center sm:gap-1">
      {REFLECTION_JOURNEY.map((step, i) => (
        <Fragment key={step}>
          <div className="rounded-lg border border-rule/70 bg-paper/70 px-3 py-2 text-center text-xs font-medium sm:flex-1 sm:text-sm">
            {step}
          </div>
          {i < REFLECTION_JOURNEY.length - 1 && (
            <span className="self-center text-primary sm:rotate-[-90deg]" aria-hidden="true">
              ↓
            </span>
          )}
        </Fragment>
      ))}
    </div>
  );
}

export function ProductDemo() {
  const charCount = characterCount(EXAMPLE_ANSWER);

  return (
    <div className="space-y-8">
      {/* Question + example answer + counter, styled like the real checker */}
      <div className="overflow-hidden rounded-2xl border border-rule/70 bg-card shadow-[0_20px_60px_-30px_oklch(0.24_0.02_60/0.35)]">
        <div className="flex items-center justify-between gap-2 border-b border-rule/70 bg-paper/70 px-6 py-4 sm:px-8">
          <Badge className="bg-primary text-primary-foreground">
            Free check example — see what your personal statement could be missing
          </Badge>
        </div>
        <div className="px-6 py-6 sm:px-8">
          <span className="font-display text-2xl text-primary">01</span>
          <h3 className="mt-1 text-sm font-semibold text-muted-foreground">
            Why do you want to study this course or subject?
          </h3>
          <HighlightedExample />
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-rule/70 pt-4">
            <span className="text-sm font-semibold">
              {charCount.toLocaleString()} / 4,000 characters
            </span>
            <span className="text-xs font-medium text-primary">
              ✓ Within the 4,000-character limit
            </span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            While drafting, the real checker still lets you go over 4,000 characters across all
            three questions combined — it'll simply tell you how far over you are.
          </p>
        </div>
      </div>

      {/* Two-column preview: deliberately positioned, not masonry — both
          columns start together right under the answer card. */}
      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        {/* LEFT */}
        <div className="space-y-6">
          {/* What you're doing well */}
          <Reveal>
            <div className="rounded-2xl border border-rule/70 bg-card p-6 sm:p-8">
              <h3 className="text-lg font-semibold">What you're doing well</h3>
              <ul className="mt-4 space-y-3">
                {STRENGTHS.map((s) => (
                  <li key={s.title} className="text-sm">
                    <span className="flex gap-2 font-medium">
                      <span className="text-primary">✓</span> {s.title}
                    </span>
                    <span className="ml-6 text-muted-foreground">{s.body}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          {/* What I'd work on first */}
          <Reveal>
            <div className="rounded-2xl border border-rule/70 bg-card p-6 sm:p-8">
              <h3 className="text-lg font-semibold">What I'd work on first</h3>
              <div className="mt-4 space-y-5">
                {PRIORITIES.map((p, i) => (
                  <div key={p.title}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold">
                        <span className="text-primary">0{i + 1} —</span> {p.title}
                      </p>
                      <Badge variant={p.priority === "High" ? "default" : "secondary"}>
                        Priority: {p.priority}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{p.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          {/* Admissions-reader perspective */}
          <Reveal>
            <div className="rounded-2xl border border-primary/40 bg-card p-6 sm:p-8">
              <h3 className="text-lg font-semibold">
                How this may come across to an admissions reader
              </h3>
              <div className="mt-4 space-y-3 text-sm">
                <div>
                  <p className="font-semibold">What stands out</p>
                  <p className="text-muted-foreground">
                    Clear motivation and relevant volunteering experience. The answer shows that the
                    applicant understands Medicine involves both scientific knowledge and
                    communication.
                  </p>
                </div>
                <div>
                  <p className="font-semibold">What may leave the reader wanting more</p>
                  <p className="text-muted-foreground">
                    The applicant makes several positive claims about Medicine, but does not always
                    show the thinking behind those claims. The reader may want more evidence of what
                    the applicant personally observed and learned.
                  </p>
                </div>
                <div>
                  <p className="font-semibold">Biggest opportunity</p>
                  <p className="text-muted-foreground">
                    Develop the reflection and specificity so that the answer demonstrates the
                    applicant's own developing understanding of Medicine rather than mainly telling
                    the reader what they believe.
                  </p>
                </div>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                This is an informed perspective, not a claim that we know exactly what an admissions
                team would think.
              </p>
            </div>
          </Reveal>
        </div>

        {/* RIGHT */}
        <div className="space-y-6">
          {/* Assessment areas */}
          <Reveal>
            <div className="rounded-2xl border border-rule/70 bg-card p-6 sm:p-8">
              <h3 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                Question 1 assessment
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                These are Statement Clinic's feedback indicators, not official medical-school scores
                — and the figures here are illustrative for this homepage example.
              </p>
              <div className="mt-5 space-y-4">
                {ASSESSMENT_AREAS.map((area) => (
                  <div key={area.label}>
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm font-medium">{area.label}</span>
                      <span className="text-xs text-muted-foreground">{area.score}%</span>
                    </div>
                    <Progress value={area.score} className="mt-1.5 h-1.5" />
                    <p className="mt-1 text-xs text-muted-foreground">{area.note}</p>
                  </div>
                ))}
              </div>
              <p className="mt-4 border-t border-rule/70 pt-3 text-sm text-muted-foreground">
                Showing some of the areas assessed —{" "}
                <span className="font-semibold text-foreground">
                  your full check looks across a wider range of criteria.
                </span>
              </p>
            </div>
          </Reveal>

          {/* Specific feedback: reflection — continues the right-hand stream
              underneath Question 1 assessment rather than leaving that column
              short while the left column keeps going. */}
          <Reveal>
            <div className="rounded-2xl border border-rule/70 bg-card p-6 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-lg font-semibold">Reflection</h3>
                <Badge variant="secondary">Needs development</Badge>
              </div>
              <p className="mt-3 text-xs font-semibold text-muted-foreground uppercase">
                Your writing
              </p>
              <blockquote className="mt-1 border-l-2 border-primary/40 pl-3 text-sm italic">
                "{REFLECTION_EXCERPT}"
              </blockquote>
              <a
                href="#demo-excerpt-reflection"
                className="mt-1 inline-block text-xs text-primary underline underline-offset-2"
              >
                See it in the example above ↑
              </a>
              <p className="mt-3 text-sm text-muted-foreground">
                You correctly identify communication as important, but you don't explain why it is
                important. What did you observe that made you realise this? How could poor
                communication affect a patient's understanding, trust or care? Adding this
                reflection would make the point much more meaningful.
              </p>
              <p className="mt-3 text-xs font-semibold text-muted-foreground uppercase">
                Questions to consider
              </p>
              <ul className="mt-1 space-y-1 text-sm text-muted-foreground">
                <li>• What did you observe that made you realise communication was important?</li>
                <li>• Why did that observation matter to you?</li>
                <li>
                  • How could poor communication affect a patient's understanding, trust or care?
                </li>
                <li>
                  • Did the experience change or challenge anything you previously thought about
                  Medicine?
                </li>
              </ul>
            </div>
          </Reveal>
        </div>
      </div>

      {/* Remaining feedback, full width once both columns have progressed
          through their initial content */}
      <div className="space-y-8">
        {/* Specific feedback: use of experience + reflection framework */}
        <Reveal>
          <div className="rounded-2xl border border-rule/70 bg-card p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-lg font-semibold">Use of Experience</h3>
              <Badge variant="secondary">Could be stronger</Badge>
            </div>
            <p className="mt-3 text-xs font-semibold text-muted-foreground uppercase">
              Your writing
            </p>
            <blockquote className="mt-1 border-l-2 border-primary/40 pl-3 text-sm italic">
              "...{SPECIFICITY_EXCERPT}"
            </blockquote>
            <a
              href="#demo-excerpt-specificity"
              className="mt-1 inline-block text-xs text-primary underline underline-offset-2"
            >
              See it in the example above ↑
            </a>
            <p className="mt-3 text-sm text-muted-foreground">
              The sentiment is positive, but "make a positive difference" is very common in medical
              applications. A more specific conclusion that links back to your own motivation would
              make the ending more memorable.
            </p>
            <p className="mt-3 text-xs text-muted-foreground italic">
              Statement Clinic won't write a replacement sentence for you — it points at what to
              think about so the words stay yours.
            </p>
            <div className="mt-5 border-t border-rule/70 pt-5">
              <p className="text-xs font-semibold text-muted-foreground uppercase">
                A useful way to think about reflection
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Strong reflection often comes from developing your own thought process, not just
                describing what happened. This isn't a formula every answer must follow — just one
                useful way to check whether an experience has been fully unpacked.
              </p>
              <ReflectionJourneyDiagram />
            </div>
          </div>
        </Reveal>

        {/* Specific feedback: understanding of Medicine */}
        <Reveal>
          <div className="rounded-2xl border border-rule/70 bg-card p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-lg font-semibold">Understanding of Medicine</h3>
              <Badge variant="secondary">Could be developed</Badge>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              The answer shows enthusiasm for Medicine, but it currently presents the profession
              mainly through scientific knowledge, communication and helping patients. Consider
              whether your experiences have also helped you understand the responsibility,
              uncertainty, teamwork and sustained commitment involved in a medical career.
            </p>
            <p className="mt-3 text-xs font-semibold text-muted-foreground uppercase">
              Questions to consider
            </p>
            <ul className="mt-1 space-y-1 text-sm text-muted-foreground">
              <li>
                • What have you seen that made you appreciate the realities of working in
                healthcare?
              </li>
              <li>• What responsibilities did you observe healthcare professionals taking on?</li>
              <li>
                • Did anything you experienced challenge your initial expectations of Medicine?
              </li>
            </ul>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
