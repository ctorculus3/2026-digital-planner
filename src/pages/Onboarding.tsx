import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Music2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useOnboardingSurvey, SurveyData } from "@/hooks/useOnboardingSurvey";
import { supabase } from "@/integrations/supabase/client";

const INSTRUMENTS = [
  { name: "Piano", emoji: "\u{1F3B9}" },
  { name: "Guitar", emoji: "\u{1F3B8}" },
  { name: "Violin/Viola", emoji: "\u{1F3BB}" },
  { name: "Cello", emoji: "\u{1F3BB}" },
  { name: "Bass", emoji: "\u{1F3B8}" },
  { name: "Flute", emoji: "\u{1FA88}" },
  { name: "Clarinet", emoji: "\u{1F3B5}" },
  { name: "Saxophone", emoji: "\u{1F3B7}" },
  { name: "Trumpet", emoji: "\u{1F3BA}" },
  { name: "Trombone", emoji: "\u{1F3BA}" },
  { name: "Voice/Vocal", emoji: "\u{1F3A4}" },
  { name: "Drums/Percussion", emoji: "\u{1F941}" },
  { name: "Other", emoji: "\u{1F3B5}" },
];

const GENRES = [
  "Classical",
  "Jazz",
  "Pop",
  "Rock",
  "Folk",
  "Country",
  "R&B",
  "Hip-Hop",
  "Electronic",
  "Latin",
  "Gospel",
  "Musical Theater",
  "World Music",
  "Other",
];

const SKILL_LEVELS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
  { value: "professional", label: "Professional" },
];

const PRACTICE_FREQUENCIES = [
  { value: "daily", label: "Daily" },
  { value: "few_times_week", label: "A few times a week" },
  { value: "weekly", label: "Weekly" },
  { value: "rarely", label: "Rarely" },
  { value: "just_starting", label: "Just starting out" },
];

const PRACTICE_GOALS = [
  { value: "build_habit", label: "Build a consistent habit" },
  { value: "prepare_performance", label: "Prepare for a performance/audition" },
  { value: "learn_instrument", label: "Learn a new instrument" },
  { value: "improve_technique", label: "Improve technique" },
  { value: "have_fun", label: "Have fun and stay creative" },
];

