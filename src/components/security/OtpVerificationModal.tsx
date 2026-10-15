import React, { useState, useRef, useEffect } from 'react';
import { Mail, Clock, RefreshCw, AlertCircle, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { requestAdminEmailOtp, verifyAdminEmailOtp } from '@/services/api';
import { toast } from 'sonner';

interface OtpVerificationModalProps {
  email: string;
  purpose: string;
  title?: string;
  description?: string;
  isOpen: boolean;
  onClose: () => void;
  onVerified: (otpCode: string) => void;
}

export const OtpVerificationModal: React.FC<OtpVerificationModalProps> = ({
  email,
  purpose,
  title = 'Super Admin Email Verification',
  description,
  isOpen,
  onClose,
  onVerified
}) => {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(600); // 10 mins
  const [resendCooldown, setResendCooldown] = useState(60);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Send initial OTP upon open
  useEffect(() => {
    if (isOpen) {
      setDigits(['', '', '', '', '', '']);
      setErrorMsg(null);
      setTimeLeft(600);
      setResendCooldown(60);
      sendOtp();
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 200);
    }
  }, [isOpen]);

  // Timers
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  const sendOtp = async () => {
    setRequesting(true);
    try {
      const res = await requestAdminEmailOtp(email, purpose);
      toast.success(res.message);
      if (res.otpCodePreview) {
        toast.info(`[Admin Preview] Verification OTP: ${res.otpCodePreview}`, { duration: 15000 });
      }
      setResendCooldown(60);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to dispatch verification email');
    } finally {
      setRequesting(false);
    }
  };

  if (!isOpen) return null;

  const handleChange = (index: number, val: string) => {
    const clean = val.replace(/\D/g, '');
    if (!clean) {
      const next = [...digits];
      next[index] = '';
      setDigits(next);
      return;
    }

    if (clean.length > 1) {
      const paste = clean.slice(0, 6).split('');
      const next = [...digits];
      paste.forEach((d, i) => {
        if (i < 6) next[i] = d;
      });
      setDigits(next);
      if (paste.length === 6) {
        verify(next.join(''));
      }
      return;
    }

    const next = [...digits];
    next[index] = clean[clean.length - 1];
    setDigits(next);
    setErrorMsg(null);

    if (index < 5 && clean) {
      inputRefs.current[index + 1]?.focus();
    }

    if (index === 5 && clean) {
      next[5] = clean[clean.length - 1];
      const pin = next.join('');
      if (pin.length === 6) {
        verify(pin);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const verify = async (code: string) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await verifyAdminEmailOtp(email, code, purpose);
      if (res.valid) {
        toast.success('Email identity confirmed successfully');
        onVerified(code);
      } else {
        setErrorMsg(res.error || 'Invalid verification code');
        setDigits(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch {
      setErrorMsg('Failed to verify OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-md bg-card border border-border shadow-2xl rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner">
            <Mail className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-heading font-bold text-foreground">{title}</h3>
          <p className="text-xs text-muted-foreground max-w-xs">
            {description || `A 6-digit confirmation code was sent to ${email}.`}
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            verify(digits.join(''));
          }}
          className="space-y-6"
        >
          {/* 6 Digit Input Boxes */}
          <div className="flex justify-center items-center gap-2 sm:gap-3">
            {digits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => {
                  inputRefs.current[idx] = el;
                }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={2}
                value={digit}
                onChange={(e) => handleChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                disabled={loading}
                className="w-11 h-13 sm:w-12 sm:h-14 text-center text-2xl font-bold font-mono bg-muted/40 border-2 border-border focus:border-primary focus:bg-background rounded-xl outline-none transition-all shadow-sm"
              />
            ))}
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
            <span className="flex items-center gap-1 font-mono">
              <Clock className="w-3.5 h-3.5" />
              Expires in {formatTimer(timeLeft)}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={resendCooldown > 0 || requesting}
              onClick={sendOtp}
              className="text-xs h-7 text-primary hover:text-primary/80"
            >
              <RefreshCw className={`w-3 h-3 mr-1 ${requesting ? 'animate-spin' : ''}`} />
              {resendCooldown > 0 ? `Resend (${resendCooldown}s)` : 'Resend Code'}
            </Button>
          </div>

          {errorMsg && (
            <div className="flex items-center space-x-2 text-destructive text-xs bg-destructive/10 border border-destructive/20 p-2.5 rounded-lg justify-center font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={loading || digits.join('').length !== 6}
            >
              {loading ? 'Verifying OTP...' : 'Confirm OTP'}
            </Button>
          </div>
        </form>

        <div className="pt-2 border-t border-border/50 text-center">
          <p className="text-[11px] text-muted-foreground flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-primary" />
            Maximum 5 attempts per code for security compliance
          </p>
        </div>
      </div>
    </div>
  );
};
