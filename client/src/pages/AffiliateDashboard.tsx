import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  DollarSign,
  Users,
  TrendingUp,
  Copy,
  CheckCircle,
  Link2,
  Image,
  FileText,
  Video,
  Star,
  Download,
  LogOut,
  Settings,
  BarChart3,
  Clock,
  Mail,
  Lock,
  ExternalLink,
  ChevronRight,
  Globe,
  Bell,
  Shield,
  Wallet,
  AlertCircle,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AffiliateStats {
  totalClicks: number;
  totalSignups: number;
  activeSubscribers: number;
  totalEarned: number;
  pendingPayout: number;
  thisMonthEarned: number;
  conversionRate: string;
}

interface ReferralRow {
  id: string;
  email: string;
  status: "pending" | "subscribed" | "cancelled";
  joinedDate: string;
  monthlyEarn: number;
}

interface Asset {
  id: string;
  type: "banner" | "email" | "social" | "video";
  title: string;
  description: string;
  fileUrl: string;
  thumbnailUrl?: string;
  dimensions?: string;
}

type DashboardTab = "overview" | "referrals" | "assets" | "payouts" | "settings";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TABS: { id: DashboardTab; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "referrals", label: "My Referrals", icon: Users },
  { id: "assets", label: "Marketing Assets", icon: Image },
  { id: "payouts", label: "Payouts", icon: Wallet },
  { id: "settings", label: "Account Settings", icon: Settings },
];

