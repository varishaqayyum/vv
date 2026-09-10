import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";

const title = "Terms — Statement Clinic";
const description = "Terms of use for Statement Clinic.";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: Terms,
});

function Terms() {
  return (
    <SiteLayout>
      <div className="mx-auto w-full max-w-3xl px-5 py-16">
        <h1 className="text-4xl">Terms</h1>
        <div className="mt-6 space-y-4 text-muted-foreground">
          <p>
            Statement Clinic is an independent tool that gives feedback on personal statements you
            have written yourself. It is not affiliated with, endorsed by, or connected to UCAS,
            Imperial College London, or any other university or admissions body.
          </p>
          <p>
            Statement Clinic does not write, rewrite, or generate personal statements. All feedback
            is intended to help you improve your own writing and ideas — the final statement you
            submit to UCAS remains entirely your own work.
          </p>
          <p>
            Feedback is provided as general guidance and does not guarantee any particular outcome,
            offer, or result from any university or admissions process.
          </p>
          <p>
            The paid Human Review is a separate, optional service. Details of what is included are
            set out on the Pricing page.
          </p>
          <p className="text-sm">
            This is a plain-language summary for a small, independent project — if you need formal,
            legally reviewed terms, please have them drafted or reviewed by a qualified
            professional.
          </p>
        </div>
      </div>
    </SiteLayout>
  );
}
