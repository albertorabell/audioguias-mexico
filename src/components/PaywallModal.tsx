import React, { useEffect, useMemo, useState } from 'react';
import { X, Sparkles, CheckCircle, Shield, WifiOff, Clock, ExternalLink, RefreshCw, LogOut, KeyRound, Copy, Lock, Tag } from 'lucide-react';
import { formatRemainingHours } from '../utils/license';
import { useLanguage } from '../utils/LanguageContext';
import { PASS_HOURS, PASS_MAX_DEVICES } from '../config/pass';
import { PAYMENTS_ENABLED } from '../config/payments';
import { fetchPricing, PricingInfo, redeemCode, startCheckout, PaymentErrorCode, previewPromo, getSavedPromo, savePromo, clearSavedPromo } from '../utils/payments';
import { SPEECH_LOCALE } from '../i18n/languages';
import { track } from '../utils/analytics';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  siteName: string;
  siteId: string;
  /** Precios de la ficha del sitio. Se muestran solo si el servidor de pagos no responde. */
  passPriceMxn?: number;
  passPriceUsd?: number;
  /** Cómo se entra a este sitio. Sin dato = pase de pago. Si el servidor dice otra cosa, manda el servidor. */
  access?: 'paid' | 'free' | 'code';
  hasPass: boolean;
  /** Sitio al que pertenece el pase activo (si es otro distinto de este sitio, es un pase combinado). */
  passSite?: string;
  /** Nombre de cada sitio por id, para decir qué incluye un pase combinado. */
  siteNames?: Record<string, string>;
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
  access,
  hasPass,
  passSite,
  siteNames,
  passExpiresAt,
  passCode,
  onPassChanged,
  onSimulatePurchase,
  onRevokePass,
}) => {
  const { strings, currentLanguage } = useLanguage();
  const t = strings.paywall;

  const [pricing, setPricing] = useState<PricingInfo | null>(null);
  const [busy, setBusy] = useState<string | null>(null); // 'checkout', 'code' o 'combo:<id>'
  const [error, setError] = useState<PaymentErrorCode | null>(null);
  const [showCode, setShowCode] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  // Código de descuento: lo que se escribe, el que ya se revisó y se aplicó, y si se está revisando
  const [showPromo, setShowPromo] = useState(false);
  const [promoInput, setPromoInput] = useState('');
  const [promo, setPromo] = useState<{ code: string; percentOff: number } | null>(null);
  const [promoError, setPromoError] = useState<PaymentErrorCode | null>(null);
  const [promoBusy, setPromoBusy] = useState(false);

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

  // Si el visitante regresa con el botón "atrás" desde Stripe, el navegador puede restaurar esta página tal como estaba
  // (con el botón en "Abriendo el pago…"). Al volver a mostrarse se libera.
  useEffect(() => {
    const onShow = (e: PageTransitionEvent) => {
      if (e.persisted) setBusy(null);
    };
    window.addEventListener('pageshow', onShow);
    return () => window.removeEventListener('pageshow', onShow);
  }, []);

  // Precios reales desde el servidor de pagos
  useEffect(() => {
    if (!isOpen || !PAYMENTS_ENABLED || pricing) return;
    let cancelled = false;
    fetchPricing(siteId).then((p) => {
      if (!cancelled && p) setPricing(p);
    });
    return () => {
      cancelled = true;
    };
  }, [isOpen, pricing, siteId]);

  const applyPromo = async (raw: string) => {
    const code = raw.trim();
    if (!code) return;
    setPromoError(null);
    setPromoBusy(true);
    const r = await previewPromo(siteId, code);
    setPromoBusy(false);
    if (r.ok) {
      setPromo(r.data);
      setPromoInput(r.data.code);
      savePromo(r.data.code);
    } else {
      setPromo(null);
      setPromoError(r.error);
      // Un código guardado que ya no sirve se olvida para no estorbar
      if (r.error === 'promo_invalid' || r.error === 'promo_not_for_site') clearSavedPromo();
    }
  };

  // Si la persona llegó con un código (QR del hotel), se revisa solo al abrir la ventana
  useEffect(() => {
    if (!isOpen || !PAYMENTS_ENABLED || promo || hasPass) return;
    const saved = getSavedPromo();
    if (saved) {
      setShowPromo(true);
      setPromoInput(saved);
      void applyPromo(saved);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

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
  const mxn = pricing?.prices.mxn ? money(pricing.prices.mxn.amount, pricing.prices.mxn.currency, locale) : passPriceMxn ? money(passPriceMxn, 'MXN', locale) : '';
  const usdValue = pricing?.prices.usd ? money(pricing.prices.usd.amount, pricing.prices.usd.currency, locale) : passPriceUsd ? money(passPriceUsd, 'USD', locale) : '';
  const primaryPrice = currentLanguage !== 'es' && pricing?.prices.usd ? usdValue : mxn;
  const priceLine = pricing ? (currentLanguage !== 'es' && pricing.prices.usd ? usdValue : mxn) : t.price(mxn, usdValue);

  // Precio con descuento (solo para mostrarlo; el cobro real lo calcula Stripe)
  const usingUsd = currentLanguage !== 'es' && !!pricing?.prices.usd;
  const baseAmount = usingUsd ? pricing!.prices.usd!.amount : pricing?.prices.mxn ? pricing.prices.mxn.amount : passPriceMxn || 0;
  const baseCurrency = usingUsd ? pricing!.prices.usd!.currency : pricing?.prices.mxn?.currency || 'MXN';
  const discounted = promo ? money(Math.round(baseAmount * (100 - promo.percentOff)) / 100, baseCurrency, locale) : null;

  const accent = 'text-oro-ink';
  const benefits = [
    { icon: <Clock className={`w-4 h-4 ${accent}`} />, title: t.benefits.accessTitle(hours), desc: t.benefits.accessDesc },
    { icon: <Sparkles className={`w-4 h-4 ${accent}`} />, title: t.benefits.guidesTitle, desc: t.benefits.guidesDesc },
    { icon: <WifiOff className={`w-4 h-4 ${accent}`} />, title: t.benefits.offlineTitle, desc: t.benefits.offlineDesc },
    { icon: <Shield className={`w-4 h-4 ${accent}`} />, title: t.benefits.freeTitle, desc: t.benefits.freeDesc },
  ];

  // Solo con código: el sitio no se vende con pase (lo dice la ficha del sitio o, si responde, el servidor)
  const codeOnly = pricing?.access ? pricing.access === 'codigo' : access === 'code';
  // Pases combinados que abren este sitio, con su precio en la moneda del idioma
  const combos = (pricing?.combos || []).flatMap((c) => {
    const amount = currentLanguage !== 'es' && c.prices.usd ? c.prices.usd : c.prices.mxn;
    if (!amount) return [];
    const names = c.name as Record<string, string | undefined>;
    return [
      {
        id: c.id,
        name: names[currentLanguage] || names.es || c.id,
        includes: c.sites === 'todos' ? t.combo.all : t.combo.includes(c.sites.map((id) => siteNames?.[id] || id).join(', ')),
        price: money(amount.amount, amount.currency, locale),
      },
    ];
  });

  // `target` es el sitio que se compra, o el id de un pase combinado (esos no llevan código de descuento)
  const handleCheckout = async (target: string = siteId) => {
    const isCombo = target.toLowerCase() !== siteId.toLowerCase();
    setError(null);
    setBusy(isCombo ? `combo:${target}` : 'checkout');
    track('checkout_start', { l: currentLanguage, s: target });
    const r = await startCheckout(target, currentLanguage, isCombo ? undefined : promo?.code);
    if (r.ok) {
      // Se sale a la página segura de Stripe; al pagar, Stripe regresa a esta app
      window.location.assign(r.data.url);
      return;
    }
    setBusy(null);
    if (r.error === 'promo_invalid' || r.error === 'promo_not_for_site') {
      // El código dejó de servir (venció o se agotó): se quita y se avisa, sin cobrar nada
      setPromo(null);
      clearSavedPromo();
      setPromoError(r.error);
      return;
    }
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

  return (
    <div id="modal-paywall" className="fixed inset-0 z-50 bg-scrim backdrop-blur-sm flex items-end sm:items-center justify-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="paywall-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[480px] max-h-[92dvh] overflow-y-auto overscroll-contain rounded-t-[24px] sm:rounded-[24px] bg-surface text-ink border border-line px-5 pt-3 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] shadow-2xl animate-sheet"
      >
        <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-line-strong sm:hidden" aria-hidden="true" />
        <div className="flex items-start justify-between gap-3">
          <div className="pt-1">
            <p className="text-cap font-semibold text-oro-ink">{t.badge}</p>
            <h3 id="paywall-title" className="mt-0.5 font-serif text-h3 font-medium">
              {siteName}
            </h3>
          </div>
          <button id="btn-close-paywall-modal" type="button" onClick={onClose} aria-label={t.closeAria} className="btn-icon -mr-2 text-ink-2 shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        {notice && (
          <p role="status" className="mt-3 text-ui font-semibold text-jade-ink">
            {notice}
          </p>
        )}

        {hasPass && passExpiresAt && (
          <div data-testid="pass-active" className="mt-4 p-4 rounded-2xl bg-jade/10 border border-jade/40 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <CheckCircle className="w-5 h-5 text-jade-ink shrink-0" />
                <div>
                  <p className="text-ui font-bold">{passSite && passSite.toLowerCase() !== siteId.toLowerCase() ? t.combo.active : t.activeTitle}</p>
                  {remaining && <p className="text-cap text-ink-2">{t.remaining(remaining)}</p>}
                </div>
              </div>
              {(canSimulate || import.meta.env.DEV) && (
                <button
                  id="btn-revoke-pass"
                  type="button"
                  onClick={onRevokePass}
                  className="min-h-10 inline-flex items-center gap-1.5 px-3 rounded-full text-cap font-semibold border border-tezontle/50 text-tezontle cursor-pointer"
                  title={t.signOutTitle}
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{t.signOut}</span>
                </button>
              )}
            </div>

            {passCode && (
              <div className="pt-3 border-t border-jade/25">
                <p className="text-cap font-semibold text-ink-2">{t.codeTitle}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <code data-testid="pass-code" className="px-3 py-1.5 rounded-lg bg-bg font-mono text-[1.0625rem] font-bold tracking-[0.12em]">
                    {passCode}
                  </code>
                  <button type="button" onClick={handleCopy} className="min-h-10 inline-flex items-center gap-1.5 px-3 rounded-full text-cap font-semibold border border-line-strong cursor-pointer">
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copied ? t.copied : t.copy}</span>
                  </button>
                </div>
                <p className="text-cap mt-2 text-ink-3">{t.codeHint(maxDevices)}</p>
              </div>
            )}
          </div>
        )}

        {!hasPass && codeOnly && (
          <div data-testid="code-only" className="mt-4 p-5 rounded-2xl bg-bg border border-oro/40 text-center">
            <p className="text-ui font-semibold text-oro-ink">{t.codeOnly.title}</p>
            <p className="text-cap text-ink-2 mt-1.5">{t.codeOnly.desc}</p>
          </div>
        )}

        {!hasPass && !codeOnly && (
          <div className="mt-4 p-5 rounded-2xl bg-bg border border-oro/40 text-center">
            <p className="text-ui font-semibold text-oro-ink">{t.offerTitle(hours)}</p>
            {promo && discounted && (
              <p data-testid="pass-price-original" className="mt-1 text-ui text-ink-3 tabular-nums line-through">
                {priceLine}
              </p>
            )}
            <p data-testid="pass-price" className="mt-1 font-serif text-[2.5rem] leading-tight font-medium tabular-nums">
              {promo && discounted ? discounted : priceLine}
            </p>
            {promo && (
              <p data-testid="promo-applied" className="mt-1 text-cap font-semibold text-jade-ink">
                {t.promo.applied(promo.code, promo.percentOff)}
              </p>
            )}
            <p className="text-cap text-ink-3 mt-1">{t.priceNote}</p>
          </div>
        )}

        <ul className="mt-4 space-y-3">
          {benefits.map((b, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <span className="w-9 h-9 rounded-full bg-raised flex items-center justify-center shrink-0">{b.icon}</span>
              <div className="pt-0.5">
                <p className="text-ui font-bold">{b.title}</p>
                <p className="text-cap leading-snug mt-0.5 text-ink-2">{b.desc}</p>
              </div>
            </li>
          ))}
        </ul>

        {error && (
          <p role="alert" data-testid="paywall-error" className="mt-4 text-ui font-semibold text-tezontle">
            {t.errors[error]}
          </p>
        )}

        <div className="mt-5 space-y-3">
          {!hasPass && PAYMENTS_ENABLED && !codeOnly && (
            <>
              <button
                id="btn-stripe-checkout"
                type="button"
                onClick={() => handleCheckout()}
                disabled={busy !== null}
                className="w-full min-h-[3.25rem] px-4 rounded-full bg-oro text-on-oro text-ui font-bold inline-flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] transition-transform disabled:opacity-60"
              >
                <span>{busy === 'checkout' ? t.redirecting : t.payButton(promo && discounted ? discounted : primaryPrice)}</span>
                <ExternalLink className="w-4 h-4" />
              </button>
              <p className="flex items-center justify-center gap-1.5 text-[12px] text-ink-3">
                <Lock className="w-3 h-3" />
                <span>{t.secureNote}</span>
              </p>
            </>
          )}

          {!hasPass && !PAYMENTS_ENABLED && (
            <p data-testid="payments-unavailable" className="text-ui text-center text-ink-2">
              {t.unavailable}
            </p>
          )}

          {!hasPass &&
            PAYMENTS_ENABLED &&
            combos.map((c) => (
              <div key={c.id} data-testid="combo-offer" className="p-4 rounded-2xl border border-line text-center">
                <p className="text-ui font-bold">{c.name}</p>
                <p className="text-cap leading-snug mt-1 text-ink-2">{c.includes}</p>
                <button
                  id={`btn-stripe-checkout-combo-${c.id}`}
                  type="button"
                  onClick={() => handleCheckout(c.id)}
                  disabled={busy !== null}
                  className="mt-3 w-full min-h-12 px-4 rounded-full border border-oro text-oro-ink text-ui font-bold inline-flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] transition-transform disabled:opacity-60"
                >
                  <span>{busy === `combo:${c.id}` ? t.redirecting : t.combo.button(c.price)}</span>
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            ))}

          {!hasPass && PAYMENTS_ENABLED && !codeOnly && (
            <div>
              <button
                type="button"
                id="btn-have-promo"
                onClick={() => {
                  setShowPromo((v) => !v);
                  setPromoError(null);
                }}
                aria-expanded={showPromo}
                className="w-full min-h-11 inline-flex items-center justify-center gap-2 text-ui font-semibold text-ink-2 cursor-pointer rounded-full active:bg-raised"
              >
                <Tag className="w-4 h-4" />
                <span>{t.promo.toggle}</span>
              </button>
              {showPromo && (
                <form
                  className="mt-2 flex items-stretch gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (promoInput.trim() && !promoBusy) void applyPromo(promoInput);
                  }}
                >
                  <input
                    id="input-promo-code"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                    placeholder={t.promo.placeholder}
                    aria-label={t.promo.label}
                    autoCapitalize="characters"
                    autoComplete="off"
                    spellCheck={false}
                    maxLength={40}
                    className="flex-1 min-w-0 min-h-12 px-4 rounded-full bg-bg border border-line-strong font-mono tracking-[0.08em] text-ink outline-none focus:border-jade"
                  />
                  <button type="submit" id="btn-apply-promo" disabled={promoBusy || !promoInput.trim()} className="btn-primary min-h-12 disabled:opacity-50">
                    {promoBusy ? t.verifying : t.promo.apply}
                  </button>
                </form>
              )}
              {promoError && (
                <p role="alert" data-testid="promo-error" className="mt-2 text-ui font-semibold text-tezontle">
                  {t.errors[promoError]}
                </p>
              )}
            </div>
          )}

          {!hasPass && PAYMENTS_ENABLED && (
            <div>
              {!codeOnly && (
                <button
                  type="button"
                  id="btn-have-code"
                  onClick={() => {
                    setShowCode((v) => !v);
                    setError(null);
                  }}
                  aria-expanded={showCode}
                  className="w-full min-h-11 inline-flex items-center justify-center gap-2 text-ui font-semibold text-ink-2 cursor-pointer rounded-full active:bg-raised"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>{t.haveCode}</span>
                </button>
              )}
              {(showCode || codeOnly) && (
                <form
                  className="mt-2 flex items-stretch gap-2"
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
                    maxLength={24}
                    className="flex-1 min-w-0 min-h-12 px-4 rounded-full bg-bg border border-line-strong font-mono tracking-[0.12em] text-ink outline-none focus:border-jade"
                  />
                  <button
                    type="submit"
                    id="btn-redeem-code"
                    disabled={busy !== null || !codeInput.trim()}
                    className="btn-primary min-h-12 disabled:opacity-50"
                  >
                    {busy === 'code' ? t.verifying : t.activate}
                  </button>
                </form>
              )}
            </div>
          )}

          {!hasPass && canSimulate && (
            <button
              id="btn-simulate-pass"
              type="button"
              onClick={() => {
                onSimulatePurchase();
                onClose();
              }}
              className="btn-secondary w-full"
            >
              <RefreshCw className="w-4 h-4" />
              <span>{t.debugSimulate}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
