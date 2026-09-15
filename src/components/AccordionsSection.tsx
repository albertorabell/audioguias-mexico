import React, { useState } from 'react';
import { ChevronDown, FileText, HelpCircle, Layers } from 'lucide-react';
import { SpecItem, FaqItem } from '../types';

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

  return (
    <div className="space-y-3">
      {/* Accordion 1: Ficha Técnica */}
      <div className="rounded-2xl border border-stone-800 bg-stone-900/80 overflow-hidden shadow-xs">
        <button
          id="accordion-specs-toggle"
          onClick={() => setSpecsOpen(!specsOpen)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-stone-800/40 transition"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-stone-800 flex items-center justify-center text-amber-400">
              <Layers className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-stone-200">
              Ficha Técnica
            </span>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-stone-400 transition-transform duration-200 ${
              specsOpen ? 'rotate-180 text-amber-400' : ''
            }`}
          />
        </button>

        {specsOpen && (
          <div className="px-4 pb-4 pt-1 border-t border-stone-800/60 divide-y divide-stone-800/60 text-xs">
            {specs.map((item, idx) => (
              <div key={idx} className="py-2.5 flex flex-col xs:flex-row xs:items-baseline justify-between gap-1">
                <span className="font-semibold text-stone-400 text-[11px] uppercase tracking-wider">
                  {item.label}
                </span>
                <span className="text-stone-200 font-medium text-right text-xs">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Accordion 2: Preguntas Frecuentes */}
      <div className="rounded-2xl border border-stone-800 bg-stone-900/80 overflow-hidden shadow-xs">
        <button
          id="accordion-faqs-toggle"
          onClick={() => setFaqsOpen(!faqsOpen)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-stone-800/40 transition"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-stone-800 flex items-center justify-center text-amber-400">
              <HelpCircle className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-stone-200">
              Preguntas Frecuentes
            </span>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-stone-400 transition-transform duration-200 ${
              faqsOpen ? 'rotate-180 text-amber-400' : ''
            }`}
          />
        </button>

        {faqsOpen && (
          <div className="px-4 pb-4 pt-1 border-t border-stone-800/60 space-y-2.5">
            {faqs.map((faq, idx) => {
              const isItemOpen = expandedFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="rounded-xl bg-stone-950/60 border border-stone-800/80 overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedFaqIndex(isItemOpen ? null : idx)}
                    className="w-full p-3 text-left flex items-center justify-between gap-2 text-xs font-bold text-stone-200 hover:text-amber-400 transition"
                  >
                    <span>{faq.question}</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-stone-400 shrink-0 transition-transform ${
                        isItemOpen ? 'rotate-180 text-amber-400' : ''
                      }`}
                    />
                  </button>
                  {isItemOpen && (
                    <div className="px-3 pb-3 pt-0 text-xs text-stone-300 leading-relaxed border-t border-stone-800/40 mt-1">
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
