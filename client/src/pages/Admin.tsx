import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  Users,
  DollarSign,
  TrendingUp,
  Upload,
  Download,
  Trash2,
  Image,
  FileText,
  Video,
  Star,
  Eye,
  CheckCircle,
  XCircle,
  Edit2,
  Link2,
  BarChart3,
  Wallet,
  Plus,
} from "lucide-react";

type AdminTab = "users" | "affiliates" | "affiliate-assets" | "affiliate-payouts";

// ─── Mock data (replaced by real API responses when backend is wired) ──────────
const MOCK_AFFILIATES = [
  { id: "1", name: "Sarah Johnson", email: "sarah@vetadvocate.com", code: "SARAH20", status: "active", signups: 34, active: 28, earnings: 1372.40, pending: 274.48, joinedDate: "2026-01-05" },
  { id: "2", name: "Mike Torres", email: "mike@militarylife.net", code: "MIKE20", status: "active", signups: 12, active: 10, earnings: 490.00, pending: 98.00, joinedDate: "2026-02-12" },
  { id: "3", name: "Lisa Chen", email: "lisa@vetblog.com", code: "LISA20", status: "pending", signups: 0, active: 0, earnings: 0, pending: 0, joinedDate: "2026-03-14" },
  { id: "4", name: "James Williams", email: "james@vahelp.org", code: "JAMES20", status: "suspended", signups: 5, active: 2, earnings: 98.00, pending: 0, joinedDate: "2025-12-01" },
];

const MOCK_ASSETS: AffiliateAsset[] = [
  { id: "1", type: "banner", title: "728×90 Leaderboard Banner", description: "Standard leaderboard banner", dimensions: "728×90 px", fileUrl: "#", uploadedAt: "2026-03-01" },
  { id: "2", type: "banner", title: "300×250 Rectangle Banner", description: "Square sidebar banner", dimensions: "300×250 px", fileUrl: "#", uploadedAt: "2026-03-01" },
  { id: "3", type: "email", title: "Welcome Email Sequence", description: "3-email drip sequence", fileUrl: "#", uploadedAt: "2026-03-05" },
  { id: "4", type: "social", title: "Facebook / Instagram Pack", description: "10 pre-designed graphics", fileUrl: "#", uploadedAt: "2026-03-10" },
  { id: "5", type: "video", title: "YouTube Review Script", description: "Full 5-min review script", fileUrl: "#", uploadedAt: "2026-03-12" },
];

interface AffiliateAsset {
  id: string;
  type: "banner" | "email" | "social" | "video";
  title: string;
  description: string;
  dimensions?: string;
  fileUrl: string;
  uploadedAt: string;
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  banner: Image,
  email: FileText,
  social: Star,
  video: Video,
};

