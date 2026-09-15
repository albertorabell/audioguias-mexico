import React from 'react';
import { X, Sparkles, CheckCircle, Shield, WifiOff, Clock, ExternalLink, RefreshCw, LogOut } from 'lucide-react';
import { formatRemainingHours } from '../utils/license';
import { useTheme } from '../utils/ThemeContext';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  siteName: string;
  siteId: string;
  passPriceMxn: number;
  passPriceUsd: number;
  stripeLink: string;
  hasPass: boolean;
  passExpiresAt?: number;
  onSimulatePurchase: () => void;
  onRevokePass: () => void;
}

export const PaywallModal: React.FC<PaywallModalProps> = ({
  isOpen,
  onClose,
  siteName,
  siteId,
  passPriceMxn,
  passPriceUsd,
  stripeLink,
  hasPass,
  passExpiresAt,
  onSimulatePurchase,
  onRevokePass,
}) => {
  const { isSunMode } = useTheme();

  if (!isOpen) return null;

  const benefits = [
    {
      icon: <Clock className={`w-4 h-4 ${isSunMode ? 'text-amber-800' : 'text-amber-400'}`} />,
      title: '72 Horas de Acceso Completo',
      desc: 'Disfruta tu recorrido a tu propio ritmo con vigencia extendida.',
    },
    {
      icon: <Sparkles className={`w-4 h-4 ${isSunMode ? 'text-amber-800' : 'text-amber-400'}`} />,
      title: 'Audioguías y Análisis Arqueológico',
      desc: 'Todas las obras y monolitos premium con explicaciones de expertos.',
    },
    {
      icon: <WifiOff className={`w-4 h-4 ${isSunMode ? 'text-amber-800' : 'text-amber-400'}`} />,
      title: 'Modo 100% Offline en Salas',
      desc: 'Todo el contenido precacheado sin consumir datos en el recinto.',
    },
    {
      icon: <Shield className={`w-4 h-4 ${isSunMode ? 'text-amber-800' : 'text-amber-400'}`} />,
      title: 'Sin Anuncios ni Suscripciones Recurrentes',
      desc: 'Un único pago transparente sin cobros automáticos posteriores.',
    },
  ];

  const handleStripeCheckout = () => {
    window.open(stripeLink, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      id="modal-paywall"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
    >
      <div
        className={`w-full max-w-[480px] border-t sm:border rounded-t-3xl sm:rounded-3xl p-5 max-h-[90vh] overflow-y-auto shadow-2xl transition-colors duration-200 ${
          isSunMode
            ? 'bg-white border-stone-300 text-stone-900'
            : 'bg-stone-900 border-stone-800 text-stone-100'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-start justify-between pb-3 border-b ${
            isSunMode ? 'border-stone-200' : 'border-stone-800'
          }`}
        >
          <div>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                isSunMode
                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                  : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
              }`}
            >
              Pase de Visitante
            </span>
            <h3 className={`text-base font-extrabold mt-1.5 ${isSunMode ? 'text-stone-950' : 'text-white'}`}>
              {siteName}
            </h3>
          </div>
          <button
            id="btn-close-paywall-modal"
            onClick={onClose}
            className={`min-h-[48px] min-w-[48px] flex items-center justify-center rounded-xl transition ${
              isSunMode ? 'hover:bg-stone-100 text-stone-600' : 'hover:bg-stone-800 text-stone-400 hover:text-white'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current status if active */}
        {hasPass && passExpiresAt && (
          <div
            className={`my-3.5 p-3.5 rounded-2xl flex items-center justify-between gap-3 border ${
              isSunMode
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                : 'bg-emerald-950/80 border-emerald-600/50 text-emerald-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="text-xs font-extrabold">Pase Activo para este sitio</p>
                <p className="text-[11px] font-medium">
                  {formatRemainingHours(passExpiresAt)} restantes
                </p>
              </div>
            </div>
            <button
              id="btn-revoke-pass"
              onClick={onRevokePass}
              className={`min-h-[40px] flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold transition border ${
                isSunMode
                  ? 'bg-white border-rose-300 text-rose-800 hover:bg-rose-50'
                  : 'bg-stone-900 border-rose-800/40 text-rose-300 hover:bg-stone-800'
              }`}
              title="Cerrar sesión del pase para probar el candado"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Cerrar sesión</span>
            </button>
          </div>
        )}

        {/* Pricing card */}
        <div
          className={`my-4 p-4.5 rounded-2xl text-center relative overflow-hidden border ${
            isSunMode
              ? 'bg-[#F9F6F0] border-amber-300 shadow-xs'
              : 'bg-gradient-to-br from-amber-500/15 via-stone-950 to-stone-950 border-amber-500/40'
          }`}
        >
          <p
            className={`text-xs uppercase font-extrabold tracking-widest ${
              isSunMode ? 'text-amber-800' : 'text-amber-400'
            }`}
          >
            Acceso Total 72 Horas
          </p>
          <div className="flex items-baseline justify-center gap-1.5 mt-2">
            <span
              className={`text-3xl font-extrabold font-mono ${
                isSunMode ? 'text-stone-950' : 'text-white'
              }`}
            >
              ${passPriceMxn}
            </span>
            <span className={`text-xs font-bold ${isSunMode ? 'text-stone-700' : 'text-stone-400'}`}>
              MXN
            </span>
            <span className={`text-xs ml-1 ${isSunMode ? 'text-stone-500' : 'text-stone-500'}`}>
              / ~${passPriceUsd} USD
            </span>
          </div>
          <p className={`text-[11px] font-medium mt-1.5 ${isSunMode ? 'text-stone-600' : 'text-stone-400'}`}>
            Pago único por dispositivo • Sin suscripción recurrente
          </p>
        </div>

        {/* Benefits list */}
        <div className="space-y-2.5 mb-5">
          {benefits.map((b, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-3 p-3 rounded-xl border ${
                isSunMode
                  ? 'bg-stone-50 border-stone-200'
                  : 'bg-stone-950/60 border-stone-800/60'
              }`}
            >
              <div
                className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                  isSunMode
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}
              >
                {b.icon}
              </div>
              <div>
                <p className={`text-xs font-bold ${isSunMode ? 'text-stone-950' : 'text-stone-200'}`}>
                  {b.title}
                </p>
                <p className={`text-[11px] leading-snug mt-0.5 ${isSunMode ? 'text-stone-600' : 'text-stone-400'}`}>
                  {b.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Primary Action Buttons (min 48px de altura táctil) */}
        <div
          className={`space-y-3 pt-3 border-t ${
            isSunMode ? 'border-stone-200' : 'border-stone-800'
          }`}
        >
          {/* Main Stripe Button */}
          <button
            id="btn-stripe-checkout"
            onClick={handleStripeCheckout}
            className={`w-full min-h-[48px] px-4 py-3 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-2 active:scale-98 shadow-md ${
              isSunMode
                ? 'bg-amber-700 hover:bg-amber-800 text-white shadow-amber-800/20'
                : 'bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-amber-500/20'
            }`}
          >
            <span>Comprar Pase con Tarjeta / Stripe (${passPriceMxn} MXN)</span>
            <ExternalLink className="w-4 h-4" />
          </button>

          {/* Test Simulation Button (Instant unlock) */}
          <button
            id="btn-simulate-pass"
            onClick={() => {
              onSimulatePurchase();
              onClose();
            }}
            className={`w-full min-h-[48px] px-4 py-3 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-2 active:scale-98 border ${
              isSunMode
                ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border-emerald-400'
                : 'bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border-emerald-700/60'
            }`}
          >
            <RefreshCw className="w-4 h-4 text-emerald-600" />
            <span>Activar Pase Simulado (72h para testing)</span>
          </button>

          {hasPass && (
            <button
              onClick={onRevokePass}
              className={`w-full min-h-[44px] text-[11px] font-semibold transition ${
                isSunMode ? 'text-stone-600 hover:text-stone-950' : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Cerrar sesión de pase para volver a probar el candado
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
