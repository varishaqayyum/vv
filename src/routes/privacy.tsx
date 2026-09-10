import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";

const title = "Privacy — Statement Clinic";
const description = "How Statement Clinic handles your personal statement and account data.";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: Privacy,
});

function Privacy() {
  return (
    <SiteLayout>
      <div className="mx-auto w-full max-w-3xl px-5 py-16">
        <h1 className="text-4xl">Privacy</h1>
        <div className="mt-6 space-y-4 text-muted-foreground">
          <p>
            Statement Clinic's free personal statement check runs entirely in your browser. The
            answers you write and the feedback you receive are kept only in your current browser
            session — they are not sent to or stored on our servers, and are cleared once your
            session ends.
          </p>
          <p>
            If you create an account (for example, to request a paid Human Review), we store the
            account details and course information you provide using Supabase, our database
            provider, so we can identify your request and get back to you.
          </p>
          <p>
            We don't sell your data, and we don't share it with third parties except where necessary
            to provide the service (such as our database and authentication provider).
          </p>
          <p>
            If you have questions about your data or would like it removed, please get in touch via
            the Contact page.
          </p>
          <p className="text-sm">
            This is a summary for a small, independent project — if you need a more detailed or
            legally reviewed policy for your own use, please have it drafted or reviewed by a
            qualified professional.
          </p>
        </div>
      </div>
    </SiteLayout>
  );
}
