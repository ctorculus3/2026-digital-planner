import { useState, useRef, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Music2, Clock, ListMusic, Headphones, Share2, Target, FolderOpen, TrendingUp, Check, Quote, Chrome, Activity, Mic, Users, BarChart3, Sparkles } from "lucide-react";
import { lovable } from "@/integrations/lovable/index";
import { PlanToggle } from "@/components/subscription/PlanToggle";

/* ─────────── data ─────────── */

const features = [{
  icon: Clock,
  title: "Daily Practice Logging",
  desc: "Set goals, track time, and build consistency with structured daily entries."
}, {
  icon: ListMusic,
  title: "Scales, Warmups & Repertoire",
  desc: "Organize your routine with checklists for every part of your practice."
}, {
  icon: Headphones,
  title: "Media Tools",
  desc: "Attach reference audio, YouTube videos, and recordings directly to your log."
}, {
  icon: Share2,
  title: "Share With Teachers & Peers",
  desc: "Generate a share link so your teacher or bandmates can see your progress."
}, {
  icon: Activity,
  title: "Built-in Metronome",
  desc: "Practice with an authentic clave-sample metronome. Adjustable BPM with fine-tuning controls."
}, {
  icon: Mic,
  title: "Chromatic Tuner",
  desc: "Tune your instrument in real time using your device microphone with a visual pitch gauge."
}, {
  icon: Users,
  title: "Community Feed",
  desc: "Connect with fellow musicians. Share thoughts on gear, habits, and practice in a dedicated social space."
}, {
  icon: FolderOpen,
  title: "Lesson PDFs",
  desc: "Upload and store lesson PDFs directly in your practice log. View them anytime, anywhere — no more lost sheets."
}, {
  icon: BarChart3,
  title: "Dashboard & Streaks",
  desc: "Visualize your practice history with calendars, time summaries, badges, and streak tracking."
}, {
  icon: Sparkles,
  title: "Music AI Assistant",
  desc: "Ask music theory questions, get practice advice, and receive personalized coaching — all powered by AI, right inside your journal."
}];
const values = [{
  icon: Target,
  title: "Accountability",
  desc: "Track your consistency and see your streak grow."
}, {
  icon: FolderOpen,
  title: "Reference",
  desc: "Keep audio, video, and notes all in one place."
}, {
  icon: TrendingUp,
  title: "Growth",
  desc: "Review your journey and celebrate progress."
}];
const testimonials = [{
  quote: "Practice Daily transformed how I prepare for recitals. Having everything in one place — goals, recordings, notes — keeps me focused and accountable.",
  name: "Sarah M.",
  role: "Violinist, Conservatory Student"
}, {
  quote: "I used to lose track of what I worked on each day. Now I can look back at months of progress and actually see how far I've come.",
  name: "James T.",
  role: "Jazz Guitarist"
}, {
  quote: "The share feature is a game-changer. My students send me their logs before lessons and we hit the ground running every time.",
  name: "Dr. Elena R.",
  role: "Piano Instructor"
}];
const pricingFeatures = ["Daily practice logging with goals & time tracking", "Scales, warmups & repertoire checklists", "Media tools — audio, YouTube, recordings", "Lesson PDF uploads with cloud storage & viewing", "Cloud storage across all your devices", "Share progress with teachers & peers", "Staff paper for notation sketches", "Built-in metronome with clave sample", "Chromatic tuner with real-time pitch detection", "Community feed to connect with musicians", "Dashboard with streaks, badges & practice calendar", "Music AI assistant for theory questions & practice coaching"];

/* ─────────── helpers ─────────── */

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({
    behavior: "smooth"
  });
}

/* ─────────── sub-components ─────────── */

function ScallopDivider() {
  return <div className="relative w-full overflow-hidden">
      <svg viewBox="0 0 100 10" preserveAspectRatio="none" className="w-full h-5 md:h-6">
        <path d="M0,10 C5,0 10,0 15,10 C20,0 25,0 30,10 C35,0 40,0 45,10 C50,0 55,0 60,10 C65,0 70,0 75,10 C80,0 85,0 90,10 C95,0 100,0 100,10 L100,0 L0,0 Z" className="fill-header-bg" />
      </svg>
    </div>;
}

/* ─────────── main component ─────────── */

