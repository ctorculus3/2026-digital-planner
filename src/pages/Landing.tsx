import { useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Music2, Clock, ListMusic, Headphones, Share2, Target, FolderOpen, TrendingUp, Check, Quote } from "lucide-react";

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
const pricingFeatures = ["Daily practice logging with goals & time tracking", "Scales, warmups & repertoire checklists", "Media tools — audio, YouTube, recordings", "Cloud storage across all your devices", "Share progress with teachers & peers", "Staff paper for notation sketches"];

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
  const {
    signIn,
    signUp
  } = useAuth();
  const {
    toast
  } = useToast();
  const authRef = useRef<HTMLDivElement>(null);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      if (isLogin) {
        const {
          error
        } = await signIn(email, password);
        if (error) throw error;
      } else {
        const {
          error
        } = await signUp(email, password, displayName);
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

      {/* ───── App Preview / Features ───── */}
      <section id="features" className="container mx-auto px-4 py-20 md:py-28">
        <h2 className="font-display text-3xl md:text-4xl font-bold text-center">
          See Your Practice Come to Life
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-center text-muted-foreground">Everything you need to structure, plan, record, and reflect on your daily practice — in one elegant digital planner.</p>

        {/* App mockup */}
        <div className="mx-auto mt-12 max-w-3xl">
          <div className="rounded-xl border border-border bg-card shadow-lg overflow-hidden">
            {/* Browser chrome */}
            <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-4 py-2.5">
              <span className="h-3 w-3 rounded-full bg-destructive/60" />
              <span className="h-3 w-3 rounded-full bg-accent-foreground/60" />
              <span className="h-3 w-3 rounded-full bg-header-bg/60" />
              <span className="ml-4 flex-1 rounded-md bg-background/60 px-3 py-1 text-xs text-muted-foreground text-center">
                practicedaily.app
              </span>
            </div>
            {/* Mock content */}
            <div className="p-6 md:p-8 space-y-4">
              <div className="bg-header-bg h-3 rounded" />
              <div className="grid grid-cols-7 gap-1">
                {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => <div key={i} className="h-8 rounded text-[10px] font-bold flex items-center justify-center text-primary-foreground" style={{
                backgroundColor: `hsl(var(--tab-${["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][i]}))`
              }}>
                    {d}
                  </div>)}
              </div>
              <div className="space-y-2">
                <div className="h-4 rounded bg-muted/40 w-1/3" />
                <div className="h-3 rounded bg-muted/25 w-full" />
                <div className="h-3 rounded bg-muted/25 w-5/6" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-border p-3 space-y-2">
                  <div className="h-3 rounded bg-header-bg/30 w-1/2" />
                  <div className="h-2 rounded bg-muted/20 w-full" />
                  <div className="h-2 rounded bg-muted/20 w-3/4" />
                </div>
                <div className="rounded-lg border border-border p-3 space-y-2">
                  <div className="h-3 rounded bg-primary/30 w-1/2" />
                  <div className="h-2 rounded bg-muted/20 w-full" />
                  <div className="h-2 rounded bg-muted/20 w-2/3" />
                </div>
              </div>
            </div>
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

          <Card className="mx-auto mt-12 max-w-md border-header-bg/30 shadow-lg">
            <CardHeader className="text-center pb-2">
              <CardDescription className="text-xs uppercase tracking-widest text-header-bg font-semibold">
                Monthly
              </CardDescription>
              <CardTitle className="text-5xl font-bold mt-2">
                $3.99
                <span className="text-lg font-normal text-muted-foreground">
                  /mo
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
            <span className="hover:text-foreground cursor-pointer transition-colors">
              Privacy
            </span>
            <span className="hover:text-foreground cursor-pointer transition-colors">
              Terms
            </span>
          </div>
        </div>
      </footer>
    </div>;
}