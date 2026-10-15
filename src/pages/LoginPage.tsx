import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { validateShopkeeperLogin } from '@/services/api';
import { supabase } from '@/db/supabase';
import {
  Printer,
  Lock,
  Mail,
  ShieldAlert,
  Sun,
  Moon,
  Palette,
  ArrowRight,
  Store,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Layers,
  HelpCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { themeColor, setThemeColor, themeMode, toggleThemeMode } = useTheme();
  const navigate = useNavigate();

  const [activeRole, setActiveRole] = useState<'admin' | 'shopkeeper'>('admin');

  // Admin form
  const [email, setEmail] = useState('admin@printon24.com');
  const [password, setPassword] = useState('admin123');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Shopkeeper form
  const [shopEmail, setShopEmail] = useState('techzone@printon24.com');
  const [shopPassword, setShopPassword] = useState('shopkeeper123');
  const [isShopSubmitting, setIsShopSubmitting] = useState(false);
  const [shopkeeperFeedback, setShopkeeperFeedback] = useState<{
    type: 'success' | 'disabled' | 'subscription_expired' | 'error';
    title: string;
    message: string;
    shopName?: string;
    terminalCode?: string;
    subDetails?: string;
  } | null>(null);

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

  const handleShopkeeperLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setShopkeeperFeedback(null);
    setIsShopSubmitting(true);

    try {
      // 1. Verify credentials in shopkeeper_accounts table
      const { data: account, error: accErr } = await supabase
        .from('shopkeeper_accounts')
        .select('*')
        .eq('email', shopEmail.trim().toLowerCase())
        .maybeSingle();

      if (accErr || !account) {
        setShopkeeperFeedback({
          type: 'error',
          title: 'Account Not Found',
          message: 'Invalid shopkeeper email address. Please check your credentials or contact Super Admin.'
        });
        toast.error('Account not found');
        return;
      }

      if (account.password_hash !== shopPassword.trim()) {
        setShopkeeperFeedback({
          type: 'error',
          title: 'Authentication Failed',
          message: 'Incorrect password entered for this shopkeeper account.'
        });
        toast.error('Incorrect password');
        return;
      }

      // 2. Enforce Shopkeeper Access & Subscription Rules
      const validation = await validateShopkeeperLogin(account.shop_id);

      if (!validation.allowed) {
        if (validation.status === 'disabled') {
          setShopkeeperFeedback({
            type: 'disabled',
            title: 'Shopkeeper Account Disabled',
            message: validation.message,
            shopName: validation.shop?.name,
            terminalCode: validation.shop?.terminal_code
          });
          toast.error(validation.message);
        } else if (validation.status === 'subscription_expired') {
          setShopkeeperFeedback({
            type: 'subscription_expired',
            title: 'Subscription Inactive / Expired',
            message: validation.message,
            shopName: validation.shop?.name,
            terminalCode: validation.shop?.terminal_code
          });
          toast.error('Subscription plan expired. Access restricted.');
        } else {
          setShopkeeperFeedback({
            type: 'error',
            title: 'Access Restricted',
            message: validation.message
          });
          toast.error(validation.message);
        }
        return;
      }

      // 3. Allowed
      setShopkeeperFeedback({
        type: 'success',
        title: 'Authentication & Subscription Verified',
        message: 'All shopkeeper permissions and subscription validity checks passed successfully.',
        shopName: validation.shop?.name,
        terminalCode: validation.shop?.terminal_code,
        subDetails: `Terminal Limit: ${validation.shop?.pc_limit || 2} PCs`
      });
      toast.success(`Access permitted for ${validation.shop?.name}!`);
    } catch (err: any) {
      setShopkeeperFeedback({
        type: 'error',
        title: 'System Error',
        message: err.message || 'Failed to complete authentication checks.'
      });
    } finally {
      setIsShopSubmitting(false);
    }
  };

  const handleQuickFillShopkeeper = (type: 'active' | 'disabled' | 'expired') => {
    setShopkeeperFeedback(null);
    if (type === 'active') {
      setShopEmail('techzone@printon24.com');
      setShopPassword('shopkeeper123');
      toast.info('Active shopkeeper loaded: TechZone Lab');
    } else if (type === 'disabled') {
      setShopEmail('aundh@printon24.com');
      setShopPassword('shopkeeper123');
      toast.warning('Disabled shopkeeper loaded: Aundh Studio');
    } else if (type === 'expired') {
      setShopEmail('kothrud@printon24.com');
      setShopPassword('shopkeeper123');
      toast.warning('Expired subscription shopkeeper loaded: Kothrud Prints');
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center p-4 bg-muted/30">
      {/* Top right quick theme toggles */}
      <div className="fixed top-4 right-4 flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setThemeColor(themeColor === 'white_red' ? 'white_blue' : 'white_red')}
          className="h-9 gap-1.5 text-xs bg-card"
        >
          <Palette className="w-3.5 h-3.5 text-primary" />
          <span>{themeColor === 'white_red' ? 'White + Red' : 'White + Blue'}</span>
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={toggleThemeMode}
          className="h-9 w-9 bg-card"
          title="Toggle Light / Dark Mode"
        >
          {themeMode === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
        </Button>
      </div>

      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary text-primary-foreground shadow-md mb-2">
            <Printer className="w-8 h-8" />
          </div>
          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-foreground">
            PrintOn24
          </h1>
          <p className="text-sm font-medium text-muted-foreground">
            Centralized Platform Portal & Authentication Gate
          </p>
        </div>

        {/* Login Card */}
        <Card className="border border-border shadow-lg bg-card">
          <CardHeader className="space-y-1 pb-3">
            <Tabs value={activeRole} onValueChange={(val: any) => setActiveRole(val)} className="w-full">
              <TabsList className="grid grid-cols-2 h-9 text-xs">
                <TabsTrigger value="admin" className="text-xs">
                  Super Admin
                </TabsTrigger>
                <TabsTrigger value="shopkeeper" className="text-xs">
                  Shopkeeper Portal
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>

          <CardContent className="pt-2">
            {/* SUPER ADMIN LOGIN */}
            {activeRole === 'admin' && (
              <>
                <div className="mb-4 text-center">
                  <CardTitle className="text-lg font-heading font-bold">Administrator Sign In</CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Authorized credentials for platform oversight and controls
                  </CardDescription>
                </div>

                {errorMessage && (
                  <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center space-x-2">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <form onSubmit={handleSubmitAdmin} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs font-semibold">Admin Email</Label>
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
                    className="w-full h-10 font-semibold text-sm shadow-sm mt-2"
                  >
                    {isSubmitting ? 'Authenticating...' : (
                      <span className="flex items-center justify-center gap-2">
                        Enter Super Admin <ArrowRight className="w-4 h-4" />
                      </span>
                    )}
                  </Button>
                </form>
              </>
            )}

            {/* SHOPKEEPER ACCESS & SUBSCRIPTION ENFORCEMENT */}
            {activeRole === 'shopkeeper' && (
              <>
                <div className="mb-3 text-center">
                  <CardTitle className="text-lg font-heading font-bold">Shopkeeper Sign In</CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Enforces account active status and subscription validity rules
                  </CardDescription>
                </div>

                {/* Status Feedback Notice */}
                {shopkeeperFeedback && (
                  <div
                    className={`mb-4 p-3 rounded-lg border text-xs space-y-1.5 ${
                      shopkeeperFeedback.type === 'success'
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                        : shopkeeperFeedback.type === 'disabled'
                        ? 'bg-destructive/10 border-destructive/30 text-destructive'
                        : 'bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold">
                      {shopkeeperFeedback.type === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <ShieldAlert className="w-4 h-4 shrink-0" />
                      )}
                      <span>{shopkeeperFeedback.title}</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">{shopkeeperFeedback.message}</p>
                    {shopkeeperFeedback.shopName && (
                      <div className="text-[10px] opacity-80 pt-1 border-t border-current/20 flex justify-between">
                        <span>Shop: <strong>{shopkeeperFeedback.shopName}</strong></span>
                        <span>Terminal: <strong>{shopkeeperFeedback.terminalCode}</strong></span>
                      </div>
                    )}
                  </div>
                )}

                <form onSubmit={handleShopkeeperLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="shop-email" className="text-xs font-semibold">Shopkeeper Email</Label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
                      <Input
                        id="shop-email"
                        type="email"
                        required
                        placeholder="shopkeeper@printon24.com"
                        value={shopEmail}
                        onChange={(e) => setShopEmail(e.target.value)}
                        className="pl-9 h-10 text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="shop-pass" className="text-xs font-semibold">Password</Label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
                      <Input
                        id="shop-pass"
                        type="password"
                        required
                        placeholder="••••••••"
                        value={shopPassword}
                        onChange={(e) => setShopPassword(e.target.value)}
                        className="pl-9 h-10 text-sm"
                      />
                    </div>
                  </div>

                  {/* Test Preset Buttons */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] text-muted-foreground font-semibold uppercase">
                      Test Rule Scenarios:
                    </span>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleQuickFillShopkeeper('active')}
                        className="py-1 px-1.5 rounded border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/15 text-[10px] text-emerald-700 dark:text-emerald-300 font-medium truncate text-center"
                      >
                        Active Shop
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickFillShopkeeper('disabled')}
                        className="py-1 px-1.5 rounded border border-destructive/30 bg-destructive/5 hover:bg-destructive/15 text-[10px] text-destructive font-medium truncate text-center"
                      >
                        Disabled Shop
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickFillShopkeeper('expired')}
                        className="py-1 px-1.5 rounded border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/15 text-[10px] text-amber-700 dark:text-amber-300 font-medium truncate text-center"
                      >
                        Expired Sub
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isShopSubmitting}
                    className="w-full h-10 font-semibold text-sm shadow-sm mt-2"
                  >
                    {isShopSubmitting ? 'Verifying Account & Subscription...' : (
                      <span className="flex items-center justify-center gap-2">
                        Verify & Sign In <ArrowRight className="w-4 h-4" />
                      </span>
                    )}
                  </Button>
                </form>
              </>
            )}
          </CardContent>

          <CardFooter className="flex flex-col space-y-2 pt-0 pb-4 border-t border-border/40 text-center">
            <div className="pt-3 text-[11px] text-muted-foreground flex items-center justify-center gap-3">
              <a href="/pages/privacy_policy" target="_blank" rel="noopener noreferrer" className="hover:underline">
                Privacy Policy
              </a>
              <span>•</span>
              <a href="/pages/terms_conditions" target="_blank" rel="noopener noreferrer" className="hover:underline">
                Terms of Service
              </a>
              <span>•</span>
              <a href="/pages/about_us" target="_blank" rel="noopener noreferrer" className="hover:underline">
                About Us
              </a>
            </div>
          </CardFooter>
        </Card>

        {/* Footer info */}
        <div className="text-center text-xs text-muted-foreground">
          <p>© 2026 PrintOn24 Inc. All platform rights reserved.</p>
          <p className="text-[11px] text-muted-foreground/80 mt-1">
            Enforced Account Security & Realtime Subscription Verification
          </p>
        </div>
      </div>
    </div>
  );
};
