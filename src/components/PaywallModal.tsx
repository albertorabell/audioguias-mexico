import React from 'react';
import { X, Sparkles, CheckCircle, Shield, WifiOff, Clock, ExternalLink, RefreshCw, LogOut } from 'lucide-react';
import { formatRemainingHours } from '../utils/license';

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
  if (!isOpen) return null;

  const benefits = [
    {
      icon: <Clock className="w-4 h-4 text-amber-400" />,
      title: '72 Horas de Acceso Completo',
      desc: 'Disfruta tu recorrido a tu propio ritmo con vigencia extendida.',
    },
    {
      icon: <Sparkles className="w-4 h-4 text-amber-400" />,
      title: 'Audioguías y Análisis Arqueológico',
      desc: 'Todas las obras y monolitos premium con explicaciones de expertos.',
    },
    {
      icon: <WifiOff className="w-4 h-4 text-amber-400" />,
      title: 'Modo 100% Offline en Salas',
      desc: 'Todo el contenido precacheado sin consumir datos en el recinto.',
    },
    {
      icon: <Shield className="w-4 h-4 text-amber-400" />,
      title: 'Sin Anuncios ni Suscripciones Recurrentes',
      desc: 'Un único pago transparente sin cobros automáticos posteriores.',
    },
  ];

  const handleStripeCheckout = () => {
    // Open stripe link or prompt user
    window.open(stripeLink, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      id="modal-paywall"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
    >
      <div className="w-full max-w-[480px] bg-stone-900 border-t sm:border border-stone-800 rounded-t-3xl sm:rounded-3xl p-5 text-stone-100 max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-stone-800">
          <div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 uppercase tracking-wider border border-amber-500/30">
              Pase de Visitante
            </span>
            <h3 className="text-base font-bold text-white mt-1">
              {siteName}
            </h3>
          </div>
          <button
            id="btn-close-paywall-modal"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-stone-800 text-stone-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current status if active */}
        {hasPass && passExpiresAt && (
          <div className="my-3.5 p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-600/50 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <p className="text-xs font-bold text-emerald-300">Pase Activo para este sitio</p>
                <p className="text-[11px] text-emerald-400/90">
                  {formatRemainingHours(passExpiresAt)} restantes
                </p>
              </div>
            </div>
            <button
              id="btn-revoke-pass"
              onClick={onRevokePass}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-stone-900 hover:bg-stone-800 text-rose-300 border border-rose-800/40 transition"
              title="Cerrar sesión del pase para probar el candado"
            >
              <LogOut className="w-3 h-3" />
              <span>Cerrar sesión</span>
            </button>
          </div>
        )}

        {/* Pricing card */}
        <div className="my-4 p-4 rounded-2xl bg-gradient-to-br from-amber-500/15 via-stone-950 to-stone-950 border border-amber-500/40 text-center relative overflow-hidden">
          <p className="text-xs uppercase font-bold tracking-widest text-amber-400">
            Acceso Total 72 Horas
          </p>
          <div className="flex items-baseline justify-center gap-1.5 mt-1.5">
            <span className="text-3xl font-extrabold text-white font-mono">${passPriceMxn}</span>
            <span className="text-xs font-semibold text-stone-400">MXN</span>
            <span className="text-xs text-stone-500 ml-1">/ ~${passPriceUsd} USD</span>
          </div>
          <p className="text-[11px] text-stone-400 mt-1">
            Pago único por dispositivo • Sin suscripción recurrente
          </p>
        </div>

        {/* Benefits list */}
        <div className="space-y-2.5 mb-5">
          {benefits.map((b, idx) => (
            <div key={idx} className="flex items-start gap-3 p-2.5 rounded-xl bg-stone-950/60 border border-stone-800/60">
              <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 shrink-0 mt-0.5">
                {b.icon}
              </div>
              <div>
                <p className="text-xs font-bold text-stone-200">{b.title}</p>
                <p className="text-[11px] text-stone-400 leading-snug">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Primary Action Buttons */}
        <div className="space-y-2.5 pt-2 border-t border-stone-800">
          {/* Main Stripe Button */}
          <button
            id="btn-stripe-checkout"
            onClick={handleStripeCheckout}
            className="w-full py-3 px-4 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-stone-950 transition flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-98"
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
            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60 transition flex items-center justify-center gap-2 active:scale-98"
          >
            <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
            <span>Activar Pase Simulado (72h para testing)</span>
          </button>

          {hasPass && (
            <button
              onClick={onRevokePass}
              className="w-full py-2 text-[11px] text-stone-400 hover:text-stone-300 transition"
            >
              Cerrar sesión de pase para volver a probar el candado
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
