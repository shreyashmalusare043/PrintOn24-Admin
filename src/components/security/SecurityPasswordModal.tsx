import React, { useState, useRef, useEffect } from 'react';
import { Shield, Lock, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SecurityPasswordType } from '@/types/types';
import { verifySecurityPassword } from '@/services/api';
import { toast } from 'sonner';

interface SecurityPasswordModalProps {
  type: SecurityPasswordType;
  title?: string;
  description?: string;
  isOpen: boolean;
  onClose?: () => void;
  onSuccess: () => void;
}

const typeLabels: Record<SecurityPasswordType, string> = {
  credential_view: 'Shopkeeper Credential View Password',
  settlement_payout: 'Settlement & Payout Security Password',
  payment_methods: 'Payment Methods Configuration Password',
  system_security_pin: 'Unified System Security PIN'
};

export const SecurityPasswordModal: React.FC<SecurityPasswordModalProps> = ({
  type,
  title,
  description,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (isOpen) {
      setDigits(['', '', '', '', '', '']);
      setErrorMsg(null);
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (index: number, val: string) => {
    // Only accept numeric
    const cleanVal = val.replace(/\D/g, '');
    if (!cleanVal) {
      const nextDigits = [...digits];
      nextDigits[index] = '';
      setDigits(nextDigits);
      return;
    }

    // Support pasting multi-digit pin
    if (cleanVal.length > 1) {
      const pasteDigits = cleanVal.slice(0, 6).split('');
      const nextDigits = [...digits];
      pasteDigits.forEach((d, i) => {
        if (i < 6) nextDigits[i] = d;
      });
      setDigits(nextDigits);
      const nextIndex = Math.min(pasteDigits.length, 5);
      inputRefs.current[nextIndex]?.focus();
      if (pasteDigits.length === 6) {
        verifyPin(nextDigits.join(''));
      }
      return;
    }

    const nextDigits = [...digits];
    nextDigits[index] = cleanVal[cleanVal.length - 1];
    setDigits(nextDigits);
    setErrorMsg(null);

    // Auto advance
    if (index < 5 && cleanVal) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto submit if 6th digit entered
    if (index === 5 && cleanVal) {
      nextDigits[5] = cleanVal[cleanVal.length - 1];
      const fullPin = nextDigits.join('');
      if (fullPin.length === 6) {
        verifyPin(fullPin);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const verifyPin = async (pin: string) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const isValid = await verifySecurityPassword(type, pin);
      if (isValid) {
        toast.success('Access verified successfully');
        onSuccess();
      } else {
        setErrorMsg('Incorrect 6-digit security password. Access denied.');
        setDigits(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch {
      setErrorMsg('Failed to verify password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pin = digits.join('');
    if (pin.length !== 6) {
      setErrorMsg('Please enter all 6 numeric digits');
      return;
    }
    verifyPin(pin);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-md bg-card border border-border shadow-2xl rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner">
            <Lock className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-heading font-bold text-foreground">
            {title || 'Security Verification Required'}
          </h3>
          <p className="text-xs text-muted-foreground max-w-xs">
            {description || `Please enter the 6-digit ${typeLabels[type]} to proceed.`}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 6 Digit Input Boxes */}
          <div className="flex justify-center items-center gap-2 sm:gap-3">
            {digits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => {
                  inputRefs.current[idx] = el;
                }}
                type="password"
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

          {errorMsg && (
            <div className="flex items-center space-x-2 text-destructive text-xs bg-destructive/10 border border-destructive/20 p-2.5 rounded-lg justify-center">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex items-center gap-3">
            {onClose && (
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              className="flex-1"
              disabled={loading || digits.join('').length !== 6}
            >
              {loading ? 'Verifying...' : 'Unlock Access'}
            </Button>
          </div>
        </form>

        <div className="pt-2 border-t border-border/50 text-center">
          <p className="text-[11px] text-muted-foreground flex items-center justify-center gap-1">
            <Shield className="w-3.5 h-3.5 text-primary" />
            Configured in System Settings with Super Admin email OTP
          </p>
        </div>
      </div>
    </div>
  );
};
