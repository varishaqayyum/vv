import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Menu } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trackPageView } from "@/lib/analytics";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const navItems = [
  { to: "/how-it-works", label: "How it works" },
  { to: "/", hash: "about", label: "About" },
  { to: "/pricing", label: "Pricing" },
] as const;

type NavTarget = { to: string; hash?: string };

export function SiteLayout({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  // "/#about" is a same-page anchor, not a distinct route, so TanStack's
  // route-based activeProps can't tell it apart from just being on "/" —
  // that's what made About render permanently bold on the homepage. Match
  // it on the hash instead, so it's only "active" when actually at #about,
  // giving it the same "active at destination" rule as the other two links.
  const currentHash = useLocation({ select: (loc) => loc.hash });
  const isAboutActive = currentHash === "#about";
  const currentPathname = useLocation({ select: (loc) => loc.pathname });

  // Fires once per route change. This is the only place page views are
  // tracked — a single, minimal hook in the layout every page already
  // shares, rather than adding tracking calls to every individual route.
  useEffect(() => {
    trackPageView(currentPathname);
  }, [currentPathname]);

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  // Close the mobile sheet, then navigate only once it has actually finished
  // closing. Navigating *while* the sheet is still open/closing races with
  // Radix's own scroll-lock release — the dialog restores the pre-open
  // scroll position as part of closing, which can silently undo a same-tick
  // "jump to #about" if that happens first. Waiting past the sheet's own
  // 300ms close animation guarantees our navigation (and About's scroll
  // correction) runs after the lock is fully released, not during it.
  function closeThenNavigate(target: NavTarget) {
    setMobileNavOpen(false);
    window.setTimeout(() => {
      navigate(target.hash ? { to: target.to, hash: target.hash } : { to: target.to });
    }, 320);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-rule/70 bg-paper/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-5 py-4">
          <Link to="/" className="font-display text-lg font-semibold tracking-tight">
            Statement <span className="text-primary">Clinic</span>
          </Link>
          <nav className="hidden items-center gap-8 text-base font-medium sm:flex">
            {navItems.map((item) =>
              "hash" in item ? (
                // A same-page anchor, not a distinct route — it must never pick up
                // active-route styling just because "/" happens to be the current
                // path, or it reads as permanently bold/active on the homepage.
                <Link
                  key={item.label}
                  to={item.to}
                  hash={item.hash}
                  className={`transition-colors hover:text-primary ${
                    isAboutActive ? "font-semibold text-foreground" : "text-foreground/75"
                  }`}
                >
                  {item.label}
                </Link>
              ) : (
                <Link
                  key={item.label}
                  to={item.to}
                  activeProps={{ className: "text-foreground font-semibold" }}
                  inactiveProps={{ className: "text-foreground/75" }}
                  className="transition-colors hover:text-primary"
                >
                  {item.label}
                </Link>
              ),
            )}
          </nav>
          <div className="flex items-center gap-2">
            {/* Mobile nav — only rendered below the sm breakpoint; the
                existing desktop <nav> and account buttons above/below are
                completely untouched for sm and up. */}
            <div className="flex items-center gap-2 sm:hidden">
              <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Open menu">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-72">
                  <SheetTitle className="font-display">
                    Statement <span className="text-primary">Clinic</span>
                  </SheetTitle>
                  <SheetDescription className="sr-only">Site navigation</SheetDescription>
                  <nav className="mt-6 flex flex-col gap-1 text-base font-medium">
                    {navItems.map((item) => (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => closeThenNavigate(item)}
                        className={`rounded-md px-2 py-3 text-left transition-colors hover:bg-paper/70 ${
                          "hash" in item && isAboutActive
                            ? "font-semibold text-foreground"
                            : "text-foreground/75"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </nav>
                  <div className="mt-6 flex flex-col gap-2 border-t border-rule/70 pt-6">
                    {loading ? null : session ? (
                      <>
                        <Button
                          variant="ghost"
                          className="justify-start"
                          onClick={() => closeThenNavigate({ to: "/account" })}
                        >
                          My Account
                        </Button>
                        <Button
                          variant="ghost"
                          className="justify-start"
                          onClick={() => closeThenNavigate({ to: "/check" })}
                        >
                          Checker
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setMobileNavOpen(false);
                            handleSignOut();
                          }}
                        >
                          Sign out
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="ghost"
                          className="justify-start"
                          onClick={() => closeThenNavigate({ to: "/auth" })}
                        >
                          Log in
                        </Button>
                        <Button onClick={() => closeThenNavigate({ to: "/check" })}>
                          Get your statement checked
                        </Button>
                      </>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
            <div className="hidden items-center gap-2 sm:flex">
              {loading ? null : session ? (
                <>
                  <Button asChild variant="ghost" size="sm">
                    <Link to="/account">My Account</Link>
                  </Button>
                  <Button asChild variant="ghost" size="sm">
                    <Link to="/check">Checker</Link>
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleSignOut}>
                    Sign out
                  </Button>
                </>
              ) : (
                <>
                  <Button asChild variant="ghost" size="sm">
                    <Link to="/auth">Log in</Link>
                  </Button>
                  <Button asChild size="sm">
                    <Link to="/check">Get your statement checked</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-rule/70 bg-paper/70">
        <div className="mx-auto w-full max-w-5xl px-5 py-10 text-sm text-muted-foreground">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="font-display text-base font-semibold tracking-tight text-foreground">
                Statement <span className="text-primary">Clinic</span>
              </p>
              <p className="mt-1 max-w-xs">Your ideas. Your experiences. Better applications.</p>
            </div>
            <nav className="grid grid-cols-2 gap-x-8 gap-y-2 sm:flex sm:gap-8">
              <Link to="/how-it-works" className="transition-colors hover:text-foreground">
                How it works
              </Link>
              <Link to="/" hash="about" className="transition-colors hover:text-foreground">
                About
              </Link>
              <Link to="/pricing" className="transition-colors hover:text-foreground">
                Pricing
              </Link>
              <Link to="/privacy" className="transition-colors hover:text-foreground">
                Privacy
              </Link>
              <Link to="/terms" className="transition-colors hover:text-foreground">
                Terms
              </Link>
              <Link to="/contact" className="transition-colors hover:text-foreground">
                Contact
              </Link>
            </nav>
          </div>
          <p className="mt-6 text-xs">
            Built to help medicine and dentistry applicants improve their own personal statements —
            not write them for them.
          </p>
        </div>
      </footer>
    </div>
  );
}
