import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, KeyRound, ArrowRight, Zap, AlertCircle } from 'lucide-react';

interface PasscodeModalProps {
  isAuthenticated: boolean;
  onAuthenticate: (pin: string) => boolean;
}

export const PasscodeModal: React.FC<PasscodeModalProps> = ({ isAuthenticated, onAuthenticate }) => {
  const [pin, setPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isShaking, setIsShaking] = useState<boolean>(false);

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

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pin) {
      setErrorMsg('Please enter your passcode');
      return;
    }

    const success = onAuthenticate(pin);
    if (!success) {
      setErrorMsg('Incorrect passcode. Default PIN is 1234');
      setIsShaking(true);
      setPin('');
      setTimeout(() => setIsShaking(false), 500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 dark:bg-slate-950/90 light:bg-slate-900/80 backdrop-blur-xl animate-fadeIn">
      <div
        className={`w-full max-w-sm glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 dark:border-slate-800 light:border-slate-300 shadow-2xl flex flex-col items-center gap-5 text-center ${
          isShaking ? 'animate-shake' : ''
        }`}
      >
        {/* Brand Icon Badge */}
        <div className="relative">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
            <Lock className="w-7 h-7 sm:w-8 sm:h-8 text-white stroke-[2.2]" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-slate-950 flex items-center justify-center">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-950 stroke-[3]" />
          </div>
        </div>

        {/* Title & Context */}
        <div className="space-y-1">
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-100 dark:text-slate-100 light:text-slate-900 tracking-tight">
            XM360 Terminal Lock
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-500 font-medium">
            Enter security PIN to access live order scheduler
          </p>
        </div>

        {/* PIN Dots Indicator */}
        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div className="flex justify-center items-center gap-3 py-2">
            {[0, 1, 2, 3].map((idx) => (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
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
            placeholder="PIN"
            className="w-full bg-slate-900/90 dark:bg-slate-900/90 light:bg-slate-100 border border-slate-800 dark:border-slate-800 light:border-slate-300 rounded-xl px-4 py-2.5 text-center text-lg font-mono font-bold tracking-[0.5em] text-cyan-400 focus:outline-none focus:border-cyan-500"
            autoFocus
          />

          {errorMsg && (
            <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center justify-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* On-screen Keypad */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleKeyPress(num)}
                className="py-3 rounded-2xl bg-slate-900/80 dark:bg-slate-900/80 light:bg-white hover:bg-slate-800 dark:hover:bg-slate-800 light:hover:bg-slate-100 text-slate-100 dark:text-slate-100 light:text-slate-900 font-mono text-lg font-bold border border-slate-800/80 dark:border-slate-800/80 light:border-slate-200 transition-all active:scale-95 shadow-sm"
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={handleClear}
              className="py-3 rounded-2xl bg-slate-900/40 dark:bg-slate-900/40 light:bg-slate-100 hover:bg-slate-800/60 text-slate-400 dark:text-slate-400 light:text-slate-600 font-sans text-xs font-bold border border-slate-800/50 transition-all active:scale-95"
            >
              CLR
            </button>
            <button
              type="button"
              onClick={() => handleKeyPress('0')}
              className="py-3 rounded-2xl bg-slate-900/80 dark:bg-slate-900/80 light:bg-white hover:bg-slate-800 dark:hover:bg-slate-800 light:hover:bg-slate-100 text-slate-100 dark:text-slate-100 light:text-slate-900 font-mono text-lg font-bold border border-slate-800/80 dark:border-slate-800/80 light:border-slate-200 transition-all active:scale-95 shadow-sm"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleBackspace}
              className="py-3 rounded-2xl bg-slate-900/40 dark:bg-slate-900/40 light:bg-slate-100 hover:bg-slate-800/60 text-slate-400 dark:text-slate-400 light:text-slate-600 font-sans text-xs font-bold border border-slate-800/50 transition-all active:scale-95"
            >
              ⌫
            </button>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-sm transition-all shadow-lg shadow-cyan-500/20 active:scale-95 flex items-center justify-center gap-2"
          >
            <span>Unlock Terminal</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
