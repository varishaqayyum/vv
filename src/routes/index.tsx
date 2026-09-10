import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/Reveal";
import { ProductDemo } from "@/components/home/ProductDemo";
import { Faq } from "@/components/home/Faq";
import { HUMAN_REVIEW_PRICE, HUMAN_REVIEW_POINTS } from "@/lib/human-review";
import { trackEvent } from "@/lib/analytics";

const title = "Statement Clinic — get your UCAS personal statement checked";
const description =
  "See what's missing from your medicine or dentistry personal statement. Get free, specific feedback on your three UCAS answers while keeping every word your own.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: Home,
});

const QUESTION_GUIDANCE = [
  {
    number: 1,
    label: "Your motivation",
    question: "Why do you want to study Medicine?",
    guidance:
      "Show genuine motivation for the subject and demonstrate that your interest has developed through meaningful experiences, observations and reflection.",
  },
  {
    number: 2,
    label: "Your academic preparation",
    question: "How have your studies prepared you?",
    guidance:
      "Go beyond listing subjects or grades. Show how your academic learning has developed your understanding, curiosity and skills relevant to studying Medicine.",
  },
  {
    number: 3,
    label: "Your experiences",
    question: "What have you done outside education?",
    guidance:
      "Use experiences to show what you have observed, learned and reflected on — not simply what you participated in.",
  },
];

const HOW_IT_WORKS = [
  {
    title: "Add your answers",
    body: "Add your three UCAS answers and track your shared 4,000-character limit.",
  },
  {
    title: "Get your feedback",
    body: "Your statement is analysed for reflection, specificity, evidence, academic engagement, understanding of the profession and other relevant qualities.",
  },
  {
    title: "Know what to improve",
    body: "Get clear, actionable feedback showing where to focus next — without someone writing your statement for you.",
  },
];

const WHY_CARDS = [
  {
    icon: "🧠",
    title: "Feedback on your ideas",
    body: "Understand what's already strong and where your thinking could go further.",
  },
  {
    icon: "🔎",
    title: "Specific, not generic",
    body: "Feedback should be based on what you actually wrote rather than simply looking for buzzwords.",
  },
  {
    icon: "✍️",
    title: "Your statement stays yours",
    body: "Statement Clinic helps you improve your own ideas rather than generating your personal statement for you.",
  },
  {
    icon: "🎓",
    title: "Built for applicants",
    body: "Created to help UK medicine and dentistry applicants navigate the personal statement process.",
  },
];

