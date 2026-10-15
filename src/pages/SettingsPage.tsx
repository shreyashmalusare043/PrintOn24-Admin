import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import {
  updateSuperAdminProfile,
  fetchSecurityPasswordConfigs,
  updateSecurityPasswordWithOtp
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
  const [securityConfigs, setSecurityConfigs] = useState<Record<SecurityPasswordType, SecurityPasswordConfig | null>>({
    credential_view: null,
    settlement_payout: null,
    payment_methods: null
  });
  const [loadingConfigs, setLoadingConfigs] = useState(true);

  // OTP & Password Update Modal State
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
      const map: Record<SecurityPasswordType, SecurityPasswordConfig | null> = {
        credential_view: null,
        settlement_payout: null,
        payment_methods: null
      };
      list.forEach((item) => {
        const pType = item.password_type as SecurityPasswordType;
        if (pType in map) {
          map[pType] = item;
        }
      });
      setSecurityConfigs(map);
    } catch {
      toast.error('Failed to load security configurations');
    } finally {
      setLoadingConfigs(false);
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

      {/* SECTION: 3 DEDICATED SECURITY PASSWORD CARDS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-heading font-bold text-foreground flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" /> Security Passwords & Access Protection
            </h3>
            <p className="text-xs text-muted-foreground">
              Three dedicated 6-digit passwords. All changes and views require verification via Super Admin email OTP.
            </p>
          </div>
          <Badge variant="outline" className="text-xs bg-primary/5 text-primary border-primary/20">
            6-Digit Numeric Standards
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {passwordCardConfigs.map((cfg) => {
            const Icon = cfg.icon;
            const config = securityConfigs[cfg.type];
            const isSet = config?.is_configured;

            return (
              <Card key={cfg.type} className="flex flex-col border border-border shadow-sm hover:border-primary/40 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    {isSet ? (
                      <Badge className="bg-emerald-600/10 text-emerald-600 hover:bg-emerald-600/20 border-emerald-500/20 text-[10px] font-semibold">
                        <ShieldCheck className="w-3 h-3 mr-1" /> Configured
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-amber-500 border-amber-500/30 text-[10px] bg-amber-500/5">
                        <AlertCircle className="w-3 h-3 mr-1" /> Not Configured
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-sm font-heading font-bold">{cfg.title}</CardTitle>
                  <CardDescription className="text-xs min-h-[36px]">{cfg.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 flex-1">
                  <div className="bg-muted/40 p-3 rounded-lg border border-border/50 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>Stored State:</span>
                      <span className="font-mono">{isSet ? 'Masked (6 Digits)' : 'Unset'}</span>
                    </div>
                    <div className="flex items-center justify-between font-mono text-xs font-bold text-foreground">
                      <span>Password:</span>
                      <span className="tracking-widest text-primary text-sm">{isSet ? '••••••' : 'None'}</span>
                    </div>
                    {config?.updated_at && (
                      <p className="text-[10px] text-muted-foreground pt-1 border-t border-border/40">
                        Updated: {new Date(config.updated_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="pt-2">
                  <Button
                    variant={isSet ? 'outline' : 'default'}
                    className="w-full text-xs h-9 font-medium"
                    onClick={() => handleStartPasswordUpdate(cfg.type)}
                  >
                    <Key className="w-3.5 h-3.5 mr-1.5" />
                    {isSet ? 'Update with Email OTP' : 'Configure 6-Digit Password'}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
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

