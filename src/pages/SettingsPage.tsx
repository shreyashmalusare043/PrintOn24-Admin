import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import {
  updateSuperAdminProfile,
  fetchSecurityPasswordConfigs,
  updateSecurityPasswordWithOtp,
  setUnifiedSecurityPin
} from '@/services/api';
import {
  Settings,
  Palette,
  Sun,
  Moon,
  ShieldCheck,
  UserCheck,
  Key,
  Check,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  KeyRound,
  ShieldAlert,
  ArrowRight,
  Shield
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { SecurityPasswordType, SecurityPasswordConfig } from '@/types/types';
import { OtpVerificationModal } from '@/components/security/OtpVerificationModal';
import { toast } from 'sonner';

interface SecurityPasswordCardConfig {
  type: SecurityPasswordType;
  title: string;
  description: string;
  icon: React.ElementType;
}

const passwordCardConfigs: SecurityPasswordCardConfig[] = [
  {
    type: 'credential_view',
    title: 'Shopkeeper Credential View',
    description: 'Required to unlock and view shopkeeper login credentials in the Shop Details directory.',
    icon: KeyRound
  },
  {
    type: 'settlement_payout',
    title: 'Settlement & Payout',
    description: 'Guards the 2-day settlement cycle payouts, payout disbarment execution, and banking logs.',
    icon: ShieldCheck
  },
  {
    type: 'payment_methods',
    title: 'Payment Methods',
    description: 'Protects modification of payment modes (Counter / Razorpay / Dual) across all print terminals.',
    icon: Lock
  }
];

export const SettingsPage: React.FC = () => {
  const { admin, updateAdmin } = useAuth();
  const { themeColor, setThemeColor, themeMode, setThemeMode } = useTheme();

  const [fullName, setFullName] = useState(admin?.full_name || 'Super Administrator');
  const [email] = useState(admin?.email || 'admin@printon24.com');
  const [saving, setSaving] = useState(false);

  // Security Passwords State
  const [securityConfigs, setSecurityConfigs] = useState<Record<string, SecurityPasswordConfig | null>>({
    credential_view: null,
    settlement_payout: null,
    payment_methods: null,
    system_security_pin: null
  });
  const [loadingConfigs, setLoadingConfigs] = useState(true);

  // Unified PIN Setup Modal State (Requires Super Admin Password)
  const [showUnifiedPinModal, setShowUnifiedPinModal] = useState(false);
  const [adminSignInPassword, setAdminSignInPassword] = useState('');
  const [unifiedPin, setUnifiedPin] = useState('');
  const [confirmUnifiedPin, setConfirmUnifiedPin] = useState('');
  const [unifiedPinError, setUnifiedPinError] = useState<string | null>(null);
  const [submittingUnifiedPin, setSubmittingUnifiedPin] = useState(false);

  // OTP & Password Update Modal State (legacy / fallback)
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [activePasswordType, setActivePasswordType] = useState<SecurityPasswordType | null>(null);
  const [verifiedOtpCode, setVerifiedOtpCode] = useState<string | null>(null);

  // Password Input Modal
  const [showPasswordSetupModal, setShowPasswordSetupModal] = useState(false);
  const [newPinDigits, setNewPinDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [confirmPinDigits, setConfirmPinDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [pinError, setPinError] = useState<string | null>(null);
  const [submittingPin, setSubmittingPin] = useState(false);
  const newPinRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    loadSecurityConfigs();
  }, []);

  const loadSecurityConfigs = async () => {
    setLoadingConfigs(true);
    try {
      const list = await fetchSecurityPasswordConfigs();
      const map: Record<string, SecurityPasswordConfig | null> = {
        credential_view: null,
        settlement_payout: null,
        payment_methods: null,
        system_security_pin: null
      };
      list.forEach((item) => {
        map[item.password_type] = item;
      });
      setSecurityConfigs(map);
    } catch {
      toast.error('Failed to load security configurations');
    } finally {
      setLoadingConfigs(false);
    }
  };

  const handleSaveUnifiedPin = async () => {
    if (!adminSignInPassword.trim()) {
      setUnifiedPinError('Please enter your Super Admin sign-in password.');
      return;
    }
    if (unifiedPin.length !== 6 || !/^\d{6}$/.test(unifiedPin)) {
      setUnifiedPinError('Security PIN must be exactly 6 numeric digits.');
      return;
    }
    if (unifiedPin !== confirmUnifiedPin) {
      setUnifiedPinError('PINs do not match. Please verify.');
      return;
    }

    setSubmittingUnifiedPin(true);
    setUnifiedPinError(null);
    try {
      const res = await setUnifiedSecurityPin(unifiedPin, adminSignInPassword);
      if (res.success) {
        toast.success('Unified 6-Digit Security PIN configured and synced across all protected views!');
        setShowUnifiedPinModal(false);
        setAdminSignInPassword('');
        setUnifiedPin('');
        setConfirmUnifiedPin('');
        await loadSecurityConfigs();
      } else {
        setUnifiedPinError(res.error || 'Failed to update security PIN.');
      }
    } catch {
      setUnifiedPinError('Network error. Failed to save security PIN.');
    } finally {
      setSubmittingUnifiedPin(false);
    }
  };

  const handleStartPasswordUpdate = (type: SecurityPasswordType) => {
    setActivePasswordType(type);
    setVerifiedOtpCode(null);
    setOtpModalOpen(true);
  };

  const handleOtpVerified = (otpCode: string) => {
    setVerifiedOtpCode(otpCode);
    setOtpModalOpen(false);
    setNewPinDigits(['', '', '', '', '', '']);
    setConfirmPinDigits(['', '', '', '', '', '']);
    setPinError(null);
    setShowPasswordSetupModal(true);
    setTimeout(() => {
      newPinRefs.current[0]?.focus();
    }, 150);
  };

  const handlePinDigitChange = (index: number, val: string, isConfirm = false) => {
    const clean = val.replace(/\D/g, '');
    const targetDigits = isConfirm ? [...confirmPinDigits] : [...newPinDigits];
    const setTarget = isConfirm ? setConfirmPinDigits : setNewPinDigits;

    if (!clean) {
      targetDigits[index] = '';
      setTarget(targetDigits);
      return;
    }

    targetDigits[index] = clean[clean.length - 1];
    setTarget(targetDigits);
    setPinError(null);

    if (index < 5 && clean) {
      const nextRef = isConfirm ? null : newPinRefs.current[index + 1];
      nextRef?.focus();
    }
  };

  const handleSaveSecurityPin = async () => {
    if (!activePasswordType || !verifiedOtpCode) return;

    const newPin = newPinDigits.join('');
    const confirmPin = confirmPinDigits.join('');

    if (newPin.length !== 6 || !/^\d{6}$/.test(newPin)) {
      setPinError('New password must be exactly 6 numeric digits.');
      return;
    }

    if (newPin !== confirmPin) {
      setPinError('Passwords do not match. Please verify.');
      return;
    }

    setSubmittingPin(true);
    setPinError(null);
    try {
      const res = await updateSecurityPasswordWithOtp(activePasswordType, newPin, email, verifiedOtpCode);
      if (res.success) {
        toast.success(`6-digit security password configured and saved successfully!`);
        setShowPasswordSetupModal(false);
        setActivePasswordType(null);
        setVerifiedOtpCode(null);
        await loadSecurityConfigs();
      } else {
        setPinError(res.error || 'Failed to update security password.');
      }
    } catch {
      setPinError('Network error. Failed to save security password.');
    } finally {
      setSubmittingPin(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateSuperAdminProfile({
        full_name: fullName,
        preferred_theme: themeColor,
        theme_mode: themeMode
      });
      updateAdmin({ full_name: fullName });
      toast.success('Super Admin profile preferences saved');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border p-4 md:p-6 rounded-xl shadow-sm">
        <div>
          <h2 className="text-xl md:text-2xl font-heading font-bold text-foreground">
            System & Security Settings
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            Manage multi-theme visual styles, Super Admin identity, and 6-digit backend security passwords with email OTP verification.
          </p>
        </div>
      </div>

      {/* SECTION: UNIFIED 6-DIGIT SYSTEM SECURITY PIN */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-heading font-bold text-foreground flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" /> Unified 6-Digit System Security PIN
            </h3>
            <p className="text-xs text-muted-foreground">
              A single unified master PIN protecting Shopkeeper Credentials, Settlements & Payouts, and Payment Method Configurations.
            </p>
          </div>
          <Badge variant="outline" className="text-xs bg-primary/5 text-primary border-primary/20">
            6-Digit Master Security Standard
          </Badge>
        </div>

        <Card className="border border-border shadow-sm hover:border-primary/40 transition-colors">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between mb-1">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <KeyRound className="w-5 h-5" />
              </div>
              {securityConfigs.system_security_pin?.is_configured || securityConfigs.credential_view?.is_configured ? (
                <Badge className="bg-emerald-600/10 text-emerald-600 hover:bg-emerald-600/20 border-emerald-500/20 text-xs font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Master PIN Active & Protected
                </Badge>
              ) : (
                <Badge variant="outline" className="text-amber-500 border-amber-500/30 text-xs bg-amber-500/5">
                  <AlertCircle className="w-3.5 h-3.5 mr-1" /> Not Configured
                </Badge>
              )}
            </div>
            <CardTitle className="text-base font-heading font-bold">Unified Master Security PIN</CardTitle>
            <CardDescription className="text-xs">
              Synchronized security gate across all sensitive admin views. Setting or updating this PIN requires the Super Admin account sign-in password.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 bg-muted/40 rounded-lg border border-border/50">
                <span className="text-[11px] text-muted-foreground block font-medium">1. Shopkeeper Credentials</span>
                <span className="text-xs font-semibold text-foreground mt-0.5 block">Vendor Shops Directory</span>
              </div>
              <div className="p-3 bg-muted/40 rounded-lg border border-border/50">
                <span className="text-[11px] text-muted-foreground block font-medium">2. Settlements & Payouts</span>
                <span className="text-xs font-semibold text-foreground mt-0.5 block">2-Day Cycle Ledger & Disbursal</span>
              </div>
              <div className="p-3 bg-muted/40 rounded-lg border border-border/50">
                <span className="text-[11px] text-muted-foreground block font-medium">3. Payment Methods</span>
                <span className="text-xs font-semibold text-foreground mt-0.5 block">Razorpay / Counter Switches</span>
              </div>
            </div>

            <div className="bg-muted/30 p-3.5 rounded-lg border border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="text-[11px] text-muted-foreground block">Stored PIN State:</span>
                <span className="font-mono text-sm font-bold text-foreground tracking-widest">
                  {securityConfigs.system_security_pin?.is_configured || securityConfigs.credential_view?.is_configured
                    ? '•••••• (6 Digits)'
                    : 'Unset'}
                </span>
                {(securityConfigs.system_security_pin?.updated_at || securityConfigs.credential_view?.updated_at) && (
                  <p className="text-[10px] text-muted-foreground">
                    Last synced: {new Date(securityConfigs.system_security_pin?.updated_at || securityConfigs.credential_view?.updated_at || '').toLocaleDateString()}
                  </p>
                )}
              </div>
              <Button
                variant={securityConfigs.system_security_pin?.is_configured || securityConfigs.credential_view?.is_configured ? 'outline' : 'default'}
                className="text-xs h-9 font-medium gap-1.5 shrink-0"
                onClick={() => {
                  setAdminSignInPassword('');
                  setUnifiedPin('');
                  setConfirmUnifiedPin('');
                  setUnifiedPinError(null);
                  setShowUnifiedPinModal(true);
                }}
              >
                <Key className="w-3.5 h-3.5" />
                {securityConfigs.system_security_pin?.is_configured || securityConfigs.credential_view?.is_configured
                  ? 'Change Master Security PIN'
                  : 'Configure 6-Digit Master PIN'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* APPEARANCE & THEME CARD */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-heading font-bold flex items-center gap-2">
              <Palette className="w-4 h-4 text-primary" /> Visual Theme & Palette
            </CardTitle>
            <CardDescription className="text-xs">
              Toggle between White + Red and White + Blue color palettes with Dark and Light mode support
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Color Palette Switcher */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Brand Color Palette</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setThemeColor('white_red')}
                  className={`p-4 rounded-xl border text-left transition-all relative ${
                    themeColor === 'white_red'
                      ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                      : 'border-border hover:bg-muted/40'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded-full bg-rose-600" />
                    <span className="font-heading font-bold text-xs text-foreground">White + Red</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Vivid Red accent on clean white and charcoal dark backgrounds
                  </p>
                  {themeColor === 'white_red' && (
                    <div className="absolute top-3 right-3 text-primary">
                      <Check className="w-4 h-4" />
                    </div>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setThemeColor('white_blue')}
                  className={`p-4 rounded-xl border text-left transition-all relative ${
                    themeColor === 'white_blue'
                      ? 'border-blue-600 ring-2 ring-blue-600/20 bg-blue-600/5'
                      : 'border-border hover:bg-muted/40'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded-full bg-blue-600" />
                    <span className="font-heading font-bold text-xs text-foreground">White + Blue</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Deep Sapphire Blue accent with high contrast interface elements
                  </p>
                  {themeColor === 'white_blue' && (
                    <div className="absolute top-3 right-3 text-blue-600">
                      <Check className="w-4 h-4" />
                    </div>
                  )}
                </button>
              </div>
            </div>

            {/* Display Mode (Dark/Light) */}
            <div className="space-y-2 pt-2 border-t border-border/50">
              <Label className="text-xs font-semibold">Display Appearance</Label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant={themeMode === 'light' ? 'default' : 'outline'}
                  onClick={() => setThemeMode('light')}
                  className="h-10 text-xs gap-2"
                >
                  <Sun className="w-4 h-4" /> Light Mode
                </Button>
                <Button
                  type="button"
                  variant={themeMode === 'dark' ? 'default' : 'outline'}
                  onClick={() => setThemeMode('dark')}
                  className="h-10 text-xs gap-2"
                >
                  <Moon className="w-4 h-4" /> Dark Mode
                </Button>
              </div>
            </div>

            {/* Typography Info */}
            <div className="p-3 bg-muted/50 rounded-lg space-y-1 text-xs">
              <span className="text-[10px] text-muted-foreground uppercase font-semibold">Active Typography:</span>
              <p className="text-foreground">
                Headings: <strong className="font-heading">Lexend</strong> (Google Fonts)
              </p>
              <p className="text-foreground">
                Content / Body: <strong style={{ fontFamily: 'Teachers' }}>Teachers</strong> (Google Fonts)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* ACCOUNT PROFILE CARD */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-heading font-bold flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-primary" /> Super Admin Profile
            </CardTitle>
            <CardDescription className="text-xs">
              Primary authorization credentials and master contact details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Full Name</Label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Email Address</Label>
                <Input
                  disabled
                  value={email}
                  className="h-9 text-xs font-mono bg-muted"
                />
                <span className="text-[10px] text-muted-foreground">Master email used for receiving verification OTPs.</span>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Assigned Role</Label>
                <div className="flex items-center space-x-2 pt-0.5">
                  <Badge variant="outline" className="text-xs text-primary border-primary/30">
                    Master Super Administrator
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">Full Platform Permissions</span>
                </div>
              </div>

              <div className="pt-2">
                <Button type="submit" disabled={saving} className="h-9 text-xs">
                  {saving ? 'Saving...' : 'Save Profile Changes'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* UNIFIED 6-DIGIT MASTER PIN SETUP MODAL */}
      {showUnifiedPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-card border border-border shadow-2xl rounded-2xl p-6 sm:p-8 space-y-5">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner">
                <KeyRound className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-heading font-bold text-foreground">
                Set Master 6-Digit Security PIN
              </h3>
              <p className="text-xs text-muted-foreground">
                Enter your Super Admin sign-in password to verify identity, then configure the synchronized master PIN.
              </p>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Super Admin Sign-In Password *</Label>
                <Input
                  type="password"
                  placeholder="Enter admin password (e.g. admin123)"
                  value={adminSignInPassword}
                  onChange={(e) => {
                    setAdminSignInPassword(e.target.value);
                    setUnifiedPinError(null);
                  }}
                  className="h-9 text-xs"
                />
                <span className="text-[10px] text-muted-foreground">Required to authorize setting or changing the security PIN.</span>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">New 6-Digit Security PIN *</Label>
                <Input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="Enter 6-digit numeric PIN"
                  value={unifiedPin}
                  onChange={(e) => {
                    setUnifiedPin(e.target.value.replace(/\D/g, '').slice(0, 6));
                    setUnifiedPinError(null);
                  }}
                  className="h-9 text-center font-mono font-bold tracking-widest text-base"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Confirm 6-Digit Security PIN *</Label>
                <Input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="Re-enter 6-digit numeric PIN"
                  value={confirmUnifiedPin}
                  onChange={(e) => {
                    setConfirmUnifiedPin(e.target.value.replace(/\D/g, '').slice(0, 6));
                    setUnifiedPinError(null);
                  }}
                  className="h-9 text-center font-mono font-bold tracking-widest text-base"
                />
              </div>

              {unifiedPinError && (
                <div className="p-2.5 bg-destructive/10 border border-destructive/20 rounded-lg text-xs text-destructive text-center font-medium">
                  {unifiedPinError}
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 h-9 text-xs"
                  onClick={() => setShowUnifiedPinModal(false)}
                  disabled={submittingUnifiedPin}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="flex-1 h-9 text-xs"
                  onClick={handleSaveUnifiedPin}
                  disabled={submittingUnifiedPin || !adminSignInPassword || unifiedPin.length !== 6 || confirmUnifiedPin.length !== 6}
                >
                  {submittingUnifiedPin ? 'Saving & Syncing...' : 'Save Unified PIN'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUPER ADMIN EMAIL OTP MODAL */}
      {activePasswordType && (
        <OtpVerificationModal
          isOpen={otpModalOpen}
          email={email}
          purpose={`security_password_${activePasswordType}`}
          title="Verify Super Admin Identity"
          description={`To modify the ${passwordCardConfigs.find(c => c.type === activePasswordType)?.title} password, enter the 6-digit confirmation code dispatched to ${email}.`}
          onClose={() => {
            setOtpModalOpen(false);
            setActivePasswordType(null);
          }}
          onVerified={handleOtpVerified}
        />
      )}

      {/* 6-DIGIT NEW PASSWORD SETUP MODAL */}
      {showPasswordSetupModal && activePasswordType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-card border border-border shadow-2xl rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner">
                <KeyRound className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-heading font-bold text-foreground">
                Set 6-Digit Password
              </h3>
              <p className="text-xs text-muted-foreground">
                Configuring: <strong>{passwordCardConfigs.find(c => c.type === activePasswordType)?.title}</strong>
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Enter 6-Digit Numeric PIN</Label>
                <div className="flex justify-center items-center gap-2">
                  {newPinDigits.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => {
                        newPinRefs.current[i] = el;
                      }}
                      type="password"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handlePinDigitChange(i, e.target.value, false)}
                      className="w-10 h-12 text-center text-xl font-bold font-mono bg-muted/40 border-2 border-border focus:border-primary focus:bg-background rounded-lg outline-none transition-all"
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold">Confirm 6-Digit Numeric PIN</Label>
                <div className="flex justify-center items-center gap-2">
                  {confirmPinDigits.map((digit, i) => (
                    <input
                      key={i}
                      type="password"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handlePinDigitChange(i, e.target.value, true)}
                      className="w-10 h-12 text-center text-xl font-bold font-mono bg-muted/40 border-2 border-border focus:border-primary focus:bg-background rounded-lg outline-none transition-all"
                    />
                  ))}
                </div>
              </div>

              {pinError && (
                <div className="p-2.5 bg-destructive/10 border border-destructive/20 rounded-lg text-xs text-destructive text-center font-medium">
                  {pinError}
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowPasswordSetupModal(false)}
                  disabled={submittingPin}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="flex-1"
                  onClick={handleSaveSecurityPin}
                  disabled={
                    submittingPin ||
                    newPinDigits.join('').length !== 6 ||
                    confirmPinDigits.join('').length !== 6
                  }
                >
                  {submittingPin ? 'Saving...' : 'Save & Protect'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

