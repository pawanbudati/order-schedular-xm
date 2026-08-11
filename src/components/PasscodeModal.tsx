import React, { useState } from 'react';
import { ShieldCheck, Lock, ArrowRight, Eye, AlertCircle, UserCheck } from 'lucide-react';

interface PasscodeModalProps {
  isAuthenticated: boolean;
  onAuthenticateAdmin: (pin: string) => Promise<{ success: boolean; message: string }>;
  onGuestAccess: () => void;
}

export const PasscodeModal: React.FC<PasscodeModalProps> = ({
  isAuthenticated,
  onAuthenticateAdmin,
  onGuestAccess,
}) => {
  const [pin, setPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);

  if (isAuthenticated) return null;

  const handleKeyPress = (num: string) => {
    if (pin.length < 6) {
      const nextPin = pin + num;
      setPin(nextPin);
      setErrorMsg('');
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setErrorMsg('');
  };

  const handleClear = () => {
    setPin('');
    setErrorMsg('');
  };

  const handleSubmitAdmin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pin) {
      setErrorMsg('Please enter Admin PIN or Password');
      return;
    }

    setIsAuthenticating(true);
    setErrorMsg('');
    try {
      const res = await onAuthenticateAdmin(pin);
      if (!res.success) {
        setErrorMsg(res.message || 'Incorrect Admin PIN or Password');
        setIsShaking(true);
        setPin('');
        setTimeout(() => setIsShaking(false), 500);
      }
    } catch {
      setErrorMsg('Error verifying passcode with server');
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 dark:bg-slate-950/90 light:bg-slate-900/80 backdrop-blur-xl animate-fadeIn">
      <div
        className={`w-full max-w-sm glass-panel p-6 sm:p-7 rounded-3xl border border-slate-800 dark:border-slate-800 light:border-slate-300 shadow-2xl flex flex-col items-center gap-4 text-center ${
          isShaking ? 'animate-shake' : ''
        }`}
      >
        {/* Brand Icon Badge */}
        <div className="relative">
          <div className="w-14 h-14 sm:w-15 sm:h-15 rounded-2xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
            <Lock className="w-7 h-7 text-white stroke-[2.2]" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-slate-950 flex items-center justify-center">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-950 stroke-[3]" />
          </div>
        </div>

        {/* Title & Context */}
        <div className="space-y-1">
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-100 dark:text-slate-100 light:text-slate-900 tracking-tight">
            XM360 Order Terminal
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-500 font-medium">
            Select access mode to continue
          </p>
        </div>

        {/* PIN Dots Indicator */}
        <form onSubmit={handleSubmitAdmin} className="w-full space-y-3.5">
          <div className="flex justify-center items-center gap-3 py-1">
            {[0, 1, 2, 3].map((idx) => (
              <div
                key={idx}
                className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-200 ${
                  pin.length > idx
                    ? 'bg-cyan-400 border-cyan-400 shadow-md shadow-cyan-500/50 scale-110'
                    : 'border-slate-700 dark:border-slate-700 light:border-slate-300 bg-slate-900/50 dark:bg-slate-900/50 light:bg-slate-100'
                }`}
              />
            ))}
          </div>

          {/* Hidden Keyboard Input Support */}
          <input
            type="password"
            maxLength={6}
            value={pin}
            onChange={(e) => {
              setPin(e.target.value);
              setErrorMsg('');
            }}
            placeholder="Enter Admin PIN"
            className="w-full bg-slate-900/90 dark:bg-slate-900/90 light:bg-slate-100 border border-slate-800 dark:border-slate-800 light:border-slate-300 rounded-xl px-4 py-2 text-center text-base font-mono font-bold tracking-[0.4em] text-cyan-400 focus:outline-none focus:border-cyan-500"
          />

          {errorMsg && (
            <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center justify-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* On-screen Keypad */}
          <div className="grid grid-cols-3 gap-1.5 pt-0.5">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleKeyPress(num)}
                className="py-2.5 rounded-xl bg-slate-900/80 dark:bg-slate-900/80 light:bg-white hover:bg-slate-800 dark:hover:bg-slate-800 light:hover:bg-slate-100 text-slate-100 dark:text-slate-100 light:text-slate-900 font-mono text-base font-bold border border-slate-800/80 dark:border-slate-800/80 light:border-slate-200 transition-all active:scale-95 shadow-sm"
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={handleClear}
              className="py-2.5 rounded-xl bg-slate-900/40 dark:bg-slate-900/40 light:bg-slate-100 hover:bg-slate-800/60 text-slate-400 dark:text-slate-400 light:text-slate-600 font-sans text-xs font-bold border border-slate-800/50 transition-all active:scale-95"
            >
              CLR
            </button>
            <button
              type="button"
              onClick={() => handleKeyPress('0')}
              className="py-2.5 rounded-xl bg-slate-900/80 dark:bg-slate-900/80 light:bg-white hover:bg-slate-800 dark:hover:bg-slate-800 light:hover:bg-slate-100 text-slate-100 dark:text-slate-100 light:text-slate-900 font-mono text-base font-bold border border-slate-800/80 dark:border-slate-800/80 light:border-slate-200 transition-all active:scale-95 shadow-sm"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleBackspace}
              className="py-2.5 rounded-xl bg-slate-900/40 dark:bg-slate-900/40 light:bg-slate-100 hover:bg-slate-800/60 text-slate-400 dark:text-slate-400 light:text-slate-600 font-sans text-xs font-bold border border-slate-800/50 transition-all active:scale-95"
            >
              ⌫
            </button>
          </div>

          {/* Admin Submit Button */}
          <button
            type="submit"
            disabled={isAuthenticating}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-xs sm:text-sm transition-all shadow-lg shadow-cyan-500/20 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <UserCheck className={`w-4 h-4 ${isAuthenticating ? 'animate-spin' : ''}`} />
            <span>{isAuthenticating ? 'Verifying...' : 'Unlock Admin Mode (Live Orders)'}</span>
          </button>
        </form>

        {/* Divider */}
        <div className="relative w-full my-1 flex items-center justify-center">
          <div className="w-full border-t border-slate-800/80 dark:border-slate-800/80 light:border-slate-300" />
          <span className="absolute bg-slate-900 dark:bg-slate-900 light:bg-slate-100 px-2 text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
            OR
          </span>
        </div>

        {/* Guest Demo Mode Button */}
        <button
          type="button"
          onClick={onGuestAccess}
          className="w-full py-2.5 rounded-xl bg-slate-900/90 dark:bg-slate-900/90 light:bg-slate-100 hover:bg-amber-500/20 text-amber-400 dark:text-amber-400 light:text-amber-700 border border-amber-500/30 font-bold text-xs transition-all active:scale-95 flex items-center justify-center gap-2 shadow-sm"
        >
          <Eye className="w-4 h-4" />
          <span>Continue as Guest (Demo Sandbox)</span>
        </button>
      </div>
    </div>
  );
};
