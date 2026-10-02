import React, { useEffect, useMemo, useState } from 'react';
import { X, Sparkles, CheckCircle, Shield, WifiOff, Clock, ExternalLink, RefreshCw, LogOut, KeyRound, Copy, Lock } from 'lucide-react';
import { formatRemainingHours } from '../utils/license';
import { useTheme } from '../utils/ThemeContext';
import { useLanguage } from '../utils/LanguageContext';
import { PASS_HOURS, PASS_MAX_DEVICES } from '../config/pass';
import { PAYMENTS_ENABLED } from '../config/payments';
import { fetchPricing, PricingInfo, redeemCode, startCheckout, PaymentErrorCode } from '../utils/payments';
import { SPEECH_LOCALE } from '../i18n/languages';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  siteName: string;
  siteId: string;
  /** Precios de la ficha del sitio. Se muestran solo si el servidor de pagos no responde. */
  passPriceMxn: number;
  passPriceUsd: number;
  hasPass: boolean;
  passExpiresAt?: number;
  /** Código del pase activo (para el segundo dispositivo). */
  passCode?: string;
  /** Se llama cuando el pase cambió (por ejemplo, se activó con un código) para releerlo. */
  onPassChanged: () => void;
  /** Pase de prueba (solo con ?debug=1 y sin pagos reales, o en desarrollo). */
  onSimulatePurchase: () => void;
  onRevokePass: () => void;
}

const money = (amount: number, currency: string, locale: string) => {
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency: currency.toUpperCase(), maximumFractionDigits: amount % 1 === 0 ? 0 : 2 }).format(amount);
  } catch {
    return `${amount} ${currency.toUpperCase()}`;
  }
};

