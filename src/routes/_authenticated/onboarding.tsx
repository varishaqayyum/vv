import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "Set up your application — Statement Clinic" },
      { name: "description", content: "Tell us your course." },
      { property: "og:title", content: "Set up your application — Statement Clinic" },
      { property: "og:description", content: "Tell us your course." },
    ],
  }),
  component: Onboarding,
});

function Onboarding() {
  const navigate = useNavigate();
  const [course, setCourse] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;
      const { data } = await supabase
        .from("profiles")
        .select("course")
        .eq("id", auth.user.id)
        .maybeSingle();
      if (!active) return;
      if (data?.course) setCourse(data.course);
      setReady(true);
    })();
    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("You are signed out");
      const { error } = await supabase.from("profiles").upsert({
        id: auth.user.id,
        course,
        onboarding_completed: true,
      });
      if (error) throw error;
      navigate({ to: "/check", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save your details");
    } finally {
      setBusy(false);
    }
  }

  return (
    <SiteLayout>
      <div className="mx-auto w-full max-w-lg px-5 py-16">
        <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
          Step 1 of 1
        </p>
        <h1 className="mt-3 text-3xl">What are you applying for?</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We use this to tailor the prompts and the checks on your statement.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="course">Degree or course</Label>
            <Input
              id="course"
              placeholder="e.g. BSc Economics"
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={busy || !ready}>
            Continue to the checker
          </Button>
        </form>
      </div>
    </SiteLayout>
  );
}
