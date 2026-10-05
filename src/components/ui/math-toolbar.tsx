"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { MathRenderer } from "@/components/ui/math-renderer";
import { Calculator, Sparkles, ChevronDown, ChevronUp, Eye } from "lucide-react";

interface MathToolbarProps {
  onInsert: (code: string) => void;
  previewText?: string;
  label?: string;
}

const MATH_SHORTCUTS = [
  { label: "Pecahan", preview: "\\frac{a}{b}", code: "\\frac{1}{2}" },
  { label: "Pecahan Campuran", preview: "2\\frac{1}{2}", code: "2\\frac{1}{2}" },
  { label: "Pangkat", preview: "x^2", code: "x^{2}" },
  { label: "Akar", preview: "\\sqrt{x}", code: "\\sqrt{4}" },
  { label: "Perkalian (×)", preview: "\\times", code: "\\times" },
  { label: "Pembagian (÷)", preview: "\\div", code: "\\div" },
  { label: "Plus Minus (±)", preview: "\\pm", code: "\\pm" },
  { label: "Tidak Sama (≠)", preview: "\\neq", code: "\\neq" },
  { label: "Kurang Sama (≤)", preview: "\\le", code: "\\le" },
  { label: "Lebih Sama (≥)", preview: "\\ge", code: "\\ge" },
  { label: "Derajat (°)", preview: "^\\circ", code: "^\\circ" },
  { label: "Pi (π)", preview: "\\pi", code: "\\pi" },
  { label: "Alpha (α)", preview: "\\alpha", code: "\\alpha" },
  { label: "Beta (β)", preview: "\\beta", code: "\\beta" },
  { label: "Theta (θ)", preview: "\\theta", code: "\\theta" },
  { label: "Tak Hingga (∞)", preview: "\\infty", code: "\\infty" },
];

export function MathToolbar({ onInsert, previewText, label = "Bantuan Simbol Matematika / Rumus" }: MathToolbarProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="rounded-xl border border-[#D5EFA9] bg-[#F9FCF5] p-2 text-xs space-y-2">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 font-bold text-[#4B7914] hover:text-[#385C0E] transition-colors cursor-pointer"
        >
          <Calculator className="h-3.5 w-3.5 text-[#7AB82A]" />
          <span>{label}</span>
          {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>

        {previewText && (
          <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500">
            <Eye className="h-3 w-3 text-slate-400" />
            <span>Pratinjau Rumus:</span>
            <span className="bg-white px-2 py-0.5 rounded border border-slate-200 font-medium text-slate-800 inline-block min-w-[24px]">
              <MathRenderer content={previewText} />
            </span>
          </div>
        )}
      </div>

      {isOpen && (
        <div className="pt-2 border-t border-[#E2F5C8] space-y-2">
          <p className="text-[11px] text-slate-600">
            Klik tombol di bawah untuk memasukkan rumus matematika langsung ke dalam teks:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {MATH_SHORTCUTS.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onInsert(item.code)}
                title={`Sisipkan ${item.label} (${item.code})`}
                className="px-2.5 py-1 bg-white hover:bg-[#EBF7D9] border border-[#D5EFA9] rounded-lg text-xs font-semibold text-slate-800 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
              >
                <span className="text-[11px] text-slate-500 font-bold">{item.label}:</span>
                <span className="font-bold text-[#4B7914]">
                  <MathRenderer content={`$${item.preview}$`} />
                </span>
              </button>
            ))}
          </div>
          <div className="text-[10px] text-slate-400 pt-1">
            💡 <b>Tips:</b> Anda dapat menulis format persamaan LaTeX seperti <code>2\frac&#123;1&#125;&#123;2&#125; + 1\frac&#123;2&#125;&#123;3&#125; =</code> atau membungkusnya dengan tanda dolar <code>$2\frac&#123;1&#125;&#123;2&#125;$</code>.
          </div>
        </div>
      )}
    </div>
  );
}