export const PaywallModal: React.FC<PaywallModalProps> = ({
  isOpen,
  onClose,
  siteName,
  siteId,
  passPriceMxn,
  passPriceUsd,
  hasPass,
  passExpiresAt,
  passCode,
  onPassChanged,
  onSimulatePurchase,
  onRevokePass,
}) => {
  const { isSunMode } = useTheme();
  const { strings, currentLanguage } = useLanguage();
  const t = strings.paywall;

  const [pricing, setPricing] = useState<PricingInfo | null>(null);
  const [busy, setBusy] = useState<'checkout' | 'code' | null>(null);
  const [error, setError] = useState<PaymentErrorCode | null>(null);
  const [showCode, setShowCode] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const isDebugMode = useMemo(() => {
    if (typeof window === 'undefined') return false;
    try {
      return new URLSearchParams(window.location.search).get('debug') === '1';
    } catch {
      return false;
    }
  }, []);
  // El pase simulado solo existe mientras no haya pagos reales (o al programar)
  const canSimulate = isDebugMode && (!PAYMENTS_ENABLED || import.meta.env.DEV);

  // Precios reales desde el servidor de pagos
  useEffect(() => {
    if (!isOpen || !PAYMENTS_ENABLED || pricing) return;
    let cancelled = false;
    fetchPricing().then((p) => {
      if (!cancelled && p) setPricing(p);
    });
    return () => {
      cancelled = true;
    };
  }, [isOpen, pricing]);

  useEffect(() => {
    if (!isOpen) {
      setError(null);
      setBusy(null);
      setNotice(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const locale = SPEECH_LOCALE[currentLanguage];
  const hours = pricing?.passHours ?? PASS_HOURS;
  const maxDevices = pricing?.maxDevices ?? PASS_MAX_DEVICES;

  // Moneda: español → pesos; otros idiomas → dólares si el sitio tiene precio en dólares
  const mxn = pricing?.prices.mxn ? money(pricing.prices.mxn.amount, pricing.prices.mxn.currency, locale) : money(passPriceMxn, 'MXN', locale);
  const usdValue = pricing?.prices.usd ? money(pricing.prices.usd.amount, pricing.prices.usd.currency, locale) : passPriceUsd ? money(passPriceUsd, 'USD', locale) : '';
  const primaryPrice = currentLanguage !== 'es' && pricing?.prices.usd ? usdValue : mxn;
  const priceLine = pricing ? (currentLanguage !== 'es' && pricing.prices.usd ? usdValue : mxn) : t.price(mxn, usdValue);

  const accent = isSunMode ? 'text-amber-800' : 'text-amber-400';
  const benefits = [
    { icon: <Clock className={`w-4 h-4 ${accent}`} />, title: t.benefits.accessTitle(hours), desc: t.benefits.accessDesc },
    { icon: <Sparkles className={`w-4 h-4 ${accent}`} />, title: t.benefits.guidesTitle, desc: t.benefits.guidesDesc },
    { icon: <WifiOff className={`w-4 h-4 ${accent}`} />, title: t.benefits.offlineTitle, desc: t.benefits.offlineDesc },
    { icon: <Shield className={`w-4 h-4 ${accent}`} />, title: t.benefits.freeTitle, desc: t.benefits.freeDesc },
  ];

  const handleCheckout = async () => {
    setError(null);
    setBusy('checkout');
    const r = await startCheckout(siteId, currentLanguage);
    if (r.ok) {
      // Se sale a la página segura de Stripe; al pagar, Stripe regresa a esta app
      window.location.assign(r.data.url);
      return;
    }
    setBusy(null);
    setError(r.error);
  };

  const handleRedeemCode = async () => {
    setError(null);
    setNotice(null);
    setBusy('code');
    const r = await redeemCode(codeInput.trim(), siteId);
    setBusy(null);
    if (r.ok) {
      setCodeInput('');
      setShowCode(false);
      setNotice(t.notice.codeOk);
      onPassChanged();
    } else {
      setError(r.error);
    }
  };

  const handleCopy = async () => {
    if (!passCode) return;
    try {
      await navigator.clipboard.writeText(passCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* sin permiso para copiar: el código sigue visible */
    }
  };

  const remaining = passExpiresAt ? formatRemainingHours(passExpiresAt) : '';
  const cardBorder = isSunMode ? 'border-stone-200' : 'border-stone-800';

  return (
    <div
      id="modal-paywall"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
    >
      <div
        className={`w-full max-w-[480px] border-t sm:border rounded-t-3xl sm:rounded-3xl p-5 max-h-[90vh] overflow-y-auto shadow-2xl transition-colors duration-200 ${
          isSunMode ? 'bg-white border-stone-300 text-stone-900' : 'bg-stone-900 border-stone-800 text-stone-100'
        }`}
      >
        {/* Header */}
        <div className={`flex items-start justify-between pb-3 border-b ${cardBorder}`}>
          <div>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                isSunMode ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
              }`}
            >
              {t.badge}
            </span>
            <h3 className={`text-base font-extrabold mt-1.5 ${isSunMode ? 'text-stone-950' : 'text-white'}`}>{siteName}</h3>
          </div>
          <button
            id="btn-close-paywall-modal"
            onClick={onClose}
            aria-label={t.closeAria}
            className={`min-h-[48px] min-w-[48px] flex items-center justify-center rounded-xl transition ${
              isSunMode ? 'hover:bg-stone-100 text-stone-600' : 'hover:bg-stone-800 text-stone-400 hover:text-white'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {notice && (
          <p role="status" className={`mt-3 text-xs font-semibold ${isSunMode ? 'text-emerald-800' : 'text-emerald-300'}`}>
            {notice}
          </p>
        )}

        {/* Pase activo */}
        {hasPass && passExpiresAt && (
          <div
            data-testid="pass-active"
            className={`my-3.5 p-3.5 rounded-2xl border space-y-3 ${
              isSunMode ? 'bg-emerald-50 border-emerald-300 text-emerald-950' : 'bg-emerald-950/80 border-emerald-600/50 text-emerald-200'
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="text-xs font-extrabold">{t.activeTitle}</p>
                  <p className="text-[11px] font-medium">{remaining ? t.remaining(remaining) : ''}</p>
                </div>
              </div>
              {(canSimulate || import.meta.env.DEV) && (
                <button
                  id="btn-revoke-pass"
                  onClick={onRevokePass}
                  className={`min-h-[40px] flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold transition border ${
                    isSunMode ? 'bg-white border-rose-300 text-rose-800 hover:bg-rose-50' : 'bg-stone-900 border-rose-800/40 text-rose-300 hover:bg-stone-800'
                  }`}
                  title={t.signOutTitle}
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{t.signOut}</span>
                </button>
              )}
            </div>

            {passCode && (
              <div className={`pt-3 border-t ${isSunMode ? 'border-emerald-200' : 'border-emerald-700/40'}`}>
                <p className="text-[11px] font-bold">{t.codeTitle}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <code data-testid="pass-code" className="px-3 py-1.5 rounded-lg font-mono text-sm font-extrabold tracking-widest bg-black/20">
                    {passCode}
                  </code>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="min-h-[36px] flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border border-current/30 hover:bg-black/10"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copied ? t.copied : t.copy}</span>
                  </button>
                </div>
                <p className="text-[10px] mt-1.5 opacity-80">{t.codeHint(maxDevices)}</p>
              </div>
            )}
          </div>
        )}

        {/* Precio */}
        {!hasPass && (
          <div
            className={`my-4 p-4.5 rounded-2xl text-center relative overflow-hidden border ${
              isSunMode ? 'bg-[#F9F6F0] border-amber-300 shadow-xs' : 'bg-gradient-to-br from-amber-500/15 via-stone-950 to-stone-950 border-amber-500/40'
            }`}
          >
            <p className={`text-xs uppercase font-extrabold tracking-widest ${isSunMode ? 'text-amber-800' : 'text-amber-400'}`}>
              {t.offerTitle(hours)}
            </p>
            <div className="flex items-baseline justify-center gap-1.5 mt-2">
              <span data-testid="pass-price" className={`text-3xl font-extrabold font-mono ${isSunMode ? 'text-stone-950' : 'text-white'}`}>
                {priceLine}
              </span>
            </div>
            <p className={`text-[11px] font-medium mt-1.5 ${isSunMode ? 'text-stone-600' : 'text-stone-400'}`}>{t.priceNote}</p>
          </div>
        )}

        {/* Beneficios */}
        <div className="space-y-2.5 mb-5">
          {benefits.map((b, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-3 p-3 rounded-xl border ${isSunMode ? 'bg-stone-50 border-stone-200' : 'bg-stone-950/60 border-stone-800/60'}`}
            >
              <div
                className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                  isSunMode ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}
              >
                {b.icon}
              </div>
              <div>
                <p className={`text-xs font-bold ${isSunMode ? 'text-stone-950' : 'text-stone-200'}`}>{b.title}</p>
                <p className={`text-[11px] leading-snug mt-0.5 ${isSunMode ? 'text-stone-600' : 'text-stone-400'}`}>{b.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {error && (
          <p role="alert" data-testid="paywall-error" className={`mb-3 text-xs font-semibold ${isSunMode ? 'text-rose-800' : 'text-rose-300'}`}>
            {t.errors[error]}
          </p>
        )}

        {/* Acciones (altura táctil mínima de 48 px) */}
        <div className={`space-y-3 pt-3 border-t ${cardBorder}`}>
          {!hasPass && PAYMENTS_ENABLED && (
            <>
              <button
                id="btn-stripe-checkout"
                onClick={handleCheckout}
                disabled={busy !== null}
                className={`w-full min-h-[48px] px-4 py-3 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-2 active:scale-98 shadow-md disabled:opacity-60 ${
                  isSunMode ? 'bg-amber-700 hover:bg-amber-800 text-white shadow-amber-800/20' : 'bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-amber-500/20'
                }`}
              >
                <span>{busy === 'checkout' ? t.redirecting : t.payButton(primaryPrice)}</span>
                <ExternalLink className="w-4 h-4" />
              </button>
              <p className={`flex items-center justify-center gap-1.5 text-[10px] ${isSunMode ? 'text-stone-500' : 'text-stone-500'}`}>
                <Lock className="w-3 h-3" />
                <span>{t.secureNote}</span>
              </p>
            </>
          )}

          {!hasPass && !PAYMENTS_ENABLED && (
            <p data-testid="payments-unavailable" className={`text-xs text-center ${isSunMode ? 'text-stone-600' : 'text-stone-400'}`}>
              {t.unavailable}
            </p>
          )}

          {/* Activar con un código (segundo dispositivo) */}
          {!hasPass && PAYMENTS_ENABLED && (
            <div>
              <button
                type="button"
                id="btn-have-code"
                onClick={() => {
                  setShowCode((v) => !v);
                  setError(null);
                }}
                className={`w-full min-h-[44px] flex items-center justify-center gap-2 text-[11px] font-bold transition ${
                  isSunMode ? 'text-stone-700 hover:text-stone-950' : 'text-stone-300 hover:text-white'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>{t.haveCode}</span>
              </button>
              {showCode && (
                <form
                  className="mt-1 flex items-stretch gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (codeInput.trim() && busy === null) handleRedeemCode();
                  }}
                >
                  <input
                    id="input-pass-code"
                    value={codeInput}
                    onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                    placeholder={t.codePlaceholder}
                    aria-label={t.codeLabel}
                    autoCapitalize="characters"
                    autoComplete="off"
                    spellCheck={false}
                    maxLength={12}
                    className={`flex-1 min-h-[44px] px-3 rounded-xl font-mono text-sm tracking-widest border outline-hidden focus:border-amber-500 ${
                      isSunMode ? 'bg-white border-stone-300 text-stone-900' : 'bg-black/40 border-white/10 text-white'
                    }`}
                  />
                  <button
                    type="submit"
                    id="btn-redeem-code"
                    disabled={busy !== null || !codeInput.trim()}
                    className="min-h-[44px] px-4 rounded-xl text-xs font-extrabold bg-amber-500 hover:bg-amber-400 text-stone-950 disabled:opacity-50"
                  >
                    {busy === 'code' ? t.verifying : t.activate}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Pase simulado de pruebas */}
          {!hasPass && canSimulate && (
            <button
              id="btn-simulate-pass"
              onClick={() => {
                onSimulatePurchase();
                onClose();
              }}
              className={`w-full min-h-[48px] px-4 py-3 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-2 active:scale-98 border ${
                isSunMode ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border-emerald-400' : 'bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border-emerald-700/60'
              }`}
            >
              <RefreshCw className="w-4 h-4 text-emerald-600" />
              <span>{t.debugSimulate}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