export default function Landing() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly">("monthly");
  const {
    signIn,
    signUp
  } = useAuth();
  const {
    toast
  } = useToast();
  const authRef = useRef<HTMLDivElement>(null);
  const [searchParams] = useSearchParams();

  // Show toast if user arrives after email verification in a different browser
  useEffect(() => {
    if (searchParams.get("verified") === "true") {
      toast({
        title: "Email verified!",
        description: "Please sign in to continue.",
      });
    }
  }, [searchParams, toast]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) throw error;
      } else {
        const { error } = await signUp(email, password, displayName);
        if (error) throw error;
        toast({
          title: "Check your email",
          description: "We've sent you a confirmation link to verify your account."
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setFormLoading(true);
    sessionStorage.setItem("oauth_in_progress", "true");
    try {
      const { error } = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setFormLoading(false);
    }
  };
  const scrollToAuth = () => authRef.current?.scrollIntoView({
    behavior: "smooth"
  });
  return <div className="min-h-screen bg-background text-foreground">
      {/* ───── Sticky Nav ───── */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <button onClick={() => window.scrollTo({
          top: 0,
          behavior: "smooth"
        })} className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-full bg-header-bg flex items-center justify-center">
              <Music2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-bold tracking-tight">
              Practice Daily
            </span>
          </button>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => {
            setIsLogin(true);
            scrollToAuth();
          }}>
              Sign In
            </Button>
            <Button size="sm" onClick={() => {
            setIsLogin(false);
            scrollToAuth();
          }}>
              Start Free Trial
            </Button>
          </div>
        </div>
      </nav>

      {/* ───── Hero ───── */}
      <section className="relative overflow-hidden bg-header-bg">
        <div className="container mx-auto px-4 py-24 md:py-32 text-center">
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground leading-tight">
            Your Daily Practice, Elevated.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg md:text-xl text-primary-foreground/85">
            Join musicians who track, refine, and grow together. Build
            disciplined habits with a practice journal designed for serious
            musicians.
          </p>
          <div className="mt-6 flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/15 border border-primary-foreground/25 px-4 py-2 text-sm text-primary-foreground">
              <Sparkles className="h-4 w-4" />
              <span>Includes Music AI Assistant — theory questions & practice coaching built in</span>
            </div>
          </div>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="bg-primary-foreground text-header-bg hover:bg-primary-foreground/90 font-semibold text-base px-8" onClick={() => {
            setIsLogin(false);
            scrollToAuth();
          }}>
              Start Your 7-Day Free Trial
            </Button>
            <button onClick={() => {
            setIsLogin(true);
            scrollToAuth();
          }} className="text-primary-foreground/80 hover:text-primary-foreground underline underline-offset-4 text-sm transition-colors">
              Already a member? Sign in
            </button>
          </div>
        </div>
        <ScallopDivider />
      </section>

      {/* ───── What Is This? ───── */}
      <section className="container mx-auto px-4 py-16 md:py-20 text-center">
        <h2 className="font-display text-3xl md:text-4xl font-bold">
          What is Practice Daily?
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground text-lg leading-relaxed">
          Practice Daily is a digital practice journal for musicians. It helps you plan your sessions, log what you worked on, track your progress over time, and share updates with teachers or peers — all from one place. Think of it as a planner, notebook, and progress tracker built specifically for daily music practice.
        </p>
      </section>

      {/* ───── Decorative Divider ───── */}
      <div className="flex items-center justify-center gap-4 py-2">
        <div className="h-px w-16 bg-header-bg/20" />
        <Music2 className="h-5 w-5 text-header-bg/30" />
        <div className="h-px w-16 bg-header-bg/20" />
      </div>

      {/* ───── App Preview / Features ───── */}
      <section id="features" className="container mx-auto px-4 py-20 md:py-28">
        <h2 className="font-display text-3xl md:text-4xl font-bold text-center">
          See Your Practice Come to Life
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-center text-muted-foreground">Everything you need to structure, record, and reflect on your daily practice — in one elegant digital planner.</p>

        {/* App mockup */}
        <div className="mx-auto mt-12 max-w-5xl">
          <div className="relative w-full rounded-xl shadow-lg overflow-hidden aspect-[3/4] md:aspect-[4/3]">
            <iframe
              src="/images/practice-daily-ad.html"
              title="Practice Daily app preview"
              className="absolute inset-0 w-full h-full border-0"
              loading="lazy"
              sandbox="allow-scripts"
            />
          </div>
        </div>

        {/* Feature cards */}
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(f => <Card key={f.title} className="border-border bg-card shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-header-bg/10">
                  <f.icon className="h-5 w-5 text-header-bg" />
                </div>
                <CardTitle className="text-base font-semibold">
                  {f.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </CardContent>
            </Card>)}
        </div>
      </section>

      {/* ───── Community Vision ───── */}
      <section className="bg-header-bg/5 border-y border-border">
        <div className="container mx-auto px-4 py-20 md:py-28 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold">
            Built for Musicians Who Show Up Every Day
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Practice Daily is more than a log — it's the foundation for a
            community of musicians committed to growth through daily, deliberate
            practice.
          </p>
          <div className="mt-14 grid gap-8 sm:grid-cols-3 max-w-4xl mx-auto">
            {values.map(v => <div key={v.title} className="flex flex-col items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-header-bg/10">
                  <v.icon className="h-6 w-6 text-header-bg" />
                </div>
                <h3 className="font-semibold text-lg">{v.title}</h3>
                <p className="text-sm text-muted-foreground">{v.desc}</p>
              </div>)}
          </div>
        </div>
      </section>

      {/* ───── Testimonials ───── */}
      <section id="testimonials" className="container mx-auto px-4 py-20 md:py-28">
        <h2 className="font-display text-3xl md:text-4xl font-bold text-center">
          What Musicians Are Saying
        </h2>
        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {testimonials.map(t => <Card key={t.name} className="border-border bg-card shadow-sm flex flex-col">
              <CardContent className="pt-6 flex-1">
                <Quote className="h-6 w-6 text-header-bg/40 mb-3" />
                <p className="text-sm leading-relaxed italic text-foreground/90">
                  "{t.quote}"
                </p>
              </CardContent>
              <CardFooter className="flex-col items-start gap-0.5">
                <span className="font-semibold text-sm">{t.name}</span>
                <span className="text-xs text-muted-foreground">{t.role}</span>
              </CardFooter>
            </Card>)}
        </div>
      </section>

      {/* ───── Pricing ───── */}
      <section id="pricing" className="bg-header-bg/5 border-y border-border">
        <div className="container mx-auto px-4 py-20 md:py-28 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold">
            Simple, Honest Pricing
          </h2>
          <p className="mt-4 text-muted-foreground">
            One plan. Everything included. Cancel anytime.
          </p>

          <PlanToggle selectedPlan={selectedPlan} onPlanChange={setSelectedPlan} />

          <Card className="mx-auto mt-8 max-w-md border-header-bg/30 shadow-lg">
            <CardHeader className="text-center pb-2">
              <CardDescription className="text-xs uppercase tracking-widest text-header-bg font-semibold">
                {selectedPlan === "monthly" ? "Monthly" : "Yearly"}
              </CardDescription>
              <CardTitle className="text-5xl font-bold mt-2">
                {selectedPlan === "monthly" ? "$3.99" : "$39.99"}
                <span className="text-lg font-normal text-muted-foreground">
                  {selectedPlan === "monthly" ? "/mo" : "/yr"}
                </span>
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                7-day free trial included
              </p>
            </CardHeader>
            <CardContent className="pt-4">
              <ul className="space-y-3 text-left">
                {pricingFeatures.map(f => <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 mt-0.5 text-header-bg shrink-0" />
                    <span>{f}</span>
                  </li>)}
              </ul>
            </CardContent>
            <CardFooter className="flex-col gap-2">
              <Button className="w-full" size="lg" onClick={() => {
              setIsLogin(false);
              scrollToAuth();
            }}>
                Start Free Trial
              </Button>
              <span className="text-xs text-muted-foreground">
                Cancel anytime — no questions asked.
              </span>
            </CardFooter>
          </Card>
        </div>
      </section>

      {/* ───── Auth Section ───── */}
      <section id="auth" ref={authRef} className="container mx-auto px-4 py-20 md:py-28">
        <h2 className="font-display text-3xl md:text-4xl font-bold text-center">
          Ready to Practice?
        </h2>
        <p className="mt-4 text-center text-muted-foreground">
          {isLogin ? "Sign in to access your practice logs." : "Create an account and start your 7-day free trial."}
        </p>

        <Card className="mx-auto mt-10 max-w-md shadow-lg border-primary/20">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-14 h-14 rounded-full bg-header-bg flex items-center justify-center shadow-md">
              <Music2 className="w-7 h-7 text-primary-foreground" />
            </div>
            <CardTitle className="font-display text-xl">
              {isLogin ? "Welcome Back" : "Create Your Account"}
            </CardTitle>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {!isLogin && <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input id="displayName" type="text" placeholder="Your name" value={displayName} onChange={e => setDisplayName(e.target.value)} required />
                </div>}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" disabled={formLoading}>
                {formLoading ? "Loading..." : isLogin ? "Sign In" : "Start Free Trial"}
              </Button>
              <div className="relative w-full">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">or</span>
                </div>
              </div>
              <Button type="button" variant="outline" className="w-full" disabled={formLoading} onClick={async () => {
                setFormLoading(true);
                sessionStorage.setItem("oauth_in_progress", "true");
                try {
                  const { error } = await lovable.auth.signInWithOAuth("apple", {
                    redirect_uri: window.location.origin,
                  });
                  if (error) throw error;
                } catch (error: any) {
                  toast({ title: "Error", description: error.message, variant: "destructive" });
                } finally {
                  setFormLoading(false);
                }
              }}>
                <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                </svg>
                Continue with Apple
              </Button>
              <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
              </button>
            </CardFooter>
          </form>
        </Card>
      </section>

      {/* ───── Footer ───── */}
      <footer className="border-t border-border bg-card">
        <div className="container mx-auto px-4 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-header-bg flex items-center justify-center">
              <Music2 className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display text-sm font-semibold">
              Practice Daily
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Practice Daily. All rights reserved.
          </p>
          <div className="flex gap-6 text-xs text-muted-foreground">
            <Link to="/privacy" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>;
}