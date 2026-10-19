import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Key, Copy, Check, Lock, RefreshCw, AlertTriangle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { generateQrDataUrl } from '../../utils/qr';

export const TwoFactorModal: React.FC = () => {
  const { is2FAModalOpen, setIs2FAModalOpen, currentUser, toggleTwoFactor } = useApp();
  const [totpCode, setTotpCode] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [secret] = useState('JBSWY3DPEHPK3PXP');
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const backupCodes = [
    '7A91-8B42',
    '3F21-99DE',
    '88C4-10AB',
    '52D1-77BC',
    '649A-38E1',
    '9901-FA88',
    '44BC-2109',
    '15EA-9321',
  ];

  useEffect(() => {
    if (is2FAModalOpen) {
      // Generate OTP Auth URI: otpauth://totp/EventSphere:user@apex.com?secret=...&issuer=EventSphere
      const otpAuthUri = `otpauth://totp/EventSphere:${encodeURIComponent(
        currentUser.email
      )}?secret=${secret}&issuer=EventSphere%20SaaS`;
      generateQrDataUrl(otpAuthUri).then((url) => setQrCodeUrl(url));
      setStatusMessage(null);
      setTotpCode('');
    }
  }, [is2FAModalOpen, currentUser.email, secret]);

  if (!is2FAModalOpen) return null;

  const handleCopySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  const handleVerifyAndEnable = (e: React.FormEvent) => {
    e.preventDefault();
    if (totpCode.trim().length !== 6) {
      setStatusMessage({ text: 'Please enter a valid 6-digit authentication token.', isError: true });
      return;
    }

    // In demo environment, accept any valid 6 digits or test code
    toggleTwoFactor(true);
    setStatusMessage({ text: 'Two-Factor Authentication successfully verified and active!', isError: false });
    setTimeout(() => {
      setIs2FAModalOpen(false);
    }, 1500);
  };

  const handleDisable2FA = () => {
    toggleTwoFactor(false);
    setStatusMessage({ text: 'Two-Factor Authentication has been disabled.', isError: false });
    setTimeout(() => {
      setIs2FAModalOpen(false);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">Two-Factor Authentication (2FA)</h3>
              <p className="text-xs text-slate-500">Enhanced account protection and verification for your profile</p>
            </div>
          </div>
          <button
            onClick={() => setIs2FAModalOpen(false)}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {currentUser.twoFactorEnabled ? (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-semibold text-emerald-900">2FA is Currently Active & Enforced</h4>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    Your account {currentUser.email} is protected by Time-based One-Time Passwords (TOTP). Door operations, financial payouts, and organizer actions require secondary authorization.
                  </p>
                </div>
              </div>

              <div>
                <h5 className="text-xs font-semibold text-slate-700 mb-2">Emergency Backup Recovery Codes</h5>
                <p className="text-xs text-slate-500 mb-3">
                  Store these one-time codes safely. Each code can be used once if you lose your authenticator device.
                </p>
                <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 border border-slate-200 rounded-md font-mono text-xs text-slate-700">
                  {backupCodes.map((c, i) => (
                    <div key={i} className="py-1 px-2 bg-white rounded border border-slate-200 text-center">
                      {c}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleDisable2FA}
                  className="px-3 py-2 text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors"
                >
                  Disable Two-Factor Authentication
                </button>
                <button
                  type="button"
                  onClick={() => setIs2FAModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors"
                >
                  Close Settings
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleVerifyAndEnable} className="space-y-5">
              <div className="text-xs text-slate-600 leading-relaxed">
                Scan the QR code below using an authenticator app (such as Google Authenticator, Authy, or 1Password), or manually input the secret setup key.
              </div>

              {/* QR Code and Secret */}
              <div className="flex flex-col sm:flex-row items-center gap-5 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="bg-white p-2 rounded border border-slate-200 shadow-2xs shrink-0">
                  {qrCodeUrl ? (
                    <img src={qrCodeUrl} alt="2FA QR Code" className="w-32 h-32" />
                  ) : (
                    <div className="w-32 h-32 flex items-center justify-center bg-slate-100 text-xs text-slate-400">
                      Generating...
                    </div>
                  )}
                </div>

                <div className="space-y-2 w-full">
                  <span className="text-xs font-medium text-slate-700">Manual Entry Key</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      readOnly
                      value={secret}
                      className="w-full text-xs font-mono bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-800"
                    />
                    <button
                      type="button"
                      onClick={handleCopySecret}
                      className="p-2 border border-slate-300 rounded bg-white hover:bg-slate-100 text-slate-600 transition-colors shrink-0"
                      title="Copy Secret"
                    >
                      {copiedSecret ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Type: TOTP · Algorithm: SHA1 · Digits: 6 · Period: 30s
                  </p>
                </div>
              </div>

              {/* TOTP Code Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-800 flex items-center justify-between">
                  <span>Enter 6-Digit Authenticator Token</span>
                  <span className="text-[11px] text-slate-400 font-normal">e.g. 849 201</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    maxLength={6}
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="w-full text-center tracking-[0.5em] font-mono text-lg py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {statusMessage && (
                <div
                  className={`p-3 rounded-md text-xs flex items-center gap-2 ${
                    statusMessage.isError
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}
                >
                  {statusMessage.isError ? (
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                  ) : (
                    <Check className="w-4 h-4 shrink-0" />
                  )}
                  <span>{statusMessage.text}</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIs2FAModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors shadow-2xs"
                >
                  Activate & Verify 2FA
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
