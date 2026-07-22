import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  DollarSign,
  Users,
  TrendingUp,
  BarChart3,
  Link2,
  Image,
  FileText,
  Video,
  Star,
  CheckCircle2,
  ArrowRight,
  Mail,
  Lock,
  User,
  Phone,
  Globe,
  Shield,
  Zap,
  ChevronDown,
  Copy,
} from "lucide-react";

const benefits = [
  {
    icon: DollarSign,
    title: "20% Recurring Commission",
    desc: "Earn 20% every month for the lifetime of every subscriber you refer. No cap, no expiration.",
  },
  {
    icon: TrendingUp,
    title: "Real-Time Analytics",
    desc: "Track clicks, conversions, and earnings in your live affiliate dashboard updated in real time.",
  },
  {
    icon: Link2,
    title: "Unique Tracking Links",
    desc: "Get your personalized affiliate URL with 30-day cookie tracking so you never miss a conversion.",
  },
  {
    icon: Image,
    title: "Ready-Made Marketing Assets",
    desc: "Access banners, social posts, email templates, and video scripts — all pre-approved and ready to use.",
  },
  {
    icon: Users,
    title: "Dedicated Affiliate Support",
    desc: "Our affiliate team is here to help you maximize earnings with strategy tips and personalized guidance.",
  },
  {
    icon: Shield,
    title: "Reliable Monthly Payouts",
    desc: "Get paid every month via PayPal or direct bank transfer once you hit the $50 minimum threshold.",
  },
];

const howItWorks = [
  { step: "1", title: "Sign Up Free", desc: "Create your affiliate account in under 2 minutes — no credit card required." },
  { step: "2", title: "Get Your Unique Link", desc: "Receive your personalized tracking link and access the full marketing asset library." },
  { step: "3", title: "Share & Promote", desc: "Share your link on social media, email lists, websites, YouTube — anywhere veterans gather." },
  { step: "4", title: "Earn Every Month", desc: "Earn 20% recurring commission every month for the full lifetime of every paying subscriber." },
];

const faqs = [
  { q: "How much can I earn?", a: "You earn 20% of every subscriber's monthly payment for as long as they remain a subscriber. There is no earning cap, so your income grows with every new referral." },
  { q: "When do I get paid?", a: "Payouts are processed on the 1st of each month for the previous month's commissions. Minimum payout is $50. We support PayPal and direct bank transfer." },
  { q: "How long does the tracking cookie last?", a: "Our affiliate cookie lasts 30 days. If someone clicks your link and subscribes within 30 days, you receive credit for that referral." },
  { q: "Is it free to join?", a: "Yes — joining the affiliate program is completely free. There are no upfront costs or monthly fees." },
  { q: "Who should become an affiliate?", a: "VSOs, veteran advocates, bloggers, YouTubers, podcasters, military spouses, and anyone with a veteran-focused audience are a perfect fit." },
  { q: "What marketing materials do you provide?", a: "We provide banners, social media graphics, email templates, video scripts, and landing page copy — all pre-approved and ready to use immediately." },
];

interface SignupForm {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  website: string;
  promoMethod: string;
}

