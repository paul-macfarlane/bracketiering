import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Trophy,
  Users,
  BarChart3,
  Zap,
  ClipboardList,
  Share2,
  ArrowRight,
  SlidersHorizontal,
  Layers,
  Check,
  X,
  Heart,
  ShieldCheck,
  GitBranch,
  Target,
  Compass,
  TrendingUp,
  Sparkles,
} from "lucide-react";

import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { SiteFooter } from "@/components/site-footer";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

function JsonLd() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Bracketsball",
    url: siteUrl,
    description:
      "March Madness bracket challenge — create pools, fill your bracket, and compete with friends. Free, no ads, and built for your crew.",
    applicationCategory: "SportsApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: [
      "Create bracket pools",
      "Fill NCAA tournament brackets",
      "Live scoring and standings",
      "Compete with friends",
      "Custom scoring rules",
      "Stats-based bracket generation",
      "Multiple brackets per pool",
      "Final Four scenario simulator",
      "Scenario-aware elimination tracking",
      "Personalized rooting guide",
      "Standings movement tracking",
      "Per-game potential points",
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    redirect("/pools");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <JsonLd />
      {/* Splash Header */}
      <header className="absolute top-0 right-0 left-0 z-10">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link
            href="/"
            className="font-heading text-lg font-bold uppercase tracking-wide text-primary-foreground"
          >
            Bracketsball
          </Link>
          <Button
            asChild
            className="bg-brand-orange text-brand-orange-foreground hover:bg-brand-orange/90"
          >
            <Link href="/login">Sign In</Link>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-primary px-4 pt-32 pb-20 text-primary-foreground md:pt-40 md:pb-28">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <BracketDecoration />
        </div>

        <div className="container relative mx-auto max-w-4xl text-center">
          <h1 className="font-heading text-5xl leading-tight font-bold uppercase tracking-wide md:text-7xl md:leading-tight">
            The Bracket App
            <br />
            <span className="text-brand-orange">Your Group Chat Deserves</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-primary-foreground/80 md:text-xl">
            Not another corporate bracket site stuffed with ads. Bracketsball is
            free, fast, and built for friends who take March Madness personally.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="bg-brand-orange px-8 text-lg text-brand-orange-foreground hover:bg-brand-orange/90"
            >
              <Link href="/login">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
          <p className="mt-4 text-sm text-primary-foreground/50">
            No credit card. No app download. Just brackets.
          </p>
        </div>
      </section>

      {/* Why Not ESPN / Comparison Section */}
      <section className="px-4 py-20 md:py-28">
        <div className="container mx-auto max-w-5xl">
          <h2 className="font-heading text-center text-3xl font-bold uppercase tracking-wide md:text-4xl">
            Not Your Typical Bracket App
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
            The big apps are built for millions of strangers. Bracketsball is
            built for your crew.
          </p>
          <div className="mt-14 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-3 pr-4 font-semibold"></th>
                  <th className="px-4 py-3 text-center font-heading text-lg font-bold text-brand-orange">
                    Bracketsball
                  </th>
                  <th className="px-4 py-3 text-center font-heading text-lg font-bold text-muted-foreground">
                    The Big Apps
                  </th>
                </tr>
              </thead>
              <tbody className="text-sm">
                <ComparisonRow
                  feature="Multiple brackets per pool"
                  detail="Up to 10 per person"
                  us={true}
                  them={false}
                />
                <ComparisonRow
                  feature="Custom scoring rules"
                  detail="Points per round, your way"
                  us={true}
                  them={false}
                />
                <ComparisonRow
                  feature="Stats-based auto-fill"
                  detail="Build a bracket strategy, not just chalk"
                  us={true}
                  them={false}
                />
                <ComparisonRow
                  feature="Scenario simulator"
                  detail="See every possible Final Four outcome"
                  us={true}
                  them={false}
                />
                <ComparisonRow
                  feature="Smart elimination tracking"
                  detail="Accounts for correlated picks"
                  us={true}
                  them={false}
                />
                <ComparisonRow
                  feature="No ads or data selling"
                  detail="Indie-built, not corporate"
                  us={true}
                  them={false}
                />
                <ComparisonRow
                  feature="No app download required"
                  detail="Works in any browser"
                  us={true}
                  them={false}
                />
                <ComparisonRow
                  feature="Live scoring"
                  detail="Scores update as games happen"
                  us={true}
                  them={true}
                />
                <ComparisonRow
                  feature="Pool standings"
                  detail="See where everyone ranks"
                  us={true}
                  them={true}
                />
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Stats-Based Generation Highlight */}
      <section className="bg-secondary px-4 py-20 md:py-28">
        <div className="container mx-auto max-w-5xl">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div>
              <h2 className="font-heading text-3xl font-bold uppercase tracking-wide md:text-4xl">
                Don&apos;t Just Pick Chalk.
                <br />
                <span className="text-brand-orange">Build a Strategy.</span>
              </h2>
              <p className="mt-4 text-muted-foreground">
                Our stats-based bracket generator lets you auto-fill picks using
                real team statistics. Weight what matters to you — offense,
                defense, rebounding — and dial in your chaos level for upsets.
              </p>
              <ul className="mt-6 space-y-3">
                <StatFeature text="10 stat categories with custom weights" />
                <StatFeature text="7 presets: Offense, Defense, BPI, SOS, Analytics, and more" />
                <StatFeature text="Chaos control: pick your upset frequency" />
                <StatFeature text="Or go manual — every pick auto-saves" />
              </ul>
            </div>
            <div className="rounded-xl border bg-card p-6">
              <StatsPreview />
            </div>
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="px-4 py-20 md:py-28">
        <div className="container mx-auto max-w-5xl">
          <h2 className="font-heading text-center text-3xl font-bold uppercase tracking-wide md:text-4xl">
            Everything You Need, Nothing You Don&apos;t
          </h2>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={<Layers className="h-6 w-6 text-brand-orange" />}
              title="Multiple Brackets"
              description="Run up to 10 brackets per person in a single pool. Play chalk in one, go chaotic in another."
            />
            <FeatureCard
              icon={<SlidersHorizontal className="h-6 w-6 text-brand-orange" />}
              title="Custom Scoring"
              description="Pool leaders set the points per round. Reward upsets, flatten the field, or go with the classic format."
            />
            <FeatureCard
              icon={<Zap className="h-6 w-6 text-brand-orange" />}
              title="Live Scoring"
              description="Scores update automatically as game results come in. No refreshing, no manual tracking."
            />
            <FeatureCard
              icon={<BarChart3 className="h-6 w-6 text-brand-orange" />}
              title="Potential Points"
              description="See what's still possible, not just current score. Know if you're alive or if it's over."
            />
            <FeatureCard
              icon={<Share2 className="h-6 w-6 text-brand-orange" />}
              title="One-Link Invites"
              description="Share a link, your friends are in. No accounts to create first, no app to download."
            />
            <FeatureCard
              icon={<Users className="h-6 w-6 text-brand-orange" />}
              title="Built for Groups"
              description="Pools of 2 to 100. Private by default. Made for the office pool, the family rivalry, the friend group."
            />
          </div>
        </div>
      </section>

      {/* Scenario Simulator Spotlight */}
      <section className="bg-secondary px-4 py-20 md:py-28">
        <div className="container mx-auto max-w-5xl">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div>
              <h2 className="font-heading text-3xl font-bold uppercase tracking-wide md:text-4xl">
                Every Outcome.
                <br />
                <span className="text-brand-orange">Calculated.</span>
              </h2>
              <p className="mt-4 text-muted-foreground">
                Once the Final Four is set, our scenario simulator enumerates
                every possible tournament outcome and shows you the projected
                standings for each one. No guesswork — just math.
              </p>
              <ul className="mt-6 space-y-3">
                <StatFeature text="All possible outcomes mapped (up to 8 scenarios)" />
                <StatFeature text="Projected standings for every scenario" />
                <StatFeature text="Best and worst possible finish for each bracket" />
                <StatFeature text="Filter by contention level: 1st, Top 2, Top 3" />
              </ul>
            </div>
            <div className="rounded-xl border bg-card p-6">
              <ScenarioPreview />
            </div>
          </div>
        </div>
      </section>

      {/* Tournament Experience */}
      <section className="px-4 py-20 md:py-28">
        <div className="container mx-auto max-w-5xl">
          <h2 className="font-heading text-center text-3xl font-bold uppercase tracking-wide md:text-4xl">
            Stay in It All Tournament Long
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
            Features that keep you engaged from tip-off to the final buzzer.
          </p>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={<Target className="h-6 w-6 text-brand-orange" />}
              title="Elimination Tracking"
              description="Know exactly when a bracket is mathematically eliminated — accounting for correlated picks, not just simple math."
            />
            <FeatureCard
              icon={<Compass className="h-6 w-6 text-brand-orange" />}
              title="Who to Root For"
              description="A personalized guide showing which teams you need to win in every game, and how many points are at stake."
            />
            <FeatureCard
              icon={<TrendingUp className="h-6 w-6 text-brand-orange" />}
              title="Standings Movement"
              description="See who surged and who dropped round over round with position change indicators on every bracket."
            />
            <FeatureCard
              icon={<Sparkles className="h-6 w-6 text-brand-orange" />}
              title="Potential Points"
              description="Per-game and per-round breakdowns of earned, remaining, and lost points so you know exactly where your upside is."
            />
            <FeatureCard
              icon={<GitBranch className="h-6 w-6 text-brand-orange" />}
              title="Classic Bracket Lines"
              description="Color-coded connector lines trace each team's path — green for correct picks, red for busted ones."
            />
            <FeatureCard
              icon={<Trophy className="h-6 w-6 text-brand-orange" />}
              title="Champion Tracking"
              description="See every bracket's champion pick at a glance on standings, with a red X when that team gets knocked out."
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-secondary px-4 py-20 md:py-28">
        <div className="container mx-auto max-w-5xl">
          <h2 className="font-heading text-center text-3xl font-bold uppercase tracking-wide md:text-4xl">
            Ready in 3 Steps
          </h2>
          <div className="mt-14 grid gap-10 md:grid-cols-3">
            <Step
              number={1}
              icon={<Users className="h-8 w-8" />}
              title="Create a Pool"
              description="Name it, set your scoring rules, and share the invite link."
            />
            <Step
              number={2}
              icon={<ClipboardList className="h-8 w-8" />}
              title="Fill Your Bracket"
              description="Pick winners from the First Four through the Championship. Use stats auto-fill or go with your gut."
            />
            <Step
              number={3}
              icon={<Trophy className="h-8 w-8" />}
              title="Talk Trash, Win Glory"
              description="Watch live scores roll in, track standings, and find out who really knows basketball."
            />
          </div>
        </div>
      </section>

      {/* Trust / Indie Section */}
      <section className="px-4 py-20 md:py-28">
        <div className="container mx-auto max-w-3xl text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-orange text-brand-orange-foreground">
            <Heart className="h-8 w-8" />
          </div>
          <h2 className="font-heading mt-6 text-3xl font-bold uppercase tracking-wide md:text-4xl">
            Built by a Fan, Not a Corporation
          </h2>
          <p className="mt-4 text-muted-foreground">
            Bracketsball is an indie project built because the big bracket sites
            got too bloated, too ad-heavy, and too focused on massive public
            pools nobody cares about. This is for your people.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-brand-orange" />
              Free forever
            </span>
            <span className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-brand-orange" />
              No ads
            </span>
            <span className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-brand-orange" />
              No data selling
            </span>
            <span className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-brand-orange" />
              Open source
            </span>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-primary px-4 py-20 text-center text-primary-foreground md:py-28">
        <div className="container mx-auto max-w-3xl">
          <h2 className="font-heading text-3xl font-bold uppercase tracking-wide md:text-4xl">
            March Madness Won&apos;t Wait
          </h2>
          <p className="mt-4 text-lg text-primary-foreground/80">
            Get your pool set up in minutes. Invite your friends. Fill your
            brackets. Let the madness begin.
          </p>
          <Button
            asChild
            size="lg"
            className="mt-8 bg-brand-orange px-8 text-lg text-brand-orange-foreground hover:bg-brand-orange/90"
          >
            <Link href="/login">
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