function Home() {
  return (
    <SiteLayout>
      {/* HERO */}
      <section className="mx-auto w-full max-w-5xl px-5 pt-16 pb-14 sm:pt-24 sm:pb-20">
        <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
          For UK medicine & dentistry applicants
        </p>
        <h1 className="mt-5 max-w-3xl text-3xl leading-tight sm:text-4xl md:text-5xl">
          Want to know what's missing from your personal statement?
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
          Get personalised feedback on your three UCAS answers — see what's working, what's missing
          and what you could strengthen, while keeping every word your own.
        </p>
        <div className="mt-9 flex flex-wrap gap-3">
          <Button asChild size="lg" className="text-base font-semibold">
            <Link to="/check">Check my personal statement — Free</Link>
          </Button>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <Reveal>
        <section className="mx-auto w-full max-w-5xl px-5 py-16 sm:py-24">
          <h2 className="text-2xl sm:text-3xl">How it works</h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-3">
            {HOW_IT_WORKS.map((step, i) => (
              <Reveal key={step.title} delay={i * 100}>
                <div className="h-full rounded-2xl border border-rule/70 bg-card p-6">
                  <span className="font-display text-2xl text-primary">0{i + 1}</span>
                  <h3 className="mt-2 text-base font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <div className="mt-9">
            <Button asChild variant="outline" size="lg">
              <Link to="/check">Try it for free →</Link>
            </Button>
          </div>

          {/* Example feedback — same shared ProductDemo component used sitewide */}
          <div className="mt-16 border-t border-rule/70 pt-16">
            <Reveal>
              <div className="text-center">
                <h3 className="text-2xl sm:text-3xl">Example feedback</h3>
                <p className="mt-2 font-display text-lg text-primary">
                  A glimpse of how the tool works
                </p>
                <p className="mt-3 text-muted-foreground">
                  See what the free check looks for in your personal statement.
                </p>
              </div>
            </Reveal>
            <div className="mt-10">
              <ProductDemo />
            </div>
          </div>
        </section>
      </Reveal>

      {/* WHAT MAKES A STRONG RESPONSE */}
      <Reveal>
        <section className="mx-auto w-full max-w-5xl px-5 py-16 sm:py-24">
          <h2 className="text-2xl sm:text-3xl">What makes a strong response to each question</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {QUESTION_GUIDANCE.map((q, i) => (
              <Reveal key={q.number} delay={i * 100}>
                <article className="h-full rounded-2xl border border-rule/70 bg-card p-6 transition-shadow hover:shadow-md">
                  <span className="font-display text-3xl text-primary">0{q.number}</span>
                  <span className="mt-1 block text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    {q.label}
                  </span>
                  <h3 className="mt-2 text-base font-semibold">{q.question}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{q.guidance}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </section>
      </Reveal>

      {/* WHY STATEMENT CLINIC */}
      <Reveal>
        <section className="border-y border-rule/70 bg-paper/60 py-16 sm:py-24">
          <div className="mx-auto w-full max-w-5xl px-5">
            <h2 className="text-2xl sm:text-3xl">Not another personal statement generator</h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {WHY_CARDS.map((card, i) => (
                <Reveal key={card.title} delay={i * 80}>
                  <div className="h-full rounded-2xl border border-rule/70 bg-card p-6">
                    <span className="text-2xl" aria-hidden="true">
                      {card.icon}
                    </span>
                    <h3 className="mt-3 text-base font-semibold">{card.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{card.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      {/* ABOUT */}
      <Reveal hashId="about">
        <section
          id="about"
          className="scroll-mt-8 border-y border-rule/70 bg-paper/60 py-16 sm:py-24"
        >
          <div className="mx-auto w-full max-w-3xl px-5">
            <h2 className="text-2xl sm:text-3xl">Who's behind Statement Clinic?</h2>
            <div className="mt-6 space-y-4 text-muted-foreground">
              <p>
                Statement Clinic was built by a second-year Medical Student at Imperial College
                London, not long after going through the medicine application process themselves.
                Turning years of experiences, motivation and half-formed ideas into a coherent,
                honest 4,000 characters is genuinely hard — and it's easy to lose sight of what's
                actually coming through on the page.
              </p>
              <p>
                One of the hardest parts for me was stepping back from my own writing and working
                out which key criteria I had covered, what was missing, and how effectively I had
                demonstrated each one. That experience inspired me to build Statement Clinic: a tool
                designed to help applicants identify what is already coming through, what may be
                missing, and where their own experiences could be developed further.
              </p>
              <p>
                Statement Clinic exists to give applicants useful, honest feedback on their own
                writing — without taking ownership of the statement away from them. It won't write
                your statement for you. Instead, it helps you see what's already working, what could
                be stronger, and where your own ideas could be developed further.
              </p>
              <p>
                It's a small, independent project, built with the specific challenges of medicine
                and dentistry applications in mind — and with a genuine understanding of how it
                feels to be on the other side of the blank page.
              </p>
            </div>
          </div>
        </section>
      </Reveal>

      {/* HUMAN REVIEW */}
      <Reveal>
        <section className="mx-auto w-full max-w-4xl px-5 py-16 sm:py-24">
          <div className="rounded-2xl border border-primary/40 bg-card p-8 sm:p-12">
            <h2 className="text-2xl sm:text-3xl">Want a second pair of eyes?</h2>
            <p className="mt-2 font-display text-xl text-primary">
              Human Personal Statement Review — {HUMAN_REVIEW_PRICE}
            </p>
            <ul className="mt-6 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
              {HUMAN_REVIEW_POINTS.map((point) => (
                <li key={point} className="flex gap-2">
                  <span className="text-primary">✓</span>
                  {point}
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <Button asChild size="lg">
                <Link to="/pricing" onClick={() => trackEvent("human_review_clicked")}>
                  Get a human review →
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </Reveal>

      {/* FAQ */}
      <Reveal>
        <section className="mx-auto w-full max-w-3xl px-5 py-16 sm:py-24">
          <h2 className="text-2xl sm:text-3xl">Frequently asked questions</h2>
          <div className="mt-8">
            <Faq />
          </div>
        </section>
      </Reveal>

      {/* FINAL CTA */}
      <Reveal>
        <section className="mx-auto w-full max-w-3xl px-5 pb-20 text-center sm:pb-28">
          <h2 className="text-2xl sm:text-3xl">Ready to see what's missing?</h2>
          <p className="mt-3 text-muted-foreground">
            Get feedback on your own ideas, experiences and writing — and find out what to work on
            next.
          </p>
          <div className="mt-7 flex justify-center">
            <Button asChild size="lg" className="text-base font-semibold">
              <Link to="/check">Check my personal statement — Free</Link>
            </Button>
          </div>
        </section>
      </Reveal>
    </SiteLayout>
  );
}
