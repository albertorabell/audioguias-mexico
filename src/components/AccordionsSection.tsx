import React, { useState } from 'react';
import { ChevronDown, HelpCircle, Layers } from 'lucide-react';
import { SpecItem, FaqItem } from '../types';
import { useTheme } from '../utils/ThemeContext';

interface AccordionsSectionProps {
  specs: SpecItem[];
  faqs: FaqItem[];
}

export const AccordionsSection: React.FC<AccordionsSectionProps> = ({
  specs,
  faqs,
}) => {
  const [specsOpen, setSpecsOpen] = useState(false);
  const [faqsOpen, setFaqsOpen] = useState(false);
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(0);
  const { isSunMode } = useTheme();

  return (
    <div className="space-y-3.5">
      {/* Accordion 1: Ficha Técnica */}
      <div
        className={`rounded-2xl border transition overflow-hidden ${
          isSunMode
            ? 'bg-white border-stone-300 shadow-xs'
            : 'bg-stone-900/80 border-stone-800 shadow-xs'
        }`}
      >
        <button
          id="accordion-specs-toggle"
          onClick={() => setSpecsOpen(!specsOpen)}
          className={`w-full min-h-[48px] px-4 py-3 flex items-center justify-between text-left transition active:scale-99 ${
            isSunMode ? 'hover:bg-stone-50' : 'hover:bg-stone-800/40'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                isSunMode
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-stone-800 text-amber-400'
              }`}
            >
              <Layers className="w-4 h-4" />
            </div>
            <span
              className={`text-xs font-extrabold uppercase tracking-wider ${
                isSunMode ? 'text-[#111827]' : 'text-stone-200'
              }`}
            >
              Ficha Técnica
            </span>
          </div>
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${
              specsOpen
                ? isSunMode
                  ? 'rotate-180 text-amber-800'
                  : 'rotate-180 text-amber-400'
                : isSunMode
                ? 'text-[#4B5563]'
                : 'text-stone-400'
            }`}
          />
        </button>

        {specsOpen && (
          <div
            className={`px-4 pb-4 pt-1 divide-y text-xs border-t ${
              isSunMode
                ? 'border-stone-200 divide-stone-200 bg-stone-50/50'
                : 'border-stone-800/60 divide-stone-800/60 bg-transparent'
            }`}
          >
            {specs.map((item, idx) => (
              <div key={idx} className="py-2.5 flex flex-col xs:flex-row xs:items-baseline justify-between gap-1">
                <span
                  className={`font-bold text-[11px] uppercase tracking-wider ${
                    isSunMode ? 'text-[#4B5563]' : 'text-stone-400'
                  }`}
                >
                  {item.label}
                </span>
                <span
                  className={`font-semibold text-xs text-right ${
                    isSunMode ? 'text-[#111827]' : 'text-stone-200'
                  }`}
                >
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Accordion 2: Preguntas Frecuentes */}
      <div
        className={`rounded-2xl border transition overflow-hidden ${
          isSunMode
            ? 'bg-white border-stone-300 shadow-xs'
            : 'bg-stone-900/80 border-stone-800 shadow-xs'
        }`}
      >
        <button
          id="accordion-faqs-toggle"
          onClick={() => setFaqsOpen(!faqsOpen)}
          className={`w-full min-h-[48px] px-4 py-3 flex items-center justify-between text-left transition active:scale-99 ${
            isSunMode ? 'hover:bg-stone-50' : 'hover:bg-stone-800/40'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                isSunMode
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-stone-800 text-amber-400'
              }`}
            >
              <HelpCircle className="w-4 h-4" />
            </div>
            <span
              className={`text-xs font-extrabold uppercase tracking-wider ${
                isSunMode ? 'text-[#111827]' : 'text-stone-200'
              }`}
            >
              Preguntas Frecuentes
            </span>
          </div>
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${
              faqsOpen
                ? isSunMode
                  ? 'rotate-180 text-amber-800'
                  : 'rotate-180 text-amber-400'
                : isSunMode
                ? 'text-[#4B5563]'
                : 'text-stone-400'
            }`}
          />
        </button>

        {faqsOpen && (
          <div
            className={`px-4 pb-4 pt-1 space-y-2.5 border-t ${
              isSunMode
                ? 'border-stone-200 bg-stone-50/50'
                : 'border-stone-800/60 bg-transparent'
            }`}
          >
            {faqs.map((faq, idx) => {
              const isItemOpen = expandedFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className={`rounded-xl border transition overflow-hidden ${
                    isSunMode
                      ? isItemOpen
                        ? 'bg-white border-amber-700/50 shadow-xs'
                        : 'bg-white border-stone-200'
                      : isItemOpen
                      ? 'bg-stone-950/80 border-amber-500/40'
                      : 'bg-stone-950/60 border-stone-800/80'
                  }`}
                >
                  <button
                    onClick={() => setExpandedFaqIndex(isItemOpen ? null : idx)}
                    className={`w-full min-h-[48px] p-3 text-left flex items-center justify-between gap-2 text-xs font-bold transition ${
                      isSunMode
                        ? isItemOpen
                          ? 'text-amber-950'
                          : 'text-[#111827] hover:text-amber-800'
                        : isItemOpen
                        ? 'text-amber-300'
                        : 'text-stone-200 hover:text-amber-400'
                    }`}
                  >
                    <span>{faq.question}</span>
                    <ChevronDown
                      className={`w-4 h-4 shrink-0 transition-transform ${
                        isItemOpen
                          ? isSunMode
                            ? 'rotate-180 text-amber-800'
                            : 'rotate-180 text-amber-400'
                          : isSunMode
                          ? 'text-[#4B5563]'
                          : 'text-stone-500'
                      }`}
                    />
                  </button>
                  {isItemOpen && (
                    <div
                      className={`px-3 pb-3 pt-0 text-xs leading-relaxed border-t mt-1 font-medium ${
                        isSunMode
                          ? 'text-[#111827] border-stone-100'
                          : 'text-stone-300 border-stone-800/40'
                      }`}
                    >
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
