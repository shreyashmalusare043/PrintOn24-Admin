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
  const [email, setEmail] = useState('admin@printon24.com');
  const [password, setPassword] = useState('admin123');
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

  const handleQuickFillAdmin = () => {
    setEmail('admin@printon24.com');
    setPassword('admin123');
    toast.info('Default Super Admin credentials loaded');
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
        {/* Left Side: Visual Illustrations & Printing/Xerox Graphics */}
        <div className="hidden md:flex md:col-span-6 flex-col space-y-6 pr-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <img
                src="https://miaoda-conversation-file.s3cdn.medo.dev/user-awm3lxjnyu4g/app-evp0b1kqhrlt/20261011/printOn24.png"
                alt="printOn24"
                className="h-16 w-auto object-contain"
              />
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-primary">Print Ecosystem</span>
                <span className="text-xs text-muted-foreground font-semibold">24/7 Cloud Network</span>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs py-0.5">
                Executive Control Hub
              </Badge>
              <Badge variant="secondary" className="text-xs py-0.5 font-mono">
                v2.4 LTS • Encrypted
              </Badge>
            </div>
            <h2 className="text-2xl font-heading font-extrabold text-foreground tracking-tight leading-snug">
              Autonomous Document Printing & Xerox Terminal Ecosystem
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Super Admin gateway for multi-shop routing, hardware terminal limits, live Razorpay settlements, and high-speed print queues across India.
            </p>
          </div>

          {/* Premium Visual Graphics Banner with Cyan/Magenta/Yellow/Black Print Motif */}
          <div className="relative rounded-2xl overflow-hidden border border-border/80 bg-gradient-to-br from-card via-card/90 to-muted/40 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-2.5 h-2.5 rounded-full bg-cyan-500" title="Cyan Channel" />
                <div className="w-2.5 h-2.5 rounded-full bg-pink-500" title="Magenta Channel" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" title="Yellow Channel" />
                <div className="w-2.5 h-2.5 rounded-full bg-slate-900 dark:bg-white" title="Key (Black) Channel" />
                <span className="text-[10px] font-mono text-muted-foreground uppercase ml-1">CMYK Color Engine</span>
              </div>
              <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-600 bg-emerald-500/5">
                Hardware Online
              </Badge>
            </div>

            {/* Visual Terminal Pipeline Diagram */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-background/60 border border-border/50">
                <FileText className="w-4 h-4 mx-auto text-primary mb-1" />
                <div className="text-[11px] font-bold">1. Cloud Inflow</div>
                <div className="text-[9px] text-muted-foreground">Mobile & Web Upload</div>
              </div>
              <div className="p-2.5 rounded-xl bg-background/60 border border-border/50">
                <Zap className="w-4 h-4 mx-auto text-amber-500 mb-1" />
                <div className="text-[11px] font-bold">2. Razorpay / Cash</div>
                <div className="text-[9px] text-muted-foreground">Instant Verification</div>
              </div>
              <div className="p-2.5 rounded-xl bg-background/60 border border-border/50">
                <Printer className="w-4 h-4 mx-auto text-emerald-500 mb-1" />
                <div className="text-[11px] font-bold">3. Terminal Spool</div>
                <div className="text-[9px] text-muted-foreground">High-Speed Print</div>
              </div>
            </div>

            {/* Graphical Feature Visuals */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <div className="p-3 rounded-xl border border-border/50 bg-background/40 backdrop-blur shadow-2xs space-y-1">
                <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Printer className="w-3.5 h-3.5" />
                </div>
                <p className="text-xs font-bold text-foreground">Digital Xerox & Laser</p>
                <p className="text-[10px] text-muted-foreground">High-precision duplex & multi-printer routing</p>
              </div>

              <div className="p-3 rounded-xl border border-border/50 bg-background/40 backdrop-blur shadow-2xs space-y-1">
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
                  <Copy className="w-3.5 h-3.5" />
                </div>
                <p className="text-xs font-bold text-foreground">Sub-60s Turnaround</p>
                <p className="text-[10px] text-muted-foreground">Automated customer queue token dispatch</p>
              </div>

              <div className="p-3 rounded-xl border border-border/50 bg-background/40 backdrop-blur shadow-2xs space-y-1">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <p className="text-xs font-bold text-foreground">Encrypted Pipeline</p>
                <p className="text-[10px] text-muted-foreground">Automated 12-hour purge & terminal isolation</p>
              </div>

              <div className="p-3 rounded-xl border border-border/50 bg-background/40 backdrop-blur shadow-2xs space-y-1">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
                  <Zap className="w-3.5 h-3.5" />
                </div>
                <p className="text-xs font-bold text-foreground">2-Day Settlements</p>
                <p className="text-[10px] text-muted-foreground">Verified shopkeeper financial reconciliation</p>
              </div>
            </div>
          </div>

          {/* Quick status pill */}
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/60 border border-border text-xs text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>All printing endpoints and cloud queue brokers operational</span>
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
                      placeholder="admin@printon24.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9 h-10 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-xs font-semibold">Password</Label>
                    <button
                      type="button"
                      onClick={handleQuickFillAdmin}
                      className="text-[11px] text-primary hover:underline font-medium"
                    >
                      Auto-Fill Preset
                    </button>
                  </div>
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
