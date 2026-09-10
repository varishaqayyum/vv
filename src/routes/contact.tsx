import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";

const title = "Contact — Statement Clinic";
const description = "Get in touch with Statement Clinic.";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: Contact,
});

function Contact() {
  return (
    <SiteLayout>
      <div className="mx-auto w-full max-w-3xl px-5 py-16">
        <h1 className="text-4xl">Contact</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Questions about the free check, a Human Review, or anything else — we'd like to hear from
          you.
        </p>
        <div className="mt-8 rounded-2xl border border-rule/70 bg-card p-6">
          <p className="text-sm text-muted-foreground">
            Email us and we'll get back to you as soon as we can:
          </p>
          <a
            href="mailto:medlock495@gmail.com"
            className="mt-2 block font-display text-xl text-primary hover:underline"
          >
            medlock495@gmail.com
          </a>
        </div>
      </div>
    </SiteLayout>
  );
}