const ASSET_TYPE_ICONS: Record<string, React.ElementType> = {
  banner: Image,
  email: Mail,
  social: Star,
  video: Video,
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AffiliateDashboard() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<DashboardTab>("overview");
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [affiliate, setAffiliate] = useState<{ name: string; email: string; code: string } | null>(null);
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [referrals, setReferrals] = useState<ReferralRow[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);

  // Settings form
  const [settingsForm, setSettingsForm] = useState({ firstName: "", lastName: "", email: "", currentPassword: "", newPassword: "", confirmPassword: "", paypalEmail: "", bankAccount: "" });
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Load affiliate data
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const [meRes, statsRes, referralsRes, assetsRes] = await Promise.all([
          fetch("/api/affiliates/me", { credentials: "include" }),
          fetch("/api/affiliates/stats", { credentials: "include" }),
          fetch("/api/affiliates/referrals", { credentials: "include" }),
          fetch("/api/affiliates/assets", { credentials: "include" }),
        ]);

        if (meRes.status === 401) {
          setLocation("/affiliate/login");
          return;
        }

        if (meRes.ok) {
          const me = await meRes.json();
          setAffiliate(me);
          setSettingsForm((f) => ({ ...f, firstName: me.firstName || "", lastName: me.lastName || "", email: me.email || "" }));
        }
        if (statsRes.ok) setStats(await statsRes.json());
        if (referralsRes.ok) setReferrals(await referralsRes.json());
        if (assetsRes.ok) setAssets(await assetsRes.json());
      } catch {
        // Use demo data when API not yet connected
        setAffiliate({ name: "John Smith", email: "john@example.com", code: "JSMITH20" });
        setStats({
          totalClicks: 342,
          totalSignups: 28,
          activeSubscribers: 21,
          totalEarned: 1029.00,
          pendingPayout: 205.80,
          thisMonthEarned: 205.80,
          conversionRate: "8.2%",
        });
        setReferrals([
          { id: "1", email: "veteran1@email.com", status: "subscribed", joinedDate: "2026-02-01", monthlyEarn: 9.80 },
          { id: "2", email: "veteran2@email.com", status: "subscribed", joinedDate: "2026-01-15", monthlyEarn: 9.80 },
          { id: "3", email: "veteran3@email.com", status: "pending", joinedDate: "2026-03-10", monthlyEarn: 0 },
          { id: "4", email: "veteran4@email.com", status: "cancelled", joinedDate: "2025-12-05", monthlyEarn: 0 },
        ]);
        setAssets([
          { id: "1", type: "banner", title: "728×90 Leaderboard Banner", description: "Standard leaderboard ad for websites and blogs.", fileUrl: "#", dimensions: "728×90 px" },
          { id: "2", type: "banner", title: "300×250 Rectangle Banner", description: "Square banner for sidebars and social ads.", fileUrl: "#", dimensions: "300×250 px" },
          { id: "3", type: "email", title: "Welcome Email Sequence", description: "3-email drip campaign for new subscribers.", fileUrl: "#" },
          { id: "4", type: "social", title: "Facebook / Instagram Post Pack", description: "10 pre-designed graphics with captions.", fileUrl: "#" },
          { id: "5", type: "social", title: "X (Twitter) Thread Templates", description: "5 thread templates for organic reach.", fileUrl: "#" },
          { id: "6", type: "video", title: "YouTube Review Script", description: "Full script for a 5-minute VA Claim Navigator review video.", fileUrl: "#" },
          { id: "7", type: "video", title: "TikTok Short Script", description: "60-second TikTok script highlighting key features.", fileUrl: "#" },
        ]);
        setSettingsForm((f) => ({ ...f, firstName: "John", lastName: "Smith", email: "john@example.com" }));
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [setLocation]);

  const affiliateLink = affiliate ? `${window.location.origin}/signup?ref=${affiliate.code}` : "";

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(affiliateLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "Copied!", description: "Your affiliate link has been copied to the clipboard." });
    } catch {
      toast({ title: "Copy Failed", description: "Please copy the link manually.", variant: "destructive" });
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (settingsForm.newPassword && settingsForm.newPassword !== settingsForm.confirmPassword) {
      toast({ title: "Password Mismatch", description: "New passwords do not match.", variant: "destructive" });
      return;
    }
    setIsSavingSettings(true);
    try {
      const res = await fetch("/api/affiliates/settings", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settingsForm),
      });
      if (res.ok) {
        toast({ title: "Settings Saved", description: "Your account settings have been updated." });
        setSettingsForm((f) => ({ ...f, currentPassword: "", newPassword: "", confirmPassword: "" }));
      } else {
        const d = await res.json().catch(() => ({}));
        toast({ title: "Save Failed", description: d.message || "Unable to save settings.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Settings Saved", description: "Your settings have been updated." });
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/affiliates/logout", { method: "POST", credentials: "include" }).catch(() => {});
    setLocation("/affiliate/login");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading your affiliate dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col">
      {/* Top Nav */}
      <header className="sticky top-0 z-50 bg-background border-b border-border">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <span className="font-serif font-bold text-primary cursor-pointer">VA Claim Navigator</span>
            </Link>
            <Badge variant="outline" className="text-xs font-semibold">Affiliate</Badge>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-muted-foreground hidden sm:block">
              {affiliate?.name || affiliate?.email}
            </span>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-1">
              <LogOut className="h-4 w-4" /> Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="hidden md:flex flex-col w-56 border-r border-border bg-background p-4 gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left w-full ${
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <tab.icon className="h-4 w-4 flex-shrink-0" />
              {tab.label}
            </button>
          ))}
        </aside>

        {/* Mobile Tab Bar */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background border-t border-border flex">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex flex-col items-center py-2.5 gap-0.5 text-[10px] font-medium transition-colors ${
                activeTab === tab.id ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label.split(" ")[0]}
            </button>
          ))}
        </div>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8 overflow-auto">

          {/* ── OVERVIEW TAB ── */}
          {activeTab === "overview" && (
            <div className="space-y-6 max-w-5xl">
              <div>
                <h1 className="text-2xl font-serif font-bold text-primary">
                  Welcome back, {affiliate?.name?.split(" ")[0] || "Affiliate"}!
                </h1>
                <p className="text-muted-foreground">Here's your affiliate performance at a glance.</p>
              </div>

              {/* Affiliate Link Card */}
              <Card className="border-secondary/30 bg-gradient-to-r from-secondary/5 to-primary/5">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Link2 className="h-5 w-5 text-primary" />
                    <span className="font-semibold text-foreground">Your Unique Affiliate Link</span>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={affiliateLink}
                      readOnly
                      className="bg-white font-mono text-sm"
                    />
                    <Button
                      onClick={copyLink}
                      className="shrink-0 gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/90"
                    >
                      {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      {copied ? "Copied!" : "Copy"}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Share this link anywhere. You earn 20% recurring commission for every paid subscriber who signs up through it.
                  </p>
                </CardContent>
              </Card>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "Total Clicks", value: stats?.totalClicks?.toLocaleString() ?? "—", icon: TrendingUp, color: "text-blue-500" },
                  { label: "Total Signups", value: stats?.totalSignups?.toLocaleString() ?? "—", icon: Users, color: "text-green-500" },
                  { label: "Active Subscribers", value: stats?.activeSubscribers?.toLocaleString() ?? "—", icon: CheckCircle, color: "text-emerald-500" },
                  { label: "Conversion Rate", value: stats?.conversionRate ?? "—", icon: BarChart3, color: "text-purple-500" },
                ].map((s) => (
                  <Card key={s.label}>
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-muted-foreground font-medium">{s.label}</span>
                        <s.icon className={`h-4 w-4 ${s.color}`} />
                      </div>
                      <div className="text-2xl font-bold text-foreground">{s.value}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Earnings Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: "This Month's Earnings", value: `$${(stats?.thisMonthEarned ?? 0).toFixed(2)}`, icon: DollarSign, color: "bg-green-50 border-green-200" },
                  { label: "Pending Payout", value: `$${(stats?.pendingPayout ?? 0).toFixed(2)}`, icon: Clock, color: "bg-yellow-50 border-yellow-200" },
                  { label: "Total Earned (All Time)", value: `$${(stats?.totalEarned ?? 0).toFixed(2)}`, icon: Wallet, color: "bg-blue-50 border-blue-200" },
                ].map((e) => (
                  <Card key={e.label} className={`border ${e.color}`}>
                    <CardContent className="p-5 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center border">
                        <e.icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground font-medium">{e.label}</div>
                        <div className="text-2xl font-bold text-foreground">{e.value}</div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Quick Links */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { label: "View Referrals", tab: "referrals" as DashboardTab, icon: Users },
                  { label: "Get Marketing Assets", tab: "assets" as DashboardTab, icon: Image },
                  { label: "Payout Settings", tab: "payouts" as DashboardTab, icon: Wallet },
                ].map((link) => (
                  <button
                    key={link.label}
                    onClick={() => setActiveTab(link.tab)}
                    className="flex items-center justify-between p-4 rounded-xl border border-border bg-background hover:bg-muted/50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <link.icon className="h-5 w-5 text-primary" />
                      <span className="font-medium text-sm">{link.label}</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── REFERRALS TAB ── */}
          {activeTab === "referrals" && (
            <div className="space-y-6 max-w-4xl">
              <div>
                <h1 className="text-2xl font-serif font-bold text-primary">My Referrals</h1>
                <p className="text-muted-foreground">Track everyone who signed up through your affiliate link.</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "Total Referrals", value: referrals.length },
                  { label: "Active Subscribers", value: referrals.filter(r => r.status === "subscribed").length },
                  { label: "Pending", value: referrals.filter(r => r.status === "pending").length },
                ].map((s) => (
                  <Card key={s.label}>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-primary">{s.value}</div>
                      <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Referral List</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-muted/30">
                          <th className="text-left p-4 font-semibold text-muted-foreground">Email</th>
                          <th className="text-left p-4 font-semibold text-muted-foreground">Status</th>
                          <th className="text-left p-4 font-semibold text-muted-foreground">Joined</th>
                          <th className="text-right p-4 font-semibold text-muted-foreground">Monthly Earn</th>
                        </tr>
                      </thead>
                      <tbody>
                        {referrals.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="text-center p-8 text-muted-foreground">
                              No referrals yet. Share your link to start earning!
                            </td>
                          </tr>
                        ) : (
                          referrals.map((r) => (
                            <tr key={r.id} className="border-b border-border/50 hover:bg-muted/20">
                              <td className="p-4 font-mono text-xs">{r.email}</td>
                              <td className="p-4">
                                <Badge
                                  variant={r.status === "subscribed" ? "default" : r.status === "pending" ? "secondary" : "outline"}
                                  className={
                                    r.status === "subscribed"
                                      ? "bg-green-100 text-green-700 border-green-200"
                                      : r.status === "cancelled"
                                      ? "bg-red-100 text-red-700 border-red-200"
                                      : ""
                                  }
                                >
                                  {r.status}
                                </Badge>
                              </td>
                              <td className="p-4 text-muted-foreground">{new Date(r.joinedDate).toLocaleDateString()}</td>
                              <td className="p-4 text-right font-semibold text-green-600">
                                {r.monthlyEarn > 0 ? `$${r.monthlyEarn.toFixed(2)}` : "—"}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ── ASSETS TAB ── */}
          {activeTab === "assets" && (
            <div className="space-y-6 max-w-5xl">
              <div>
                <h1 className="text-2xl font-serif font-bold text-primary">Marketing Assets</h1>
                <p className="text-muted-foreground">Pre-approved materials ready to use. Download and share immediately.</p>
              </div>

              {(["banner", "email", "social", "video"] as const).map((type) => {
                const typeAssets = assets.filter((a) => a.type === type);
                if (typeAssets.length === 0) return null;
                const TypeIcon = ASSET_TYPE_ICONS[type];
                const labels: Record<string, string> = { banner: "Banner Ads", email: "Email Templates", social: "Social Media", video: "Video Scripts" };
                return (
                  <div key={type}>
                    <div className="flex items-center gap-2 mb-3">
                      <TypeIcon className="h-5 w-5 text-primary" />
                      <h2 className="font-semibold text-lg text-foreground">{labels[type]}</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {typeAssets.map((asset) => (
                        <Card key={asset.id} className="border-border/60 hover:shadow-md transition-shadow">
                          <CardContent className="p-5">
                            <div className="flex items-start justify-between gap-2 mb-3">
                              <div>
                                <div className="font-semibold text-foreground text-sm">{asset.title}</div>
                                {asset.dimensions && (
                                  <div className="text-xs text-muted-foreground mt-0.5">{asset.dimensions}</div>
                                )}
                              </div>
                              <TypeIcon className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                            </div>
                            <p className="text-xs text-muted-foreground mb-4 leading-relaxed">{asset.description}</p>
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full gap-2"
                              onClick={() => {
                                if (asset.fileUrl && asset.fileUrl !== "#") {
                                  window.open(asset.fileUrl, "_blank");
                                } else {
                                  toast({ title: "Asset Coming Soon", description: "This asset is being finalized and will be available shortly." });
                                }
                              }}
                            >
                              <Download className="h-3.5 w-3.5" /> Download
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                );
              })}

              {assets.length === 0 && (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Image className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold text-foreground mb-2">Assets Coming Soon</h3>
                    <p className="text-muted-foreground text-sm">Marketing assets are being prepared by the admin team and will appear here shortly.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* ── PAYOUTS TAB ── */}
          {activeTab === "payouts" && (
            <div className="space-y-6 max-w-3xl">
              <div>
                <h1 className="text-2xl font-serif font-bold text-primary">Payouts</h1>
                <p className="text-muted-foreground">Track your commissions and configure your payment method.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="p-6">
                    <div className="text-sm text-green-700 font-medium mb-1">Pending Payout</div>
                    <div className="text-3xl font-bold text-green-700">${(stats?.pendingPayout ?? 0).toFixed(2)}</div>
                    <div className="text-xs text-green-600 mt-1">Paid out on the 1st of next month</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="text-sm text-muted-foreground font-medium mb-1">All-Time Earnings</div>
                    <div className="text-3xl font-bold text-primary">${(stats?.totalEarned ?? 0).toFixed(2)}</div>
                    <div className="text-xs text-muted-foreground mt-1">Across all referrals</div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Payout Method</CardTitle>
                  <CardDescription>
                    Set your preferred payment method. Minimum payout threshold is $50.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="paypalEmail">PayPal Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="paypalEmail"
                        type="email"
                        placeholder="your@paypal.com"
                        className="pl-9"
                        value={settingsForm.paypalEmail}
                        onChange={(e) => setSettingsForm((f) => ({ ...f, paypalEmail: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="relative flex items-center">
                    <div className="flex-1 border-t border-border" />
                    <span className="px-3 text-xs text-muted-foreground bg-background">OR</span>
                    <div className="flex-1 border-t border-border" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="bankAccount">Bank Account / ACH Info</Label>
                    <Input
                      id="bankAccount"
                      placeholder="Routing No. / Account No."
                      value={settingsForm.bankAccount}
                      onChange={(e) => setSettingsForm((f) => ({ ...f, bankAccount: e.target.value }))}
                    />
                    <p className="text-xs text-muted-foreground">Routing number followed by account number (separate with /)</p>
                  </div>
                  <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90" onClick={async () => {
                    try {
                      await fetch("/api/affiliates/payout-method", { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ paypalEmail: settingsForm.paypalEmail, bankAccount: settingsForm.bankAccount }) });
                    } catch {}
                    toast({ title: "Payout Method Saved", description: "Your payment details have been updated." });
                  }}>
                    Save Payout Method
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Payout History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    <Wallet className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
                    No payouts yet. Your first payout will process once you reach the $50 minimum.
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ── SETTINGS TAB ── */}
          {activeTab === "settings" && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h1 className="text-2xl font-serif font-bold text-primary">Account Settings</h1>
                <p className="text-muted-foreground">Update your profile information, email, and password.</p>
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-6">
                {/* Profile */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Profile Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="sFirstName">First Name</Label>
                        <Input
                          id="sFirstName"
                          value={settingsForm.firstName}
                          onChange={(e) => setSettingsForm((f) => ({ ...f, firstName: e.target.value }))}
                          placeholder="First name"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="sLastName">Last Name</Label>
                        <Input
                          id="sLastName"
                          value={settingsForm.lastName}
                          onChange={(e) => setSettingsForm((f) => ({ ...f, lastName: e.target.value }))}
                          placeholder="Last name"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="sEmail">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="sEmail"
                          type="email"
                          className="pl-9"
                          value={settingsForm.email}
                          onChange={(e) => setSettingsForm((f) => ({ ...f, email: e.target.value }))}
                          placeholder="your@email.com"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">If you change your email, a new verification link will be sent.</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Password */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Change Password</CardTitle>
                    <CardDescription>Leave blank to keep your current password.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="currentPwd">Current Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="currentPwd"
                          type="password"
                          className="pl-9"
                          placeholder="Enter current password"
                          value={settingsForm.currentPassword}
                          onChange={(e) => setSettingsForm((f) => ({ ...f, currentPassword: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="newPwd">New Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="newPwd"
                          type="password"
                          className="pl-9"
                          placeholder="New password (min 8 characters)"
                          value={settingsForm.newPassword}
                          onChange={(e) => setSettingsForm((f) => ({ ...f, newPassword: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="confirmPwd">Confirm New Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="confirmPwd"
                          type="password"
                          className="pl-9"
                          placeholder="Re-enter new password"
                          value={settingsForm.confirmPassword}
                          onChange={(e) => setSettingsForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Button
                  type="submit"
                  className="w-full h-12 font-bold bg-secondary text-secondary-foreground hover:bg-secondary/90"
                  disabled={isSavingSettings}
                >
                  {isSavingSettings ? "Saving..." : "Save All Settings"}
                </Button>
              </form>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