const REFERRAL_SOURCES = [
  { value: "google_search", label: "Google search" },
  { value: "social_media", label: "Social media" },
  { value: "friend_teacher", label: "Friend or teacher" },
  { value: "other", label: "Other" },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { completed, submitting, submitSurvey } = useOnboardingSurvey();

  const [instruments, setInstruments] = useState<string[]>([]);
  const [genres, setGenres] = useState<string[]>([]);
  const [birthday, setBirthday] = useState("");
  const [skillLevel, setSkillLevel] = useState("");
  const [practiceFrequency, setPracticeFrequency] = useState("");
  const [practiceGoal, setPracticeGoal] = useState("");
  const [referralSource, setReferralSource] = useState("");

  // If survey is already completed, redirect to home
  useEffect(() => {
    if (completed === true) {
      navigate("/", { replace: true });
    }
  }, [completed, navigate]);

  const toggleInstrument = (name: string) => {
    setInstruments((prev) =>
      prev.includes(name) ? prev.filter((i) => i !== name) : [...prev, name]
    );
  };

  const toggleGenre = (genre: string) => {
    setGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  const isValid =
    instruments.length > 0 &&
    genres.length > 0 &&
    birthday &&
    skillLevel &&
    practiceFrequency &&
    practiceGoal &&
    referralSource;

  const handleContinue = async () => {
    if (!isValid) {
      toast({
        title: "Please answer all questions",
        description: "All fields are required to continue.",
        variant: "destructive",
      });
      return;
    }

    const surveyData: SurveyData = {
      instruments,
      genres,
      birthday,
      skill_level: skillLevel,
      practice_frequency: practiceFrequency,
      practice_goal: practiceGoal,
      referral_source: referralSource,
    };

    const success = await submitSurvey(surveyData);
    if (!success) {
      toast({
        title: "Error",
        description: "Failed to save your responses. Please try again.",
        variant: "destructive",
      });
      return;
    }

    // Redirect to Stripe checkout
    try {
      const { data, error } = await supabase.functions.invoke(
        "create-checkout",
        { body: { plan: "monthly" } }
      );
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (err: any) {
      console.warn("Checkout redirect failed:", err);
      // Fall back to the subscription gate which will show the paywall
      navigate("/", { replace: true });
    }
  };

  // Show loading while checking survey completion
  if (completed === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-lg border-primary/20">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-14 h-14 rounded-full bg-header-bg flex items-center justify-center shadow-md">
            <Music2 className="w-7 h-7 text-primary-foreground" />
          </div>
          <CardTitle className="font-display text-xl">
            Tell us about yourself
          </CardTitle>
          <CardDescription>
            Help us personalize your practice experience
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-8">
          {/* Q1: Instruments */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              What instrument(s) do you play?
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {INSTRUMENTS.map((instrument) => (
                <label
                  key={instrument.name}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 cursor-pointer transition-colors text-sm ${
                    instruments.includes(instrument.name)
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <Checkbox
                    checked={instruments.includes(instrument.name)}
                    onCheckedChange={() => toggleInstrument(instrument.name)}
                  />
                  <span className="text-base">{instrument.emoji}</span>
                  {instrument.name}
                </label>
              ))}
            </div>
          </div>

          {/* Q2: Genres */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              What genre(s) of music do you enjoy?
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {GENRES.map((genre) => (
                <label
                  key={genre}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 cursor-pointer transition-colors text-sm ${
                    genres.includes(genre)
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <Checkbox
                    checked={genres.includes(genre)}
                    onCheckedChange={() => toggleGenre(genre)}
                  />
                  {genre}
                </label>
              ))}
            </div>
          </div>

          {/* Q3: Birthday */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              When is your birthday?
            </Label>
            <Input
              type="date"
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
              className="w-full"
              max={new Date().toISOString().split("T")[0]}
            />
          </div>

          {/* Q4: Skill Level */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              How would you describe your skill level?
            </Label>
            <RadioGroup value={skillLevel} onValueChange={setSkillLevel}>
              {SKILL_LEVELS.map((level) => (
                <label
                  key={level.value}
                  className={`flex items-center gap-3 rounded-lg border px-3 py-2 cursor-pointer transition-colors text-sm ${
                    skillLevel === level.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <RadioGroupItem value={level.value} />
                  {level.label}
                </label>
              ))}
            </RadioGroup>
          </div>

          {/* Q5: Practice Frequency */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              How often do you currently practice?
            </Label>
            <RadioGroup
              value={practiceFrequency}
              onValueChange={setPracticeFrequency}
            >
              {PRACTICE_FREQUENCIES.map((freq) => (
                <label
                  key={freq.value}
                  className={`flex items-center gap-3 rounded-lg border px-3 py-2 cursor-pointer transition-colors text-sm ${
                    practiceFrequency === freq.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <RadioGroupItem value={freq.value} />
                  {freq.label}
                </label>
              ))}
            </RadioGroup>
          </div>

          {/* Q6: Practice Goal */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              What's your main practice goal?
            </Label>
            <RadioGroup value={practiceGoal} onValueChange={setPracticeGoal}>
              {PRACTICE_GOALS.map((goal) => (
                <label
                  key={goal.value}
                  className={`flex items-center gap-3 rounded-lg border px-3 py-2 cursor-pointer transition-colors text-sm ${
                    practiceGoal === goal.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <RadioGroupItem value={goal.value} />
                  {goal.label}
                </label>
              ))}
            </RadioGroup>
          </div>

          {/* Q7: Referral Source */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              How did you hear about Practice Daily?
            </Label>
            <RadioGroup
              value={referralSource}
              onValueChange={setReferralSource}
            >
              {REFERRAL_SOURCES.map((source) => (
                <label
                  key={source.value}
                  className={`flex items-center gap-3 rounded-lg border px-3 py-2 cursor-pointer transition-colors text-sm ${
                    referralSource === source.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <RadioGroupItem value={source.value} />
                  {source.label}
                </label>
              ))}
            </RadioGroup>
          </div>
        </CardContent>

        <CardFooter>
          <Button
            className="w-full"
            size="lg"
            onClick={handleContinue}
            disabled={!isValid || submitting}
          >
            {submitting ? (
              "Saving..."
            ) : (
              <>
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
