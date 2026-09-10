import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/Reveal";
import { ProductDemo } from "@/components/home/ProductDemo";

const title = "How Statement Clinic works — free UCAS personal statement feedback";
const description =
  "Statement Clinic helps you see what's working in your UCAS personal statement, what could be stronger, and what you may have overlooked — without writing it for you.";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: HowItWorks,
});

const STEPS = [
  {
    title: "Start your statement",
    body: "Tell us what course you're applying for, then work through the three UCAS questions.",
  },
  {
    title: "Write in your own words",
    body: "Add your ideas and experiences to each question. Your answers are counted together so you can stay within the 4,000-character limit.",
  },
  {
    title: "Get your free check",
    body: "Submit your statement and instantly see what comes through in your writing — including your strengths, reflection, experiences and areas that could be developed.",
  },
  {
    title: "Decide what to improve",
    body: "Use the feedback to improve your own statement. If you want more personalised advice, you can then request a human review.",
  },
];

function HowItWorks() {
  return (
    <SiteLayout>
      <div className="mx-auto w-full max-w-3xl px-5 py-16 sm:py-20">
        <h1 className="text-4xl sm:text-5xl">How it works</h1>
        <p className="mt-4 font-display text-xl text-primary">
          Your ideas. Your experiences. A stronger application.
        </p>
        <p className="mt-5 text-lg text-muted-foreground">
          Statement Clinic helps you see what's working in your UCAS personal statement, what could
          be stronger, and what you may have overlooked — without writing it for you.
        </p>

        <ol className="mt-12 space-y-6">
          {STEPS.map((step, i) => (
            <Reveal key={step.title} delay={i * 90}>
              <li className="flex gap-5 rounded-2xl border border-rule/70 bg-card p-6">
                <span className="font-display text-3xl text-primary">0{i + 1}</span>
                <div>
                  <h2 className="text-lg font-semibold">{step.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{step.body}</p>
                </div>
              </li>
            </Reveal>
          ))}
        </ol>

        <Reveal delay={STEPS.length * 90}>
          <div className="mt-14 rounded-2xl border border-primary/40 bg-card p-8 text-center sm:p-10">
            <h2 className="text-2xl">Not sure if your statement is strong enough?</h2>
            <p className="mt-2 text-muted-foreground">
              Get your free check and see what comes through.
            </p>
            <div className="mt-6 flex justify-center">
              <Button asChild size="lg">
                <Link to="/check">Check my statement</Link>
              </Button>
            </div>
          </div>
        </Reveal>
      </div>

      {/* Existing example/demo (same shared component used elsewhere on the
          site) — placed here, after the 01-04 explanation, so visitors see a
          realistic example of the result before the detailed feedback page. */}
      <div className="mx-auto w-full max-w-3xl px-5 pb-16 sm:pb-24">
        <Reveal>
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl">Example feedback</h2>
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
    </SiteLayout>
  );
}
