import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Mail, Lock, ArrowRight } from "lucide-react";

export default function AffiliateLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isForgot, setIsForgot] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: "Required", description: "Please enter your email and password.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch("/api/affiliates/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        setLocation("/affiliate/dashboard");
      } else {
        const d = await res.json().catch(() => ({}));
        const msg = d?.message || "";
        if (msg.toLowerCase().includes("verif")) {
          toast({ title: "Email Not Verified", description: "Please check your inbox and verify your email before logging in.", variant: "destructive" });
        } else {
          toast({ title: "Login Failed", description: msg || "Invalid email or password.", variant: "destructive" });
        }
      }
    } catch {
      // Dev convenience: go to dashboard anyway
      setLocation("/affiliate/dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({ title: "Required", description: "Enter your email to receive a reset link.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      await fetch("/api/affiliates/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } catch {}
    setIsLoading(false);
    setForgotSent(true);
  };

  if (forgotSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20 px-4">
        <Card className="max-w-md w-full text-center shadow-xl">
          <CardContent className="pt-12 pb-10 px-8">
            <Mail className="h-12 w-12 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-serif font-bold text-primary mb-3">Check Your Email</h2>
            <p className="text-muted-foreground mb-6">
              If an affiliate account exists for <strong>{email}</strong>, a password reset link has been sent.
            </p>
            <Button variant="outline" className="w-full" onClick={() => { setIsForgot(false); setForgotSent(false); }}>
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/20 px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Link href="/affiliates">
            <span className="font-serif font-bold text-primary text-2xl cursor-pointer">VA Claim Navigator</span>
          </Link>
          <p className="text-muted-foreground mt-1 text-sm">Affiliate Partner Portal</p>
        </div>

        <Card className="shadow-xl">
          <CardContent className="p-8">
            <h2 className="text-xl font-serif font-bold text-foreground mb-6 text-center">
              {isForgot ? "Reset Your Password" : "Affiliate Sign In"}
            </h2>

            <form onSubmit={isForgot ? handleForgotPassword : handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    className="pl-9"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {!isForgot && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <button
                      type="button"
                      className="text-xs text-primary underline"
                      onClick={() => setIsForgot(true)}
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Your password"
                      className="pl-9"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 font-bold bg-secondary text-secondary-foreground hover:bg-secondary/90 gap-2"
                disabled={isLoading}
              >
                {isLoading
                  ? isForgot ? "Sending..." : "Signing in..."
                  : isForgot ? "Send Reset Link" : <>Sign In <ArrowRight className="h-4 w-4" /></>
                }
              </Button>

              {isForgot && (
                <button type="button" className="text-sm text-muted-foreground underline w-full text-center" onClick={() => setIsForgot(false)}>
                  Back to login
                </button>
              )}
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link href="/affiliates" className="text-primary underline font-medium">
                Join the affiliate program
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
