import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { UCAS_QUESTIONS, TOTAL_CHARACTER_LIMIT, totalCharacters } from "@/lib/statement";


export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Your personal statement desk — StatementDesk" },
      { name: "description", content: "Draft and save the three UCAS personal statement questions." },
      { property: "og:title", content: "Your personal statement desk — StatementDesk" },
      { property: "og:description", content: "Draft and save the three UCAS personal statement questions." },
    ],
  }),
  component: Dashboard,
});

type Statement = {
  id: string;
  answer_one: string;
  answer_two: string;
  answer_three: string;
};

function Dashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<{ course?: string | null; entry_year?: string | null } | null>(null);
  const [answers, setAnswers] = useState({ answer_one: "", answer_two: "", answer_three: "" });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;
      const [{ data: profileData }, { data: statementData }] = await Promise.all([
        supabase.from("profiles").select("course, entry_year, onboarding_completed").eq("id", auth.user.id).maybeSingle(),
        supabase.from("personal_statements").select("id, answer_one, answer_two, answer_three").eq("user_id", auth.user.id).maybeSingle(),
      ]);
      if (!active) return;
      if (profileData && !profileData.onboarding_completed) {
        navigate({ to: "/onboarding", replace: true });
        return;
      }
      if (profileData) setProfile(profileData);
      if (statementData) {
        setAnswers({
          answer_one: statementData.answer_one ?? "",
          answer_two: statementData.answer_two ?? "",
          answer_three: statementData.answer_three ?? "",
        });
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [navigate]);


  const used = totalCharacters(answers);
  const remaining = TOTAL_CHARACTER_LIMIT - used;
  const overLimit = used > TOTAL_CHARACTER_LIMIT;

  const updateAnswer = useCallback((key: keyof typeof answers, value: string) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }, []);

  async function handleSave() {
    if (overLimit) {
      toast.error("Your statement is over the 4,000 character limit. Trim it before saving.");
      return;
    }
    setSaving(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("You are signed out");
      const { error } = await supabase.from("personal_statements").upsert({
        user_id: auth.user.id,
        answer_one: answers.answer_one,
        answer_two: answers.answer_two,
        answer_three: answers.answer_three,
      });
      if (error) throw error;
      setSaved(true);
      toast.success("Saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <SiteLayout>
        <div className="mx-auto w-full max-w-4xl px-5 py-16">
          <p className="text-muted-foreground">Loading your desk...</p>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <div className="mx-auto w-full max-w-4xl px-5 py-10">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl">Your personal statement desk</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {profile?.course ? `${profile.course}` : "No course set yet"}
              {profile?.entry_year ? ` · ${profile.entry_year} entry` : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : saved ? "Saved" : "Save draft"}
            </Button>
            <Button asChild>
              <Link to="/check">Get checked</Link>
            </Button>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-rule/70 bg-card p-4">
          <div>
            <p className="text-sm font-medium">Combined character count</p>
            <p className="text-xs text-muted-foreground">
              UCAS gives you 4,000 characters across all three answers.
            </p>
          </div>
          <div className="text-right">
            <p className={`font-display text-3xl ${overLimit ? "text-destructive" : "text-primary"}`}>
              {used.toLocaleString()}
              <span className="text-base text-muted-foreground"> / {TOTAL_CHARACTER_LIMIT.toLocaleString()}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              {overLimit
                ? `${(used - TOTAL_CHARACTER_LIMIT).toLocaleString()} over`
                : `${remaining.toLocaleString()} remaining`}
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-6">
          {UCAS_QUESTIONS.map((q) => (
            <section
              key={q.key}
              className="rounded-lg border border-rule/70 bg-card p-5 shadow-[0_1px_0_0_var(--rule)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-base font-semibold">
                    <span className="text-primary">0{q.number}.</span> {q.title}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">{q.hint}</p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {answers[q.key].length.toLocaleString()} chars
                </span>
              </div>
              <div className="mt-4">
                <Label htmlFor={q.key} className="sr-only">
                  {q.title}
                </Label>
                <Textarea
                  id={q.key}
                  value={answers[q.key]}
                  onChange={(e) => updateAnswer(q.key, e.target.value)}
                  rows={8}
                  className="resize-y bg-paper"
                  placeholder="Start writing your answer here..."
                />
              </div>
            </section>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button variant="outline" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : saved ? "Saved" : "Save draft"}
          </Button>
          <Button asChild>
            <Link to="/check">Get checked</Link>
          </Button>
        </div>
      </div>
    </SiteLayout>
  );
}