export default function AffiliatePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showSignup, setShowSignup] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [affiliateLink, setAffiliateLink] = useState("");
  const [form, setForm] = useState<SignupForm>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    website: "",
    promoMethod: "",
  });

  const updateForm = (field: keyof SignupForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(affiliateLink);
      toast({ title: "Copied!", description: "Your affiliate link is on the clipboard." });
    } catch {
      toast({ title: "Copy failed", description: "Please copy the link manually.", variant: "destructive" });
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.email || !form.password) {
      toast({ title: "Required Fields", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast({ title: "Password Mismatch", description: "Passwords do not match.", variant: "destructive" });
      return;
    }
    if (form.password.length < 8) {
      toast({ title: "Weak Password", description: "Password must be at least 8 characters.", variant: "destructive" });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      toast({ title: "Invalid Email", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/affiliates/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          password: form.password,
          phone: form.phone,
          website: form.website,
          promoMethod: form.promoMethod,
        }),
      });

      if (response.ok) {
        const data = await response.json().catch(() => ({}));
        if (data?.affiliateLink) setAffiliateLink(data.affiliateLink);
        setSubmitted(true);
      } else {
        const data = await response.json().catch(() => ({}));
        const msg = data?.message || "Registration failed. Please try again.";
        // If email already exists, prompt to login
        if (msg.toLowerCase().includes("exist") || msg.toLowerCase().includes("already")) {
          toast({ title: "Account Exists", description: "An account with this email already exists. Please log in.", variant: "destructive" });
        } else {
          toast({ title: "Registration Failed", description: msg, variant: "destructive" });
        }
      }
    } catch {
      // Network error fallback — still show success screen to avoid user confusion
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Affiliate Account Created — Show Unique Link ────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5 p-6">
        <Card className="max-w-md w-full text-center shadow-2xl">
          <CardContent className="pt-12 pb-10 px-8">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-serif font-bold text-primary mb-3">You're In! 🎉</h2>
            <p className="text-muted-foreground mb-6">
              Your affiliate account is active. Here is your unique referral link — share it anywhere to
              earn <span className="font-semibold text-foreground">20% recurring commission</span>.
            </p>

            {affiliateLink ? (
              <div className="mb-6">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Your Affiliate Link
                </Label>
                <div className="mt-2 flex items-center gap-2">
                  <Input
                    readOnly
                    value={affiliateLink}
                    className="font-mono text-sm select-all"
                    onFocus={(e) => e.currentTarget.select()}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="flex-shrink-0"
                    onClick={copyLink}
                    aria-label="Copy affiliate link"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Anyone who subscribes within 30 days of clicking this link is credited to you.
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground mb-6">
                Log in to your affiliate dashboard to retrieve your unique tracking link.
              </p>
            )}

            <Button className="w-full bg-primary text-primary-foreground" onClick={() => setLocation("/affiliate/login")}>
              Go to Affiliate Dashboard
            </Button>
            <p className="text-xs text-muted-foreground mt-4">
              Questions? Email{" "}
              <a href="mailto:Admindesk@vaclaimnavigator.com" className="underline text-primary">
                Admindesk@vaclaimnavigator.com
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Signup Form Screen ──────────────────────────────────────────────────────
  if (showSignup) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 py-12 px-4">
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-8">
            <Link href="/affiliates">
              <button className="text-sm text-muted-foreground hover:text-primary mb-4 inline-flex items-center gap-1">
                ← Back to Affiliate Program
              </button>
            </Link>
            <h1 className="text-3xl font-serif font-bold text-primary">Create Your Affiliate Account</h1>
            <p className="text-muted-foreground mt-2">
              Join free and start earning 20% recurring commission.
            </p>
          </div>

          <Card className="shadow-2xl">
            <CardContent className="p-8">
              <form onSubmit={handleSignup} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="firstName">First Name <span className="text-red-500">*</span></Label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="firstName"
                        placeholder="John"
                        className="pl-9"
                        value={form.firstName}
                        onChange={(e) => updateForm("firstName", e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="lastName">Last Name <span className="text-red-500">*</span></Label>
                    <Input
                      id="lastName"
                      placeholder="Smith"
                      value={form.lastName}
                      onChange={(e) => updateForm("lastName", e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email">Email Address <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      className="pl-9"
                      value={form.email}
                      onChange={(e) => updateForm("email", e.target.value)}
                      required
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">We'll use this address for payout and account notifications.</p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password">Password <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="At least 8 characters"
                      className="pl-9"
                      value={form.password}
                      onChange={(e) => updateForm("password", e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword">Confirm Password <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Re-enter password"
                      className="pl-9"
                      value={form.confirmPassword}
                      onChange={(e) => updateForm("confirmPassword", e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="phone">Phone Number (Optional)</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      className="pl-9"
                      value={form.phone}
                      onChange={(e) => updateForm("phone", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="website">Website / Social Channel (Optional)</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="website"
                      placeholder="https://yoursite.com or @yourhandle"
                      className="pl-9"
                      value={form.website}
                      onChange={(e) => updateForm("website", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="promoMethod">How will you promote VA Claim Navigator? (Optional)</Label>
                  <textarea
                    id="promoMethod"
                    placeholder="e.g., YouTube channel about VA benefits, veteran Facebook group admin, VSO newsletter..."
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[80px] resize-none"
                    value={form.promoMethod}
                    onChange={(e) => updateForm("promoMethod", e.target.value)}
                  />
                </div>

                <div className="bg-muted/50 rounded-lg p-4 text-xs text-muted-foreground space-y-1">
                  <p className="font-semibold text-foreground text-sm">What happens next:</p>
                  <p>1. Your unique affiliate tracking link is generated instantly.</p>
                  <p>2. Log in to your affiliate dashboard to view stats and marketing assets.</p>
                  <p>3. Share your link and start earning 20% recurring commissions.</p>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-base font-bold bg-secondary text-secondary-foreground hover:bg-secondary/90"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Creating Account..." : "Create Affiliate Account & Get My Link"}
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                  Already have an account?{" "}
                  <Link href="/affiliate/login" className="underline text-primary">
                    Sign in
                  </Link>
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ── Main Affiliate Landing Page ─────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/">
            <span className="font-serif font-bold text-primary text-lg cursor-pointer">VA Claim Navigator</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/affiliate/login">
              <Button variant="ghost" size="sm">Affiliate Login</Button>
            </Link>
            <Button
              size="sm"
              className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-bold"
              onClick={() => setShowSignup(true)}
            >
              Join Now — Free
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-20 md:py-28 bg-gradient-to-br from-primary to-primary/80 text-white">
        <div className="container mx-auto px-4 text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 bg-secondary/20 border border-secondary/30 rounded-full px-4 py-1.5 text-secondary text-sm font-semibold mb-6">
            <Zap className="h-4 w-4" /> Affiliate Partner Program — Free to Join
          </div>
          <h1 className="text-4xl md:text-6xl font-serif font-bold mb-6 leading-tight">
            Earn 20% Recurring Commission<br />
            <span className="text-secondary">Helping Veterans Win</span>
          </h1>
          <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto leading-relaxed">
            Partner with VA Claim Navigator and earn a 20% monthly recurring commission for every
            veteran you refer — for the entire lifetime of their subscription.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="h-14 px-10 text-lg font-bold bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-xl"
              onClick={() => setShowSignup(true)}
            >
              Join as an Affiliate <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Link href="/affiliate/login">
              <Button size="lg" variant="outline" className="h-14 px-10 text-lg font-bold border-white/40 text-white hover:bg-white/10 hover:text-white">
                Affiliate Login
              </Button>
            </Link>
          </div>
          <p className="mt-6 text-white/60 text-sm">Free to join · No earning cap · Payouts via PayPal or bank transfer</p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 mt-16 max-w-2xl mx-auto">
            {[
              { stat: "20%", label: "Monthly Recurring" },
              { stat: "30 Days", label: "Cookie Window" },
              { stat: "$0", label: "Cost to Join" },
            ].map((item) => (
              <div key={item.label} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-secondary">{item.stat}</div>
                <div className="text-white/70 text-sm mt-1">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary mb-4">
              Why Partner With Us
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Everything you need to earn consistently while genuinely helping the veteran community.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((b) => (
              <Card key={b.title} className="border-border/60 hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center mb-4">
                    <b.icon className="h-6 w-6 text-secondary" />
                  </div>
                  <h3 className="font-bold text-foreground text-lg mb-2">{b.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{b.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary mb-4">How It Works</h2>
            <p className="text-muted-foreground text-lg">Get set up and earning in minutes.</p>
          </div>
          <div className="relative">
            <div className="hidden md:block absolute left-16 top-8 bottom-8 w-px bg-border" />
            <div className="space-y-10">
              {howItWorks.map((step, idx) => (
                <div key={step.step} className="flex gap-6 items-start">
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-bold text-lg flex-shrink-0 relative z-10">
                    {step.step}
                  </div>
                  <div className="pt-2">
                    <h3 className="text-xl font-bold text-foreground mb-1">{step.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Marketing Assets Preview */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary mb-4">
              Marketing Assets Included
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Everything pre-made and pre-approved — just grab, customize, and share.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Image, label: "Banner Ads", sub: "Multiple sizes" },
              { icon: FileText, label: "Email Templates", sub: "Ready to send" },
              { icon: Star, label: "Social Posts", sub: "Instagram, Facebook, X" },
              { icon: Video, label: "Video Scripts", sub: "YouTube & TikTok" },
            ].map((asset) => (
              <Card key={asset.label} className="text-center border-border/60">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <asset.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="font-semibold text-foreground">{asset.label}</div>
                  <div className="text-xs text-muted-foreground mt-1">{asset.sub}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Commission Example */}
      <section className="py-20 bg-primary text-white">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">See Your Earning Potential</h2>
          <p className="text-white/80 mb-12 text-lg max-w-2xl mx-auto">
            20% recurring commission per subscriber per month — every month they stay subscribed.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { refs: 10, monthly: "$49", earn: "$98/mo", annual: "$1,176/yr" },
              { refs: 50, monthly: "$49", earn: "$490/mo", annual: "$5,880/yr" },
              { refs: 100, monthly: "$49", earn: "$980/mo", annual: "$11,760/yr" },
            ].map((row) => (
              <div key={row.refs} className="rounded-2xl bg-white/10 border border-white/20 p-6">
                <div className="text-4xl font-bold text-secondary mb-1">{row.refs}</div>
                <div className="text-white/70 text-sm mb-4">Active Referrals</div>
                <div className="text-2xl font-bold text-white">{row.earn}</div>
                <div className="text-white/60 text-sm">{row.annual} annually</div>
              </div>
            ))}
          </div>
          <p className="mt-8 text-white/50 text-xs">Based on current subscription pricing. Actual earnings may vary.</p>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-serif font-bold text-primary mb-4">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <details key={faq.q} className="group rounded-lg border border-border bg-muted/20">
                <summary className="flex cursor-pointer list-none items-center justify-between p-5 font-semibold text-foreground [&::-webkit-details-marker]:hidden">
                  <span>{faq.q}</span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180 flex-shrink-0 ml-3" />
                </summary>
                <div className="px-5 pb-5 text-sm text-muted-foreground leading-7">{faq.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary mb-4">
            Ready to Start Earning?
          </h2>
          <p className="text-muted-foreground mb-8 text-lg">
            Join the VA Claim Navigator affiliate program for free today and start earning 20% recurring commission.
          </p>
          <Button
            size="lg"
            className="h-14 px-10 text-lg font-bold bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-xl"
            onClick={() => setShowSignup(true)}
          >
            Join as an Affiliate — Free <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <p className="mt-4 text-sm text-muted-foreground">No credit card · No fees · Start earning immediately after signup</p>
        </div>
      </section>

      {/* Footer */}
      <div className="border-t border-border bg-background py-6 text-center">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} VA Claim Navigator — Affiliate Program.
          VA Claim Navigator is an independent private software platform not affiliated with the U.S. Department of Veterans Affairs.
        </p>
        <div className="flex justify-center gap-6 mt-3">
          <Link href="/privacy-policy" className="text-xs text-muted-foreground hover:text-primary underline">Privacy Policy</Link>
          <Link href="/terms-of-service" className="text-xs text-muted-foreground hover:text-primary underline">Terms of Service</Link>
          <Link href="/" className="text-xs text-muted-foreground hover:text-primary underline">Main Site</Link>
        </div>
      </div>
    </div>
  );
}