/* --- Sub-components --- */

function Step({
  number,
  icon,
  title,
  description,
}: {
  number: number;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-orange text-brand-orange-foreground">
        {icon}
      </div>
      <div className="mt-1 font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Step {number}
      </div>
      <h3 className="mt-3 text-xl font-bold">{title}</h3>
      <p className="mt-2 text-muted-foreground">{description}</p>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-6">
      <div className="flex items-center gap-3">
        {icon}
        <h3 className="text-lg font-bold">{title}</h3>
      </div>
      <p className="mt-2 text-muted-foreground">{description}</p>
    </div>
  );
}

function ComparisonRow({
  feature,
  detail,
  us,
  them,
}: {
  feature: string;
  detail: string;
  us: boolean;
  them: boolean;
}) {
  return (
    <tr className="border-b">
      <td className="py-3 pr-4">
        <div className="font-medium">{feature}</div>
        <div className="text-xs text-muted-foreground">{detail}</div>
      </td>
      <td className="px-4 py-3 text-center">
        {us ? (
          <>
            <Check className="mx-auto h-5 w-5 text-brand-orange" />
            <span className="sr-only">Yes</span>
          </>
        ) : (
          <>
            <X className="mx-auto h-5 w-5 text-muted-foreground/40" />
            <span className="sr-only">No</span>
          </>
        )}
      </td>
      <td className="px-4 py-3 text-center">
        {them ? (
          <>
            <Check className="mx-auto h-5 w-5 text-brand-orange" />
            <span className="sr-only">Yes</span>
          </>
        ) : (
          <>
            <X className="mx-auto h-5 w-5 text-muted-foreground/40" />
            <span className="sr-only">No</span>
          </>
        )}
      </td>
    </tr>
  );
}

