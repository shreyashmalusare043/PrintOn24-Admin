import React, { useState, useEffect } from 'react';
import { Lock, ShieldCheck, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SecurityPasswordType } from '@/types/types';
import { checkIsPasswordConfigured, verifySecurityPassword } from '@/services/api';
import { toast } from 'sonner';

interface ProtectedPageWrapperProps {
  type: SecurityPasswordType;
  pageTitle: string;
  description?: string;
  children: React.ReactNode;
}

export const ProtectedPageWrapper: React.FC<ProtectedPageWrapperProps> = ({
  type,
  pageTitle,
  description,
  children
}) => {
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinDigits, setPinDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Check if session already unlocked for this type
    const sessionKey = `unlocked_${type}`;
    if (sessionStorage.getItem(sessionKey) === 'true') {
      setIsUnlocked(true);
      setIsConfigured(true);
      return;
    }

    checkIsPasswordConfigured(type)
      .then((configured) => {
        setIsConfigured(configured);
        if (!configured) {
          setIsUnlocked(true); // If no password configured, allow direct normal access
        }
      })
      .catch(() => {
        setIsConfigured(false);
        setIsUnlocked(true);
      });
  }, [type]);

  const handleDigitChange = (index: number, val: string) => {
    const cleanVal = val.replace(/\D/g, '');
    if (!cleanVal) {
      const nextDigits = [...pinDigits];
      nextDigits[index] = '';
      setPinDigits(nextDigits);
      return;
    }

    if (cleanVal.length > 1) {
      const paste = cleanVal.slice(0, 6).split('');
      const nextDigits = [...pinDigits];
      paste.forEach((d, i) => {
        if (i < 6) nextDigits[i] = d;
      });
      setPinDigits(nextDigits);
      if (paste.length === 6) {
        verify(nextDigits.join(''));
      }
      return;
    }

    const nextDigits = [...pinDigits];
    nextDigits[index] = cleanVal[cleanVal.length - 1];
    setPinDigits(nextDigits);
    setErrorMsg(null);

    if (index < 5 && cleanVal) {
      inputRefs.current[index + 1]?.focus();
    }

    if (index === 5 && cleanVal) {
      nextDigits[5] = cleanVal[cleanVal.length - 1];
      const pin = nextDigits.join('');
      if (pin.length === 6) {
        verify(pin);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pinDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const verify = async (pin: string) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const valid = await verifySecurityPassword(type, pin);
      if (valid) {
        sessionStorage.setItem(`unlocked_${type}`, 'true');
        setIsUnlocked(true);
        toast.success(`${pageTitle} unlocked successfully`);
      } else {
        setErrorMsg('Incorrect 6-digit security password. Please try again.');
        setPinDigits(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch {
      setErrorMsg('Verification failed. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  // If still checking configuration
  if (isConfigured === null) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // If unlocked or no password configured, render normal page
  if (isUnlocked || !isConfigured) {
    return <>{children}</>;
  }

  // Blurred page with centered password popup
  return (
    <div className="relative min-h-[600px] w-full">
      {/* Blurred background view of the real page content */}
      <div className="filter blur-md opacity-40 pointer-events-none select-none transition-all duration-300">
        {children}
      </div>

      {/* Centered Security Password Verification Popup */}
      <div className="absolute inset-0 flex items-center justify-center p-4 z-30">
        <div className="w-full max-w-md bg-card/95 backdrop-blur-xl border border-border shadow-2xl rounded-2xl p-6 sm:p-8 space-y-6 animate-in zoom-in-95">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner">
              <Lock className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-heading font-bold text-foreground">
              {pageTitle} is Protected
            </h2>
            <p className="text-xs text-muted-foreground">
              {description || `Enter the configured 6-digit security password to unlock this module.`}
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              verify(pinDigits.join(''));
            }}
            className="space-y-6"
          >
            <div className="flex justify-center items-center gap-2 sm:gap-3">
              {pinDigits.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    inputRefs.current[i] = el;
                  }}
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={2}
                  value={d}
                  onChange={(e) => handleDigitChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  disabled={loading}
                  className="w-11 h-13 sm:w-12 sm:h-14 text-center text-2xl font-bold font-mono bg-muted/50 border-2 border-border focus:border-primary focus:bg-background rounded-xl outline-none transition-all shadow-sm"
                />
              ))}
            </div>

            {errorMsg && (
              <p className="text-xs text-destructive text-center bg-destructive/10 p-2 rounded-lg border border-destructive/20 font-medium">
                {errorMsg}
              </p>
            )}

            <Button
              type="submit"
              className="w-full h-11 text-sm font-semibold"
              disabled={loading || pinDigits.join('').length !== 6}
            >
              {loading ? 'Verifying PIN...' : 'Verify & Unlock Page'}
            </Button>
          </form>

          <div className="pt-2 border-t border-border text-center text-[11px] text-muted-foreground flex items-center justify-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5 text-primary" />
            Protected by PrintOn24 Security Password System
          </div>
        </div>
      </div>
    </div>
  );
};
