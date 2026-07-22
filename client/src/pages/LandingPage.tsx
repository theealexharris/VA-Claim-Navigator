import { Link } from "wouter";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import {
  Shield,
  ArrowRight,
  Star,
  Check,
  CheckCircle2,
  Zap,
  Sparkles,
  ClipboardList,
  FileText,
  Eye,
  ChevronDown,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { CONTACT_EMAIL_ADMIN } from "@/lib/contact";
import { useStripePriceIds } from "@/hooks/use-stripe-price-ids";
import { authFetch, apiUrl } from "@/lib/api-helpers";
import heroVideo from "@assets/Claim_navigator_video_1768853413666.mp4";
import avatar1 from "@assets/stock_images/diverse_professional_43b32cf6.jpg";
import avatar2 from "@assets/stock_images/diverse_professional_31dd8b43.jpg";
import avatar3 from "@assets/stock_images/diverse_professional_7cce766a.jpg";
import avatar4 from "@assets/stock_images/diverse_professional_b621c6df.jpg";
import veteranImage from "@assets/IMG_0398_1769121331059.jpeg";

/* ═══════════════════════════════════════════════════════════════════
   Content Arrays — edit these to update page copy without touching JSX
   ═══════════════════════════════════════════════════════════════════ */

const trustPills = [
  "Structured statement draft",
  "Guided question flow",
  "Independent private platform",
  "Built to reduce confusion",
];

const painPoints = [
  { icon: AlertCircle, text: "Not sure what information matters most" },
  { icon: FileText, text: "Confusing paperwork and unclear steps" },
  { icon: Eye, text: "Easy to miss important claim details" },
  { icon: ClipboardList, text: "Too much time and frustration doing it alone" },
];

const solutions = [
  {
    icon: ClipboardList,
    title: "Guided Claim Builder",
    body: "Answer step-by-step questions about service history, conditions, symptoms, and supporting details through a guided workflow.",
  },
  {
    icon: FileText,
    title: "Structured Statement Draft",
    body: "Generate a structured supporting statement draft with organized sections for conditions, symptoms, functional impact, and supporting details for review.",
  },
  {
    icon: Eye,
    title: "Clearer Starting Point",
    body: "Start from a more organized written draft instead of a blank page so you can review, refine, and prepare next filing steps more confidently.",
  },
];

const steps = [
  {
    num: "01",
    title: "Answer guided questions",
    body: "Provide claim-related information through a guided workflow that helps organize the details behind your conditions.",
  },
  {
    num: "02",
    title: "Build your statement draft",
    body: "The platform structures your responses into a written supporting statement draft with clearer sections and formatting.",
  },
  {
    num: "03",
    title: "Review before submission",
    body: "Read through the draft carefully, verify the details, and use it as a more organized starting point for your filing process.",
  },
];

const comparisonRows: [string, string][] = [
  ["Start with a blank page", "Start with a structured draft"],
  ["Hard to organize symptoms clearly", "Guided question flow"],
  ["Easy to overlook important details", "Organized sections for review"],
  ["Time-consuming and frustrating", "More focused preparation"],
  ["No clear structure", "Clearer written output"],
];

const trustItems = [
  "Independent private software platform",
  "Guided step-by-step workflow",
  "Structured written statement draft",
  "Designed for user review before filing",
];

const differentiators = [
  {
    title: "Not another vague claim service",
    body: "We show you the guided workflow and the kind of written draft you're building toward — before you sign up.",
  },
  {
    title: "Built around clarity",
    body: "Instead of broad promises, the platform focuses on organization, process clarity, and your review before submission.",
  },
  {
    title: "Trust-first approach",
    body: "We clearly state our independence from the VA, avoid guarantee claims, and explain exactly what the software does.",
  },
];

/**
 * Proof cards — placeholder section.
 * TODO: Replace these cards with real testimonials, redacted screenshots,
 * video proof, funnel metrics, and partner/credibility logos when available.
 */
const proofCards = [
  {
    title: "What users can expect",
    body: "A clearer process, more organized information, and a stronger written starting point before filing.",
  },
  {
    title: "Why the output matters",
    body: "Seeing a structured draft reduces uncertainty and makes the product feel tangible instead of abstract.",
  },
  {
    title: "What increases trust",
    body: "Showing the real workflow, real draft structure, and clear disclaimers helps visitors feel more confident.",
  },
];

const faqCategories = [
  {
    heading: "Product & Output",
    items: [
      {
        q: "What is the end product?",
        a: "The platform generates a structured written supporting statement draft based on your responses. You should review all output carefully before submission or use.",
      },
      {
        q: "What does the platform help me do?",
        a: "It helps organize claim-related information through a guided workflow and turns those answers into a clearer supporting statement draft for review.",
      },
      {
        q: "How long does it take?",
        a: "That depends on the complexity of the situation, but many users can build a structured draft within about 30 minutes.",
      },
    ],
  },
  {
    heading: "Trust & Compliance",
    items: [
      {
        q: "Is VA Claim Navigator affiliated with the VA?",
        a: "No. VA Claim Navigator is an independent private software platform and is not affiliated with or endorsed by the Department of Veterans Affairs.",
      },
      {
        q: "Does the platform guarantee a rating or outcome?",
        a: "No. VA Claim Navigator does not guarantee any VA decision, rating, approval, or benefit outcome.",
      },
      {
        q: "Is this legal or medical advice?",
        a: "No. The platform is intended to help users prepare and organize information. It does not provide legal or medical advice.",
      },
      {
        q: "Do I still need to review my information?",
        a: "Yes. You should carefully review all information and generated output before submission or use.",
      },
    ],
  },
];

/* ═══════════════════════════════════════════════════════════════════
   Landing Page Component
   ═══════════════════════════════════════════════════════════════════ */

export default function LandingPage() {
  const { toast } = useToast();
  const { getPriceId } = useStripePriceIds();
  const [showGetStarted, setShowGetStarted] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState("");
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedTier, setSelectedTier] = useState<{ name: string; price: string; tier: string }>({
    name: "",
    price: "",
    tier: "",
  });
  const [vetsServedCount, setVetsServedCount] = useState(526);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showPromoPopup, setShowPromoPopup] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  /* ── Data fetching ── */
  useEffect(() => {
    fetch(apiUrl("/api/stats/vets-served"))
      .then((res) => res.json())
      .then((data) => {
        if (data.count) setVetsServedCount(data.count);
      })
      .catch(() => {
        /* keep default */
      });
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.muted = true;
      video.currentTime = 0;
      video.play().catch(() => {
        /* autoplay blocked */
      });
    }
  }, []);

  /* ── Handlers ── */
  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const handleFeatureClick = (featureTitle: string) => {
    setSelectedFeature(featureTitle);
    setShowGetStarted(true);
  };

  const handlePaidTierClick = async (tierName: string, price: string) => {
    try {
      const authCheck = await fetch(apiUrl("/api/auth/me"), { credentials: "include" });
      const isLoggedIn = authCheck.status === 200;

      if (tierName === "Pro") {
        localStorage.setItem("selectedTier", "pro");
        localStorage.setItem("pendingProPayment", "true");
        localStorage.removeItem("pendingDeluxePayment");
        window.location.href = isLoggedIn ? "/dashboard/profile" : "/signup?tier=pro";
        return;
      }

      if (tierName === "Deluxe") {
        localStorage.setItem("selectedTier", "deluxe");
        localStorage.setItem("pendingDeluxePayment", "true");
        localStorage.removeItem("pendingProPayment");
        window.location.href = isLoggedIn ? "/dashboard/profile" : "/signup?tier=deluxe";
        return;
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error("Auth check failed:", error);
    }

    setSelectedTier({ name: tierName, price, tier: tierName.toLowerCase() });
    setShowPaymentDialog(true);
  };

  const handleCheckout = async () => {
    const priceId = getPriceId(selectedTier.tier);
    if (!priceId) {
      toast({
        title: "Payment not configured",
        description: "This plan is not available for checkout right now. Please try again later.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessingPayment(true);

    try {
      const response = await authFetch("/api/stripe/checkout", {
        method: "POST",
        body: JSON.stringify({ priceId, tier: selectedTier.tier }),
      });

      if (response.status === 401) {
        window.location.href = `/signup?tier=${selectedTier.tier}`;
        return;
      }

      const data = await response.json();
      const checkoutUrl =
        typeof data?.url === "string" && data.url.startsWith("https://") ? data.url : null;

      if (checkoutUrl) {
        setShowPaymentDialog(false);
        window.open(checkoutUrl, "_blank", "noopener,noreferrer");
      } else {
        const errorMessage =
          data?.message || "Unable to create checkout session. Please try again.";
        setShowPaymentDialog(false);
        toast({ title: "Payment Error", description: errorMessage, variant: "destructive" });
        if (import.meta.env.DEV) console.error("No checkout URL returned", data);
      }
    } catch (error) {
      setShowPaymentDialog(false);
      toast({
        title: "Payment Error",
        description: "Failed to process payment. Please try again.",
        variant: "destructive",
      });
      if (import.meta.env.DEV) console.error("Checkout error:", error);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  /* ═══════════════════════════════════════════════════════════════════
     Render
     ═══════════════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      {/* ── Sticky Mobile CTA ── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white/95 p-3 backdrop-blur md:hidden shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
        <Link href="/signup">
          <Button
            className="w-full h-12 text-base font-semibold bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-lg"
            data-testid="button-mobile-cta"
          >
            Start My Claim <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </Link>
      </div>

      {/* ── Feature Unlock Dialog ── */}
      <Dialog open={showGetStarted} onOpenChange={setShowGetStarted}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-serif text-primary flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-secondary" />
              Unlock {selectedFeature}
            </DialogTitle>
            <DialogDescription className="text-base pt-2">
              Create your free account to access our {selectedFeature} and the tools you need to
              build your claim.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="h-4 w-4 text-green-600" />
                <span>Free to get started — no credit card required</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="h-4 w-4 text-green-600" />
                <span>Access to Education Library</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="h-4 w-4 text-green-600" />
                <span>Basic Claim Builder included</span>
              </div>
            </div>
            <div className="flex flex-col gap-3 pt-2">
              <Link href="/signup">
                <Button
                  className="w-full h-12 text-lg font-semibold bg-secondary text-secondary-foreground hover:bg-secondary/90"
                  data-testid="button-popup-register"
                >
                  Create Free Account <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="text-primary font-medium hover:underline">
                  Log in
                </Link>
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Main Content (with bottom padding for mobile sticky CTA) ── */}
      <main className="pb-20 md:pb-0">
        {/* ════════════════════════════════════════════════════════════════
            SECTION 1 — HERO
            Clarity-first: what it is, who it's for, what you get, what to do next
        ════════════════════════════════════════════════════════════════ */}
        <section id="output-preview" className="relative pt-8 pb-10 lg:pt-12 lg:pb-14 overflow-hidden">
          {/* Subtle gradient bg */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] to-secondary/[0.05]" />

          <div className="container mx-auto px-4 relative">
            <div className="grid lg:grid-cols-3 gap-10 lg:gap-12 items-center">
              {/* ─ Left column: copy ─ */}
              <div className="space-y-6 z-10">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 text-secondary-foreground font-medium text-sm border border-secondary/20">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary" />
                  </span>
                  Guided workflow → structured statement draft
                </div>

                {/* Headline */}
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-primary leading-[1.1] tracking-tight">
                  Build Your VA Disability Claim{" "}
                  <span className="text-secondary relative inline-block">
                    Within 30 Minutes
                    <svg
                      className="absolute w-full h-3 -bottom-1 left-0 text-secondary/30"
                      viewBox="0 0 100 10"
                      preserveAspectRatio="none"
                    >
                      <path
                        d="M0 5 Q 50 10 100 5"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                      />
                    </svg>
                  </span>
                </h1>

                {/* Subheadline */}
                <p className="text-lg lg:text-xl text-muted-foreground leading-relaxed max-w-xl">
                  VA Claim Navigator helps veterans answer guided questions and turn their
                  information into a structured supporting statement draft they can review before
                  filing.
                </p>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row gap-4 pt-2">
                  <Link href="/signup">
                    <Button
                      size="lg"
                      className="h-14 px-8 text-lg font-semibold bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-lg shadow-secondary/20"
                      data-testid="button-hero-start"
                    >
                      Start My Claim <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-14 px-8 text-lg font-semibold border-2 hover:bg-muted/50"
                    onClick={() => scrollToSection("how-it-works")}
                    data-testid="button-hero-how"
                  >
                    See How It Works
                  </Button>
                </div>

                {/* Trust pills */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {trustPills.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1.5 text-xs font-medium text-muted-foreground"
                    >
                      <Check className="h-3 w-3 text-green-600" />
                      {item}
                    </span>
                  ))}
                </div>

                {/* Social proof */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground pt-1">
                  <div className="flex -space-x-2">
                    {[avatar1, avatar2, avatar3, avatar4].map((src, i) => (
                      <img
                        key={i}
                        src={src}
                        alt={`Veteran ${i + 1}`}
                        className="h-8 w-8 rounded-full border-2 border-white object-cover"
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="flex">
                      {[1, 2, 3, 4].map((i) => (
                        <Star key={i} className="h-4 w-4 fill-secondary text-secondary" />
                      ))}
                      <div className="relative h-4 w-4">
                        <Star className="h-4 w-4 text-gray-300 fill-gray-300 absolute" />
                        <div className="overflow-hidden w-1/2 absolute">
                          <Star className="h-4 w-4 fill-secondary text-secondary" />
                        </div>
                      </div>
                    </div>
                    <span className="font-semibold text-primary">4.5/5 from Veterans</span>
                  </div>
                </div>

                {/* Compliance note */}
                <p className="text-xs text-muted-foreground/70 max-w-lg leading-relaxed">
                  Not affiliated with or endorsed by the Department of Veterans Affairs. No rating
                  or outcome is guaranteed.
                </p>
              </div>

              {/* ─ Middle column: Real Document Output (walk-away value) ─ */}
              <div className="z-10">
                <h2 className="text-sm font-bold text-secondary uppercase tracking-wider mb-2">
                  REAL DOCUMENT OUTPUT
                </h2>
                <h3 className="text-2xl md:text-3xl font-serif font-bold text-primary mb-4">
                  This is what you walk away with
                </h3>
                <p className="text-base text-muted-foreground leading-relaxed mb-5">
                  The Claim Navigator generates a fully structured supplemental statement —
                  formatted and ready to submit to the VA. The sample shown is exactly the
                  type of document the platform produces from your answers.
                </p>

                <div className="space-y-3">
                  {[
                    "Condition-by-condition sections",
                    "Symptom and functional impact summaries",
                    "Supporting evidence and rationale sections",
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3"
                    >
                      <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <span className="text-foreground text-sm">{item}</span>
                    </div>
                  ))}
                </div>

                <p className="mt-5 text-sm text-muted-foreground italic">
                  The preview shown is a sample layout. Your actual draft will be generated from
                  your specific answers.
                </p>
              </div>

              {/* ─ Right column: real document output (sample supplemental statement) ─ */}
              <div className="relative">
                <div className="rounded-2xl border-2 border-border/50 bg-white p-4 shadow-2xl shadow-primary/10">
                  {/* Browser/doc chrome bar */}
                  <div className="flex items-center gap-1.5 mb-3 pb-2 border-b border-border/50">
                    <div className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
                    <div className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
                    <div className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
                    <span className="ml-2 text-[10px] text-muted-foreground/60 font-mono">
                      supplemental-statement-sample.pdf
                    </span>
                  </div>

                  {/* Document wrapper with shadow to mimic a printed page */}
                  <div className="relative rounded border border-gray-200 bg-white shadow-md overflow-hidden" style={{ fontFamily: 'Arial, sans-serif' }}>
                    {/* Diagonal SAMPLE ONLY watermark */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 overflow-hidden">
                      <span
                        className="font-bold text-gray-200 select-none whitespace-nowrap"
                        style={{ fontSize: '52px', transform: 'rotate(-35deg)', letterSpacing: '0.08em', opacity: 0.7 }}
                      >
                        SAMPLE ONLY
                      </span>
                    </div>

                    {/* Document content */}
                    <div className="p-6 space-y-2 text-[11px] leading-relaxed text-gray-800 relative z-0">
                      {/* Title */}
                      <p className="font-bold text-[13px] text-gray-900 mb-3">
                        VA CLAIM NAVIGATOR – SUPPLEMENTAL STATEMENT{" "}
                        <span className="font-normal text-gray-500">(Sample)</span>
                      </p>

                      {/* Header block */}
                      <p><span className="font-semibold">Date:</span> 03/09/2026</p>
                      <p><span className="font-semibold">From:</span> Veteran AI Test (SSN: XXX-XX-4569)</p>
                      <p><span className="font-semibold">To:</span> VA Claims Intake Center</p>
                      <p><span className="font-semibold">Subj:</span> Supporting Statement for Service-Connected Claim</p>
                      <hr className="border-gray-500 my-2" />

                      {/* Condition */}
                      <p className="font-bold uppercase tracking-wide text-[10px]">Condition:</p>
                      <hr className="border-gray-300" />
                      <p>Left Shoulder Rotator Cuff Tear (incurred during active duty, Feb 2000).</p>

                      {/* Current Symptoms */}
                      <p className="font-bold uppercase tracking-wide text-[10px] mt-1">Current Symptoms:</p>
                      <hr className="border-gray-300" />
                      <p>Chronic pain; reduced range of motion; difficulty with daily activities.</p>

                      {/* Evidence */}
                      <p className="font-bold uppercase tracking-wide text-[10px] mt-1">Evidence:</p>
                      <hr className="border-gray-300" />
                      <p>Service records; VA medical evaluations (summarized).</p>

                      {/* Legal Basis */}
                      <p className="font-bold uppercase tracking-wide text-[10px] mt-1">Legal Basis:</p>
                      <hr className="border-gray-300" />
                      <p>38 CFR § 4.71a; Shedden v. Principi.</p>

                      {/* Legal Argument */}
                      <p className="font-bold uppercase tracking-wide text-[10px] mt-1">Legal Argument:</p>
                      <hr className="border-gray-300" />
                      <p>Condition is directly service-connected with continuity of symptoms.</p>

                      {/* Conclusion */}
                      <p className="font-bold uppercase tracking-wide text-[10px] mt-1">Conclusion / Rationale:</p>
                      <hr className="border-gray-300" />
                      <p>Evidence supports service connection and appropriate rating.</p>

                      {/* Signature block */}
                      <div className="mt-4 pt-3 border-t border-gray-300 space-y-1">
                        <p className="italic">Respectfully Submitted,</p>
                        <p className="font-semibold">Veteran AI Test</p>
                        <p className="font-bold tracking-widest text-gray-700 mt-2">SAMPLE ONLY</p>
                      </div>
                    </div>
                  </div>

                  <p className="mt-3 text-center text-[10px] text-muted-foreground italic">
                    Your actual statement is generated from your answers — names, SSN, and conditions are yours.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Background decoration */}
          <div className="absolute top-0 right-0 -z-10 w-1/2 h-full bg-gray-50/50 clip-path-slant" />
        </section>

        {/* ════════════════════════════════════════════════════════════════
            SECTION 8 — WHAT MAKES US DIFFERENT (Objection Handling)
            Addresses skepticism naturally before it becomes abandonment
        ════════════════════════════════════════════════════════════════ */}
        <section className="py-10 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-14">
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary mb-5">
                What makes VA Claim Navigator different
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Built for veterans who want a clearer process, not vague promises.
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3 max-w-5xl mx-auto">
              {differentiators.map(({ title, body }) => (
                <div
                  key={title}
                  className="rounded-xl border border-secondary/20 bg-gradient-to-br from-secondary/5 to-white p-7 shadow-sm"
                >
                  <Shield className="h-6 w-6 text-secondary mb-4" />
                  <h4 className="text-lg font-bold text-primary font-serif mb-3">{title}</h4>
                  <p className="text-muted-foreground leading-relaxed">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            SECTIONS 3 & 4 — SOLUTION + HOW IT WORKS (side by side)
            (ids kept so existing Navbar links still work)
        ════════════════════════════════════════════════════════════════ */}
        <section className="py-10 bg-white">
          <div className="container mx-auto px-4">
            <div className="grid gap-12 lg:grid-cols-2 max-w-7xl mx-auto items-start">

              {/* ── Left: The Solution ── */}
              <div id="features">
                <div className="mb-8">
                  <h2 className="text-sm font-bold text-secondary uppercase tracking-wider mb-2">
                    THE SOLUTION
                  </h2>
                  <h3 className="text-2xl md:text-3xl font-serif font-bold text-primary mb-4">
                    A guided platform built around the actual end product
                  </h3>
                  <p className="text-base text-muted-foreground leading-relaxed">
                    Instead of leaving you wondering what you receive, VA Claim Navigator shows you the
                    outcome: a structured written supporting statement draft created from your answers.
                  </p>
                </div>

                <div className="space-y-4">
                  {solutions.map(({ icon: Icon, title, body }) => (
                    <div
                      key={title}
                      className="group rounded-xl border border-border bg-white p-6 shadow-sm hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => handleFeatureClick(title)}
                      data-testid={`feature-card-${title.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-secondary/10 group-hover:bg-secondary/15 transition-colors">
                        <Icon className="h-5 w-5 text-secondary" />
                      </div>
                      <h4 className="text-lg font-bold text-primary font-serif mb-2">{title}</h4>
                      <p className="text-muted-foreground leading-relaxed text-sm">{body}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Right: How It Works ── */}
              <div id="how-it-works">
                <div className="mb-8">
                  <h2 className="text-sm font-bold text-secondary uppercase tracking-wider mb-2">
                    HOW IT WORKS
                  </h2>
                  <h3 className="text-2xl md:text-3xl font-serif font-bold text-primary mb-4">
                    Three simple steps to your structured draft
                  </h3>
                  <p className="text-base text-muted-foreground leading-relaxed">
                    A simple, guided workflow designed to help you move from scattered information to a
                    clearer written draft.
                  </p>
                </div>

                <div className="space-y-4">
                  {steps.map(({ num, title, body }) => (
                    <div
                      key={num}
                      className="flex gap-4 p-6 rounded-xl bg-muted/30 border border-border shadow-sm"
                    >
                      <div className="w-11 h-11 rounded-full bg-secondary/15 flex items-center justify-center flex-shrink-0">
                        <span className="text-lg font-bold text-secondary font-serif">{num}</span>
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-primary mb-1 font-serif">{title}</h4>
                        <p className="text-muted-foreground leading-relaxed text-sm">{body}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8">
                  <Link href="/signup">
                    <Button
                      size="lg"
                      className="h-14 px-8 text-lg font-semibold bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-lg shadow-secondary/20"
                      data-testid="button-how-start"
                    >
                      Start My Claim <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            SECTION 6 — VIDEO WALKTHROUGH
            TODO: Trim the existing walkthrough to 30–45 seconds, add captions
            in CapCut or Canva, and export an MP4 plus a poster image for fast
            loading. Recommended flow:
              1) 5s — who the product is for
              2) 10s — guided question flow
              3) 10s — structured output preview
              4) 5s — user review reminder
              5) 5s — call to action
        ════════════════════════════════════════════════════════════════ */}
        <section className="py-10 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-10">
                <h2 className="text-sm font-bold text-secondary uppercase tracking-wider mb-2">
                  WALKTHROUGH
                </h2>
                <h3 className="text-3xl md:text-4xl font-serif font-bold text-primary mb-5">
                  See the platform in action
                </h3>
                <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                  Watch a short walkthrough showing the guided questions, the structured output, and
                  the review step.
                </p>
              </div>
              <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-primary/10 border-2 border-border/50">
                <video
                  ref={videoRef}
                  src={heroVideo}
                  playsInline
                  autoPlay
                  muted
                  loop
                  controls
                  className="w-full"
                  data-testid="video-walkthrough"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            SECTION 9 — VETS SERVED COUNTER + PRICING
        ════════════════════════════════════════════════════════════════ */}

        {/* Vets Served Counter */}
        <section className="py-12 bg-gradient-to-r from-primary/5 to-secondary/5">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10">
              <h3
                className="text-2xl md:text-3xl font-serif font-bold text-primary text-center md:text-right"
                data-testid="text-goal-message"
              >
                Goal to 1 Million Vets Served!
              </h3>
              <div
                className="bg-white rounded-xl shadow-lg px-8 py-4 border-2 border-secondary/30"
                data-testid="counter-vets-served"
              >
                <span className="text-4xl md:text-5xl font-mono font-bold text-primary tracking-wider">
                  {(() => {
                    const padded = vetsServedCount.toString().padStart(7, "0");
                    return `${padded[0]},${padded.slice(1, 4)},${padded.slice(4, 7)}`;
                  })()}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-10 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-14">
              <h2 className="text-sm font-bold text-secondary uppercase tracking-wider mb-2">
                PRICING
              </h2>
              <h3 className="text-3xl md:text-4xl font-serif font-bold text-primary mb-5">
                Choose your plan
              </h3>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Select the plan that fits your needs. All plans include access to our guided
                claim-building tools.
              </p>
            </div>

            <div
              className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto"
              id="pricing-grid"
            >
              {/* Starter Plan */}
              <Card className="relative border-2 border-primary hover:shadow-xl transition-shadow">
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-2xl font-serif text-primary">Starter</CardTitle>
                  <CardDescription className="text-sm">
                    For veterans just beginning to organize their claim information
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="text-center mb-6">
                    <span className="text-4xl font-bold text-primary">FREE</span>
                  </div>
                  <ul className="space-y-3 mb-6 text-sm">
                    <PricingFeature>Free 30-min 1:1 consult call</PricingFeature>
                    <PricingFeature>Email Support</PricingFeature>
                  </ul>
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-4 text-center">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                      Contact Email
                    </p>
                    <a
                      href={`mailto:${CONTACT_EMAIL_ADMIN}`}
                      className="text-sm font-medium text-primary hover:text-primary/80 underline underline-offset-2"
                    >
                      {CONTACT_EMAIL_ADMIN}
                    </a>
                  </div>
                  <Link href="/signup?tier=starter">
                    <Button
                      className="w-full h-11 font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
                      data-testid="button-starter"
                    >
                      Get Started Free
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Pro Plan — Most Popular */}
              <Card className="relative border-2 border-secondary shadow-xl z-10">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-secondary text-secondary-foreground text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                    <Zap className="h-3 w-3" /> Most Popular
                  </span>
                </div>
                <CardHeader className="text-center pb-2 pt-6">
                  <CardTitle className="text-2xl font-serif text-primary">PRO</CardTitle>
                  <CardDescription className="text-sm">
                    Complete Do-It-Yourself toolkit for VA Disability Supplemental Claim Statement
                    generation
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="text-center mb-6">
                    <p className="text-xs font-semibold text-secondary uppercase tracking-wider mb-1">
                      Founding Veteran Pricing
                    </p>
                    <span className="text-2xl font-bold text-muted-foreground line-through">
                      $297
                    </span>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-4xl font-bold text-primary">$197</span>
                      <span className="text-muted-foreground text-sm">/One Time Rate</span>
                    </div>
                    <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-1 rounded mt-2 inline-block">
                      Limited Founding Member Rate
                    </span>
                  </div>
                  <ul className="space-y-3 mb-6 text-sm">
                    <PricingFeature>Everything in Starter</PricingFeature>
                    <PricingFeature>Intelligent Claim Builder</PricingFeature>
                    <PricingFeature>Unlimited Document Uploads</PricingFeature>
                    <PricingFeature>Evidence Organization Tools</PricingFeature>
                    <PricingFeature>AI Coach Access</PricingFeature>
                    <PricingFeature>Statement Builders</PricingFeature>
                    <PricingFeature>Priority Support</PricingFeature>
                  </ul>
                  <Button
                    className="w-full h-11 font-semibold bg-secondary text-secondary-foreground hover:bg-secondary/90"
                    data-testid="button-pro"
                    onClick={() => handlePaidTierClick("Pro", "$197")}
                  >
                    Start My Claim
                  </Button>
                  <p className="text-center text-xs text-muted-foreground mt-2">
                    Use code <span className="font-mono font-bold text-amber-700">FREEDEMO</span> at checkout for 100% off
                  </p>
                </CardContent>
              </Card>

              {/* Deluxe Plan */}
              <Card className="relative border-2 border-primary bg-gradient-to-b from-primary/5 to-transparent hover:shadow-xl transition-shadow">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
                    White Glove
                  </span>
                </div>
                <CardHeader className="text-center pb-2 pt-6">
                  <CardTitle className="text-2xl font-serif text-primary">DELUXE</CardTitle>
                  <CardDescription className="text-sm">
                    Full-service 1:1 coaching and supplemental statement preparation
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="text-center mb-6">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-4xl font-bold text-primary">$997</span>
                      <span className="text-muted-foreground text-sm">/One Time Rate</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">or two payments of $500</p>
                    <span className="text-sm font-semibold text-green-600 bg-green-100 px-2 py-1 rounded mt-2 inline-block">
                      New Ambassador Promotion
                    </span>
                  </div>
                  <ul className="space-y-3 mb-6 text-sm">
                    <PricingFeature>Everything in Pro</PricingFeature>
                    <PricingFeature>Live 1-on-1 coaching sessions</PricingFeature>
                    <PricingFeature>Personal Assigned Case Consultant</PricingFeature>
                    <PricingFeature>Live Intake</PricingFeature>
                    <PricingFeature>
                      Live Review and Audit to support Supplemental Statement
                    </PricingFeature>
                    <PricingFeature>Live Draft Review and Editing</PricingFeature>
                    <PricingFeature>Live Final Submission Walk-thru</PricingFeature>
                  </ul>
                  <Button
                    className="w-full h-11 font-semibold bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:from-primary/90 hover:to-primary/70"
                    data-testid="button-deluxe"
                    onClick={() => handlePaidTierClick("Deluxe", "$997")}
                  >
                    Start My Claim
                  </Button>
                </CardContent>
              </Card>

              {/* Business Plan */}
              <Card className="relative border-2 border-secondary hover:shadow-xl transition-shadow">
                <CardHeader className="text-center pb-2 pt-6">
                  <CardTitle className="text-2xl font-serif text-primary">BUSINESS</CardTitle>
                  <CardDescription className="text-sm">
                    For businesses, law firms, and VA organizations
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="text-center mb-6">
                    <span className="text-2xl font-bold text-primary">Custom Pricing</span>
                    <span className="block text-sm font-semibold text-primary bg-primary/10 px-2 py-1 rounded mt-2">
                      Enterprise Solutions
                    </span>
                  </div>
                  <ul className="space-y-3 mb-6 text-sm">
                    <PricingFeature>Volume Licensing</PricingFeature>
                    <PricingFeature>Dedicated Account Manager</PricingFeature>
                    <PricingFeature>Custom Integration Support</PricingFeature>
                    <PricingFeature>Priority Technical Support</PricingFeature>
                    <PricingFeature>Training and Onboarding</PricingFeature>
                  </ul>
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-4 text-center">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                      Contact Email
                    </p>
                    <a
                      href={`mailto:${CONTACT_EMAIL_ADMIN}`}
                      className="text-sm font-medium text-primary hover:text-primary/80 underline underline-offset-2"
                    >
                      {CONTACT_EMAIL_ADMIN}
                    </a>
                  </div>
                  <a href={`mailto:${CONTACT_EMAIL_ADMIN}`}>
                    <Button
                      className="w-full h-11 font-semibold bg-secondary text-secondary-foreground hover:bg-secondary/90"
                      data-testid="button-business"
                    >
                      Contact Us
                    </Button>
                  </a>
                </CardContent>
              </Card>
            </div>

            <p className="text-sm text-center text-muted-foreground mt-8 max-w-3xl mx-auto italic">
              Fees are solely for access to the software platform, its document-generation tools,
              maintenance for use of platform and/or any consulting/coaching/educating. Fees are not
              connected to official VA document preparation, filing, outcome, or success of any VA
              disability claim or documents filed.
            </p>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            SECTION 10 — TRUST / FOUNDER
        ════════════════════════════════════════════════════════════════ */}
        <section className="py-10 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] max-w-6xl mx-auto items-start">
              {/* Left — trust messaging */}
              <div>
                <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary mb-5">
                  Built with purpose for the veteran community
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                  VA Claim Navigator was created to bring more clarity, structure, and support to a
                  process that too often feels difficult to navigate. The goal is simple: help
                  veterans prepare more organized claim information with less overwhelm.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {trustItems.map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-3 rounded-lg border border-border bg-white px-4 py-3.5 shadow-sm"
                    >
                      <Shield className="h-4 w-4 text-secondary flex-shrink-0" />
                      <span className="text-sm font-medium text-foreground">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right — Founder card */}
              <div className="rounded-xl border-2 border-secondary/30 bg-gradient-to-br from-secondary/5 to-secondary/10 p-7 shadow-lg">
                <p className="text-xs font-bold uppercase tracking-widest text-secondary mb-3">
                  Founder
                </p>
                <h3 className="text-2xl font-serif font-bold text-primary mb-4">
                  Built by someone who understands the mission
                </h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Created by Alexander Harris, VA Claim Navigator was built to help veterans
                  navigate one of the most frustrating parts of the process with more clarity, more
                  structure, and a better starting point.
                </p>
                {/* TODO: Replace with a dedicated founder headshot if available */}
                <img
                  src={veteranImage}
                  alt="Alexander Harris — Founder"
                  className="rounded-lg w-full max-h-48 object-cover border border-border mt-2"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            SECTION 11 — WHAT VETERANS CAN EXPECT (Proof Architecture)
            TODO: Replace these placeholder cards with:
              • Real testimonials from veterans
              • Redacted screenshots of actual statement drafts
              • Video proof / screen recordings
              • Funnel conversion metrics
              • Partner or credibility logos if available
        ════════════════════════════════════════════════════════════════ */}
        <section className="py-10 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-14">
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary mb-5">
                What veterans can expect
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                A clearer process, a tangible output, and the transparency to make a confident
                decision.
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3 max-w-5xl mx-auto">
              {proofCards.map(({ title, body }) => (
                <div
                  key={title}
                  className="rounded-xl border border-border bg-white p-7 shadow-sm"
                >
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/5">
                    <CheckCircle2 className="h-6 w-6 text-primary" />
                  </div>
                  <h4 className="text-lg font-bold text-primary font-serif mb-3">{title}</h4>
                  <p className="text-muted-foreground leading-relaxed">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            SECTION 12 — FAQ
        ════════════════════════════════════════════════════════════════ */}
        <section id="faq" className="py-10 bg-muted/30">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary">
                Frequently asked questions
              </h2>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
              {faqCategories.map((category) => (
                <div key={category.heading}>
                  <h3 className="text-xl font-serif font-bold text-primary mb-5">
                    {category.heading}
                  </h3>
                  <div className="space-y-3">
                    {category.items.map((item) => (
                      <details
                        key={item.q}
                        className="group rounded-lg border border-border bg-white shadow-sm"
                      >
                        <summary className="flex cursor-pointer list-none items-center justify-between p-4 text-left font-semibold text-foreground [&::-webkit-details-marker]:hidden">
                          <span className="pr-4">{item.q}</span>
                          <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0 transition-transform group-open:rotate-180" />
                        </summary>
                        <div className="px-4 pb-4 text-sm leading-7 text-muted-foreground">
                          {item.a}
                        </div>
                      </details>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            SECTION 13 — AFFILIATE PROGRAM
        ════════════════════════════════════════════════════════════════ */}
        <section className="py-10 bg-primary">
          <div className="container mx-auto px-4 text-center max-w-4xl">
            <p className="text-secondary font-semibold tracking-widest uppercase text-sm mb-3">
              Earn While You Help Veterans
            </p>
            <h2 className="text-3xl md:text-5xl font-serif font-bold text-white mb-5">
              Join the VA Claim Navigator Affiliate Program
            </h2>
            <p className="text-lg text-white/80 leading-relaxed mb-8 max-w-2xl mx-auto">
              Earn <span className="text-secondary font-bold text-xl">20% recurring monthly commission</span> for
              every subscriber you refer. Perfect for veteran advocates, VSOs, content creators, and military
              community leaders.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              {[
                { stat: "20%", label: "Recurring Monthly Commission", icon: "💰" },
                { stat: "30-Day", label: "Cookie Tracking Window", icon: "🔗" },
                { stat: "Real-Time", label: "Dashboard & Analytics", icon: "📊" },
              ].map((item) => (
                <div key={item.label} className="rounded-xl bg-white/10 border border-white/20 p-6 text-center">
                  <div className="text-3xl mb-2">{item.icon}</div>
                  <div className="text-2xl font-bold text-secondary">{item.stat}</div>
                  <div className="text-white/80 text-sm mt-1">{item.label}</div>
                </div>
              ))}
            </div>
            <Link href="/affiliates">
              <Button
                size="lg"
                className="h-14 px-10 text-lg font-bold bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-xl shadow-secondary/20"
              >
                Become an Affiliate Partner <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <p className="mt-4 text-sm text-white/60">Free to join · No cap on earnings · Payouts via PayPal or bank transfer</p>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            SECTION 14 — FINAL CTA
        ════════════════════════════════════════════════════════════════ */}
        <section className="py-10 bg-white">
          <div className="container mx-auto px-4 text-center max-w-3xl">
            <div className="rounded-2xl border-2 border-secondary/30 bg-gradient-to-br from-secondary/5 to-primary/5 p-10 md:p-14 shadow-xl">
              <h2 className="text-3xl md:text-5xl font-serif font-bold text-primary mb-5">
                Start with a clearer draft
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-2xl mx-auto">
                Get a guided workflow and a structured supporting statement draft you can review
                before taking your next steps.
              </p>
              <Link href="/signup">
                <Button
                  size="lg"
                  className="h-16 px-10 text-xl font-bold bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-xl shadow-secondary/20"
                  data-testid="button-final-cta"
                >
                  Start My Claim <ArrowRight className="ml-2 h-6 w-6" />
                </Button>
              </Link>
              <p className="mt-5 text-sm text-muted-foreground">
                Guided • Structured • Independent private platform
              </p>
            </div>
          </div>
        </section>

        {/* ── Compliance Disclaimer (above footer) ── */}
        <div className="border-t border-border bg-muted/30 px-4 py-6 text-center">
          <p className="text-xs text-muted-foreground max-w-4xl mx-auto leading-relaxed">
            VA Claim Navigator is an independent private software platform and is not affiliated
            with or endorsed by the Department of Veterans Affairs. Use of the platform does not
            guarantee any VA decision, rating, or benefit outcome.
          </p>
        </div>
      </main>

      <Footer />

      {/* ── Payment Dialog ── */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-serif text-primary text-center">
              Upgrade to {selectedTier.name}
            </DialogTitle>
            <DialogDescription className="text-center text-base pt-2">
              Get full access to all Navigator features for {selectedTier.price}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 pt-4">
            <div className="text-center">
              <p className="text-4xl font-bold text-primary">{selectedTier.price}</p>
              <p className="text-muted-foreground text-sm">One-time payment</p>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                <span>Full access to Claim Builder</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                <span>Print & Download PDF features</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                <span>Support Statement (AI-generated after review)</span>
              </div>
            </div>
            <Button
              className="w-full h-12 text-lg font-bold bg-secondary text-secondary-foreground hover:bg-secondary/90"
              onClick={handleCheckout}
              disabled={isProcessingPayment}
              data-testid="button-pay-now"
            >
              {isProcessingPayment ? "Processing..." : "Pay Now"}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Secure payment processing. Your data is protected.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Free Tier Promo Popup ── */}
      <Dialog open={showPromoPopup} onOpenChange={setShowPromoPopup}>
        <DialogContent className="sm:max-w-md border-4 border-red-500" data-testid="dialog-promo-popup">
          <DialogHeader>
            <DialogTitle className="text-2xl font-serif text-primary text-center">
              Use FREE PROMO PRO PLAN
            </DialogTitle>
            <DialogDescription className="text-center text-base pt-2 text-red-600 font-bold">
              The FREE Starter tier is temporarily disabled. Please use our FREE PROMO PRO PLAN
              instead to access all features at no cost!
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <p className="text-center text-sm text-muted-foreground">
              Sign up with the Pro plan and enter this code at checkout for 100% off:
            </p>
            <div className="flex items-center justify-center gap-3 bg-amber-50 border-2 border-amber-400 rounded-lg py-3 px-4">
              <span className="text-2xl font-mono font-extrabold tracking-widest text-amber-700 select-all">
                FREEDEMO
              </span>
            </div>
            <p className="text-center text-xs text-muted-foreground">
              Type <strong>FREEDEMO</strong> in the "Add promotion code" field on the Stripe payment page.
            </p>
            <Link href="/signup?tier=pro">
              <Button
                className="w-full h-12 text-lg font-bold bg-secondary text-secondary-foreground hover:bg-secondary/90"
                onClick={() => setShowPromoPopup(false)}
                data-testid="button-promo-ok"
              >
                OK — Go to Pro Plan
              </Button>
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Helper Components
   ═══════════════════════════════════════════════════════════════════ */

function PricingFeature({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
      <span className="text-muted-foreground">{children}</span>
    </li>
  );
}
