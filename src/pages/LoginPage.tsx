import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import {
  Printer,
  Lock,
  Mail,
  ShieldAlert,
  Sun,
  Moon,
  Palette,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Copy,
  Layers,
  Sparkles,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { themeColor, setThemeColor, themeMode, toggleThemeMode } = useTheme();
  const navigate = useNavigate();

  // Admin form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmitAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const res = await login(email, password);
      if (res.success) {
        toast.success('Welcome back, Super Administrator!');
        navigate('/dashboard');
      } else {
        setErrorMessage(res.error || 'Failed to authenticate');
        toast.error(res.error || 'Login failed');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred');
      toast.error('Authentication error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center p-4 bg-muted/20 relative overflow-x-hidden">
      {/* Background Graphic Grid with Printing & Photocopy Motif */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05] bg-[radial-gradient(#e11d48_1px,transparent_1px)] [background-size:20px_20px]" />

      {/* Top right quick theme toggles */}
      <div className="fixed top-4 right-4 flex items-center space-x-2 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setThemeColor(themeColor === 'white_red' ? 'white_blue' : 'white_red')}
          className="h-9 gap-1.5 text-xs bg-card shadow-sm"
        >
          <Palette className="w-3.5 h-3.5 text-primary" />
          <span>{themeColor === 'white_red' ? 'White + Red' : 'White + Blue'}</span>
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={toggleThemeMode}
          className="h-9 w-9 bg-card shadow-sm"
          title="Toggle Light / Dark Mode"
        >
          {themeMode === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
        </Button>
      </div>

      {/* Main Container: Split-View with Visual Graphics and Admin Sign In */}
      <div className="w-full max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-center z-10 py-8">
        {/* Left Side: Redesigned High-Impact PrintOn24 Administrative Visual Art */}
        <div className="hidden md:flex md:col-span-6 flex-col space-y-5 pr-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <img
                src="https://miaoda-conversation-file.s3cdn.medo.dev/user-awm3lxjnyu4g/app-evp0b1kqhrlt/20261011/printOn24.png"
                alt="printOn24"
                className="h-14 w-auto object-contain"
              />
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-mono tracking-widest font-bold text-primary">Super Admin Portal</span>
                <span className="text-xs text-muted-foreground font-semibold">Central Reprography Network</span>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-0.5">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs py-0.5">
                Executive Control Hub
              </Badge>
              <Badge variant="secondary" className="text-xs py-0.5 font-mono">
                v2.4 LTS • Encrypted
              </Badge>
            </div>
            <h2 className="text-2xl font-heading font-extrabold text-foreground tracking-tight leading-snug">
              India's Premier Autonomous Document Printing & Xerox Network
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Real-time platform orchestration for multi-shop routing, hardware terminal limits, live Razorpay 2-day payouts, and student document queues across campuses.
            </p>
          </div>

          {/* Branded Graphic Showcase Card inspired by Shopkeeper Portal Artwork */}
          <div className="relative rounded-2xl overflow-hidden border border-border/80 bg-gradient-to-br from-card via-card/95 to-muted/50 p-5 shadow-md space-y-4">
            {/* Top Graphic Header */}
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <div className="flex items-center space-x-2">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                <span className="text-xs font-bold text-foreground">PrintOn24 Cloud Engine</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <div className="w-2 h-2 rounded-full bg-cyan-500" title="Cyan" />
                <div className="w-2 h-2 rounded-full bg-pink-500" title="Magenta" />
                <div className="w-2 h-2 rounded-full bg-amber-400" title="Yellow" />
                <div className="w-2 h-2 rounded-full bg-foreground" title="Black" />
                <span className="text-[10px] font-mono text-muted-foreground ml-1">CMYK 2400 DPI</span>
              </div>
            </div>

            {/* Visual Workflow Infographic */}
            <div className="grid grid-cols-3 gap-2 text-center py-1">
              <div className="p-2.5 rounded-xl bg-background/80 border border-border/60 shadow-2xs space-y-1">
                <div className="w-7 h-7 mx-auto rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <FileText className="w-3.5 h-3.5" />
                </div>
                <div className="text-[11px] font-bold text-foreground">1. User Upload</div>
                <div className="text-[9px] text-muted-foreground">QR Scan & Cloud Spool</div>
              </div>

              <div className="p-2.5 rounded-xl bg-background/80 border border-border/60 shadow-2xs space-y-1">
                <div className="w-7 h-7 mx-auto rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
                  <Zap className="w-3.5 h-3.5" />
                </div>
                <div className="text-[11px] font-bold text-foreground">2. Swift Pay</div>
                <div className="text-[9px] text-muted-foreground">UPI / Razorpay / Cash</div>
              </div>

              <div className="p-2.5 rounded-xl bg-background/80 border border-border/60 shadow-2xs space-y-1">
                <div className="w-7 h-7 mx-auto rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <Printer className="w-3.5 h-3.5" />
                </div>
                <div className="text-[11px] font-bold text-foreground">3. Auto Print</div>
                <div className="text-[9px] text-muted-foreground">Silent Laser Dispatch</div>
              </div>
            </div>

            {/* Feature Metrics Badges */}
            <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
              <div className="p-2.5 rounded-xl bg-muted/40 border border-border/50 flex items-center space-x-2.5">
                <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-foreground text-[11px]">Hardware Protection</div>
                  <div className="text-[10px] text-muted-foreground truncate">Per-shop PC quota limits</div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-muted/40 border border-border/50 flex items-center space-x-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                  <Copy className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-foreground text-[11px]">2-Day Payout Cycles</div>
                  <div className="text-[10px] text-muted-foreground truncate">Automated settlements</div>
                </div>
              </div>
            </div>
          </div>

          {/* Real-time Status Indicator */}
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50 border border-border text-xs text-muted-foreground">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-medium text-foreground">Network Live:</span>
              <span>All campus printer endpoints operational</span>
            </div>
            <span className="font-mono text-[10px] text-muted-foreground">IST Timezone Active</span>
          </div>
        </div>

        {/* Right Side: Sign In Card */}
        <div className="w-full md:col-span-6 max-w-md mx-auto space-y-4">
          {/* Mobile Brand Display */}
          <div className="md:hidden text-center space-y-2 mb-2">
            <img
              src="https://miaoda-conversation-file.s3cdn.medo.dev/user-awm3lxjnyu4g/app-evp0b1kqhrlt/20261011/printOn24.png"
              alt="printOn24"
              className="h-10 w-auto object-contain mx-auto"
            />
            <p className="text-xs font-medium text-muted-foreground">
              Super Admin Authentication Gateway
            </p>
          </div>

          <Card className="border border-border shadow-xl bg-card">
            <CardHeader className="space-y-1 pb-3 text-center">
              <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-primary/10 text-primary mx-auto mb-1">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <CardTitle className="text-xl font-heading font-bold text-foreground">
                Super Admin Sign In
              </CardTitle>
              <CardDescription className="text-xs">
                Enter authorized credentials for platform management and controls
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-2">
              {errorMessage && (
                <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center space-x-2">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmitAdmin} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-semibold">Administrator Email</Label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
                    <Input
                      id="email"
                      type="email"
                      required
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9 h-10 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-xs font-semibold">Password</Label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
                    <Input
                      id="password"
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-9 h-10 text-sm"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-10 font-semibold text-sm shadow-sm mt-3"
                >
                  {isSubmitting ? 'Authenticating...' : (
                    <span className="flex items-center justify-center gap-2">
                      Sign In to Dashboard <ArrowRight className="w-4 h-4" />
                    </span>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Secure access note */}
          <p className="text-center text-[11px] text-muted-foreground">
            Protected by multi-tier session encryption and role-based access policies.
          </p>
        </div>
      </div>
    </div>
  );
};