function StatFeature({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-2">
      <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-orange" />
      <span className="text-sm">{text}</span>
    </li>
  );
}

function StatsPreview() {
  const stats = [
    { label: "PPG", value: 8 },
    { label: "Opp PPG", value: 6 },
    { label: "FG%", value: 4 },
    { label: "3PT%", value: 3 },
    { label: "Rebounds", value: 7 },
    { label: "Assists", value: 5 },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <span className="font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Stat Weights
        </span>
        <span className="rounded-full bg-brand-orange/10 px-3 py-1 text-xs font-medium text-brand-orange">
          Offense-Heavy
        </span>
      </div>
      <div className="space-y-3">
        {stats.map((stat) => (
          <div key={stat.label} className="flex items-center gap-3">
            <span className="w-20 text-xs text-muted-foreground">
              {stat.label}
            </span>
            <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-brand-orange"
                style={{ width: `${(stat.value / 10) * 100}%` }}
              />
            </div>
            <span className="w-4 text-right text-xs font-medium">
              {stat.value}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between border-t pt-4">
        <span className="text-xs text-muted-foreground">Chaos Level</span>
        <div className="flex gap-1">
          <span className="rounded bg-brand-orange px-2 py-0.5 text-xs font-medium text-brand-orange-foreground">
            Low
          </span>
          <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            Med
          </span>
          <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            High
          </span>
        </div>
      </div>
    </div>
  );
}

function ScenarioPreview() {
  const scenarios = [
    {
      label: "Duke over Houston, UConn over Auburn, Duke over UConn",
      results: [
        { name: "Paul's Bracket", rank: "1st", pts: 94 },
        { name: "Sarah's Picks", rank: "2nd", pts: 88 },
        { name: "Mike's Upsets", rank: "3rd", pts: 82 },
      ],
    },
    {
      label: "Houston over Duke, Auburn over UConn, Houston over Auburn",
      results: [
        { name: "Sarah's Picks", rank: "1st", pts: 96 },
        { name: "Mike's Upsets", rank: "2nd", pts: 86 },
        { name: "Paul's Bracket", rank: "3rd", pts: 78 },
      ],
    },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <span className="font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Scenario Simulator
        </span>
        <span className="rounded-full bg-brand-orange/10 px-3 py-1 text-xs font-medium text-brand-orange">
          Final Four
        </span>
      </div>
      <div className="space-y-4">
        {scenarios.map((scenario, i) => (
          <div key={i} className="rounded-lg border bg-background p-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              Scenario {i + 1}: {scenario.label}
            </p>
            <div className="space-y-1">
              {scenario.results.map((r) => (
                <div
                  key={r.name}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold ${r.rank === "1st" ? "text-brand-orange" : "text-muted-foreground"}`}
                    >
                      {r.rank}
                    </span>
                    <span>{r.name}</span>
                  </span>
                  <span className="text-xs font-medium text-muted-foreground">
                    {r.pts} pts
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        2 of 8 scenarios shown
      </p>
    </div>
  );
}

function BracketDecoration() {
  return (
    <svg
      className="absolute top-1/2 left-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 opacity-[0.06]"
      viewBox="0 0 800 800"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Left bracket lines */}
      <path
        d="M 100 100 L 200 100 L 200 250 L 300 250"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        d="M 100 400 L 200 400 L 200 250 L 300 250"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        d="M 100 500 L 200 500 L 200 650 L 300 650"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        d="M 100 800 L 200 800 L 200 650 L 300 650"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        d="M 300 250 L 400 250 L 400 450 L 500 450"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        d="M 300 650 L 400 650 L 400 450 L 500 450"
        stroke="currentColor"
        strokeWidth="4"
      />

      {/* Right bracket lines (mirrored) */}
      <path
        d="M 700 100 L 600 100 L 600 250 L 500 250"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        d="M 700 400 L 600 400 L 600 250 L 500 250"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        d="M 700 500 L 600 500 L 600 650 L 500 650"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        d="M 700 800 L 600 800 L 600 650 L 500 650"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        d="M 500 250 L 400 250 L 400 450 L 500 450"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        d="M 500 650 L 400 650 L 400 450 L 500 450"
        stroke="currentColor"
        strokeWidth="4"
      />

      {/* Championship circle */}
      <circle cx="500" cy="450" r="20" stroke="currentColor" strokeWidth="4" />
    </svg>
  );
}