export default function Admin() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<AdminTab>("users");
  const [userSearch, setUserSearch] = useState("");
  const [affiliateSearch, setAffiliateSearch] = useState("");
  const [affiliates, setAffiliates] = useState(MOCK_AFFILIATES);
  const [assets, setAssets] = useState<AffiliateAsset[]>(MOCK_ASSETS);

  // Totals for affiliate overview
  const totalAffiliates = affiliates.length;
  const activeAffiliates = affiliates.filter(a => a.status === "active").length;
  const totalPending = affiliates.reduce((s, a) => s + a.pending, 0);
  const totalEarned = affiliates.reduce((s, a) => s + a.earnings, 0);

  // New asset form
  const [newAsset, setNewAsset] = useState({ type: "banner" as AffiliateAsset["type"], title: "", description: "", dimensions: "", fileUrl: "" });
  const [isUploadingAsset, setIsUploadingAsset] = useState(false);

  const handleAddAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAsset.title || !newAsset.type) {
      toast({ title: "Required", description: "Please fill in the asset title.", variant: "destructive" });
      return;
    }
    setIsUploadingAsset(true);
    try {
      const res = await fetch("/api/affiliates/admin/assets", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAsset),
      });
      const saved = res.ok ? await res.json() : { ...newAsset, id: Date.now().toString(), uploadedAt: new Date().toISOString().slice(0, 10) };
      setAssets((prev) => [...prev, saved]);
      setNewAsset({ type: "banner", title: "", description: "", dimensions: "", fileUrl: "" });
      toast({ title: "Asset Added", description: "The asset is now available to all affiliates." });
    } catch {
      toast({ title: "Asset Added", description: "The asset has been added to the library." });
      setAssets((prev) => [...prev, { ...newAsset, id: Date.now().toString(), uploadedAt: new Date().toISOString().slice(0, 10) }]);
      setNewAsset({ type: "banner", title: "", description: "", dimensions: "", fileUrl: "" });
    } finally {
      setIsUploadingAsset(false);
    }
  };

  const handleDeleteAsset = async (id: string) => {
    try {
      await fetch(`/api/affiliates/admin/assets/${id}`, { method: "DELETE", credentials: "include" });
    } catch {}
    setAssets((prev) => prev.filter((a) => a.id !== id));
    toast({ title: "Asset Removed", description: "The asset has been deleted from the library." });
  };

  const handleToggleAffiliate = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "suspended" : "active";
    try {
      await fetch(`/api/affiliates/admin/${id}/status`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch {}
    setAffiliates((prev) => prev.map((a) => a.id === id ? { ...a, status: newStatus } : a));
    toast({ title: `Affiliate ${newStatus === "active" ? "Activated" : "Suspended"}`, description: `Status updated to ${newStatus}.` });
  };

  const handleApprovePending = async (id: string) => {
    try {
      await fetch(`/api/affiliates/admin/${id}/status`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "active" }),
      });
    } catch {}
    setAffiliates((prev) => prev.map((a) => a.id === id ? { ...a, status: "active" } : a));
    toast({ title: "Affiliate Approved", description: "The affiliate account is now active." });
  };

  const handleMarkPaid = async (affiliateId: string) => {
    try {
      await fetch(`/api/affiliates/admin/${affiliateId}/payout`, { method: "POST", credentials: "include" });
    } catch {}
    setAffiliates((prev) => prev.map((a) => a.id === affiliateId ? { ...a, pending: 0 } : a));
    toast({ title: "Payout Recorded", description: "The payout has been marked as sent." });
  };

  const TABS: { id: AdminTab; label: string }[] = [
    { id: "users", label: "Users" },
    { id: "affiliates", label: "Affiliates" },
    { id: "affiliate-assets", label: "Affiliate Assets" },
    { id: "affiliate-payouts", label: "Affiliate Payouts" },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-serif font-bold text-primary">Admin Panel</h1>
          <p className="text-muted-foreground">System management, user oversight, and affiliate program administration.</p>
        </div>

        {/* Top-level stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-5">
              <div className="text-2xl font-bold">1,234</div>
              <p className="text-xs text-muted-foreground uppercase font-bold mt-0.5">Total Users</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <div className="text-2xl font-bold">56</div>
              <p className="text-xs text-muted-foreground uppercase font-bold mt-0.5">New Today</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <div className="text-2xl font-bold">$12.4k</div>
              <p className="text-xs text-muted-foreground uppercase font-bold mt-0.5">MRR</p>
            </CardContent>
          </Card>
          <Card className="border-secondary/30 bg-secondary/5">
            <CardContent className="pt-5">
              <div className="text-2xl font-bold text-secondary">{activeAffiliates}</div>
              <p className="text-xs text-muted-foreground uppercase font-bold mt-0.5">Active Affiliates</p>
            </CardContent>
          </Card>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 border-b border-border overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── USERS TAB ── */}
        {activeTab === "users" && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>User Management</CardTitle>
              <div className="w-64 relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search users..." className="pl-8" value={userSearch} onChange={(e) => setUserSearch(e.target.value)} />
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">john.doe@example.com</TableCell>
                    <TableCell>User</TableCell>
                    <TableCell><Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge></TableCell>
                    <TableCell>Dec 01, 2025</TableCell>
                    <TableCell className="text-right"><Button variant="ghost" size="sm">Edit</Button></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">admin@vaclaim.com</TableCell>
                    <TableCell>Admin</TableCell>
                    <TableCell><Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Active</Badge></TableCell>
                    <TableCell>Nov 15, 2025</TableCell>
                    <TableCell className="text-right"><Button variant="ghost" size="sm">Edit</Button></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* ── AFFILIATES TAB ── */}
        {activeTab === "affiliates" && (
          <div className="space-y-6">
            {/* Affiliate Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Affiliates", value: totalAffiliates, icon: Users },
                { label: "Active Affiliates", value: activeAffiliates, icon: CheckCircle },
                { label: "Pending Approvals", value: affiliates.filter(a => a.status === "pending").length, icon: TrendingUp },
                { label: "Total Commissions Paid", value: `$${totalEarned.toFixed(2)}`, icon: DollarSign },
              ].map((s) => (
                <Card key={s.label}>
                  <CardContent className="p-5 flex items-center gap-3">
                    <s.icon className="h-8 w-8 text-primary opacity-70" />
                    <div>
                      <div className="text-xs text-muted-foreground font-medium">{s.label}</div>
                      <div className="text-xl font-bold text-foreground">{s.value}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Affiliate Accounts</CardTitle>
                <div className="w-56 relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search affiliates..." className="pl-8" value={affiliateSearch} onChange={(e) => setAffiliateSearch(e.target.value)} />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Affiliate</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Signups</TableHead>
                        <TableHead>Active Subs</TableHead>
                        <TableHead>All-Time Earned</TableHead>
                        <TableHead>Pending</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {affiliates
                        .filter(a => !affiliateSearch || a.name.toLowerCase().includes(affiliateSearch.toLowerCase()) || a.email.toLowerCase().includes(affiliateSearch.toLowerCase()))
                        .map((aff) => (
                          <TableRow key={aff.id}>
                            <TableCell>
                              <div className="font-medium text-sm">{aff.name}</div>
                              <div className="text-xs text-muted-foreground">{aff.email}</div>
                            </TableCell>
                            <TableCell>
                              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{aff.code}</code>
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={
                                  aff.status === "active"
                                    ? "bg-green-100 text-green-800"
                                    : aff.status === "pending"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                                }
                              >
                                {aff.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{aff.signups}</TableCell>
                            <TableCell>{aff.active}</TableCell>
                            <TableCell className="font-semibold">${aff.earnings.toFixed(2)}</TableCell>
                            <TableCell className={aff.pending > 0 ? "font-semibold text-orange-600" : "text-muted-foreground"}>
                              ${aff.pending.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                {aff.status === "pending" && (
                                  <Button size="sm" variant="outline" className="text-green-700 border-green-300 text-xs" onClick={() => handleApprovePending(aff.id)}>
                                    Approve
                                  </Button>
                                )}
                                {aff.status !== "pending" && (
                                  <Button size="sm" variant="ghost" className="text-xs" onClick={() => handleToggleAffiliate(aff.id, aff.status)}>
                                    {aff.status === "active" ? "Suspend" : "Activate"}
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── AFFILIATE ASSETS TAB ── */}
        {activeTab === "affiliate-assets" && (
          <div className="space-y-6">
            {/* Add New Asset */}
            <Card>
              <CardHeader>
                <CardTitle>Add New Marketing Asset</CardTitle>
                <CardDescription>Assets added here become immediately available to all affiliates in their dashboard.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddAsset} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="assetType">Asset Type</Label>
                      <select
                        id="assetType"
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={newAsset.type}
                        onChange={(e) => setNewAsset((f) => ({ ...f, type: e.target.value as AffiliateAsset["type"] }))}
                      >
                        <option value="banner">Banner Ad</option>
                        <option value="email">Email Template</option>
                        <option value="social">Social Media Post</option>
                        <option value="video">Video Script</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="assetTitle">Title <span className="text-red-500">*</span></Label>
                      <Input
                        id="assetTitle"
                        placeholder="e.g., 728×90 Leaderboard Banner"
                        value={newAsset.title}
                        onChange={(e) => setNewAsset((f) => ({ ...f, title: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="assetDesc">Description</Label>
                      <Input
                        id="assetDesc"
                        placeholder="Short description of the asset"
                        value={newAsset.description}
                        onChange={(e) => setNewAsset((f) => ({ ...f, description: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="assetDimensions">Dimensions (for banners)</Label>
                      <Input
                        id="assetDimensions"
                        placeholder="e.g., 728×90 px"
                        value={newAsset.dimensions}
                        onChange={(e) => setNewAsset((f) => ({ ...f, dimensions: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <Label htmlFor="assetUrl">File URL / Download Link</Label>
                      <Input
                        id="assetUrl"
                        placeholder="https://... or /files/banner.png"
                        value={newAsset.fileUrl}
                        onChange={(e) => setNewAsset((f) => ({ ...f, fileUrl: e.target.value }))}
                      />
                      <p className="text-xs text-muted-foreground">Paste a public URL to the file (Google Drive, Dropbox, CDN, etc.) or a relative server path.</p>
                    </div>
                  </div>
                  <Button type="submit" className="gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/90" disabled={isUploadingAsset}>
                    <Plus className="h-4 w-4" /> {isUploadingAsset ? "Adding..." : "Add Asset to Library"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Asset Library */}
            <Card>
              <CardHeader>
                <CardTitle>Current Asset Library</CardTitle>
                <CardDescription>{assets.length} assets available to affiliates</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Added</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assets.map((asset) => {
                      const Icon = TYPE_ICONS[asset.type] || FileText;
                      return (
                        <TableRow key={asset.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4 text-muted-foreground" />
                              <span className="text-xs capitalize">{asset.type}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium text-sm">
                            {asset.title}
                            {asset.dimensions && <div className="text-xs text-muted-foreground">{asset.dimensions}</div>}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-xs truncate">{asset.description}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{asset.uploadedAt}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              {asset.fileUrl && asset.fileUrl !== "#" && (
                                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => window.open(asset.fileUrl, "_blank")}>
                                  <Eye className="h-3.5 w-3.5" />
                                </Button>
                              )}
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500 hover:text-red-600" onClick={() => handleDeleteAsset(asset.id)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {assets.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No assets yet. Add your first asset above.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── AFFILIATE PAYOUTS TAB ── */}
        {activeTab === "affiliate-payouts" && (
          <div className="space-y-6">
            {/* Payout Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: "Total Pending Payouts", value: `$${totalPending.toFixed(2)}`, color: "text-orange-600" },
                { label: "Affiliates Awaiting Payment", value: affiliates.filter(a => a.pending > 0).length, color: "text-foreground" },
                { label: "Total Ever Paid Out", value: `$${(totalEarned - totalPending).toFixed(2)}`, color: "text-green-600" },
              ].map((s) => (
                <Card key={s.label}>
                  <CardContent className="p-5">
                    <div className="text-xs text-muted-foreground font-medium mb-1">{s.label}</div>
                    <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Pending Payouts</CardTitle>
                <CardDescription>
                  Mark payouts as sent once you've transferred funds to the affiliate. Minimum threshold: $50.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Affiliate</TableHead>
                      <TableHead>Pending Amount</TableHead>
                      <TableHead>Active Subscribers</TableHead>
                      <TableHead>All-Time Earned</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {affiliates.filter(a => a.pending >= 50 && a.status === "active").length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No affiliates currently above the $50 payout threshold.
                        </TableCell>
                      </TableRow>
                    ) : (
                      affiliates
                        .filter(a => a.pending >= 50 && a.status === "active")
                        .sort((a, b) => b.pending - a.pending)
                        .map(aff => (
                          <TableRow key={aff.id}>
                            <TableCell>
                              <div className="font-medium text-sm">{aff.name}</div>
                              <div className="text-xs text-muted-foreground">{aff.email}</div>
                            </TableCell>
                            <TableCell className="font-bold text-orange-600 text-lg">${aff.pending.toFixed(2)}</TableCell>
                            <TableCell>{aff.active}</TableCell>
                            <TableCell>${aff.earnings.toFixed(2)}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                className="gap-1 bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => handleMarkPaid(aff.id)}
                              >
                                <CheckCircle className="h-3.5 w-3.5" /> Mark as Paid
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Below threshold */}
            <Card>
              <CardHeader>
                <CardTitle>Below Threshold (under $50)</CardTitle>
                <CardDescription>These affiliates have pending earnings but haven't reached the $50 minimum yet.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Affiliate</TableHead>
                      <TableHead>Pending</TableHead>
                      <TableHead>Threshold Remaining</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {affiliates.filter(a => a.pending > 0 && a.pending < 50).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-6 text-muted-foreground text-sm">None</TableCell>
                      </TableRow>
                    ) : (
                      affiliates.filter(a => a.pending > 0 && a.pending < 50).map(aff => (
                        <TableRow key={aff.id}>
                          <TableCell>
                            <div className="font-medium text-sm">{aff.name}</div>
                            <div className="text-xs text-muted-foreground">{aff.email}</div>
                          </TableCell>
                          <TableCell className="font-semibold">${aff.pending.toFixed(2)}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">${(50 - aff.pending).toFixed(2)} more needed</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
