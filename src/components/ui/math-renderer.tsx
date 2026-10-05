"use client";

import React, { useMemo } from "react";
import katex from "katex";

interface MathRendererProps {
  content: string | null | undefined;
  className?: string;
  inline?: boolean;
}

/**
 * Intelligent Math / LaTeX Renderer for ExamCode School
 * Automatically recognizes:
 * 1. LaTeX delimiters: $...$, $$...$$, \(...\), \[...\]
 * 2. Standalone math expressions like 2\frac{1}{2} + 1\frac{2}{3} =
 * 3. Math symbols like \times, \div, \pm, \sqrt, \alpha, \beta, etc.
 */
export function MathRenderer({ content, className = "", inline = true }: MathRendererProps) {
  const renderedHtml = useMemo(() => {
    if (!content) return "";

    const text = String(content);

    // 1. Check if the text contains explicit LaTeX delimiters ($$, $, \(, \[) or common LaTeX commands (\frac, \sqrt, etc.)
    const hasLatexDelimiters = /\$\$[\s\S]+?\$\$|\$[^\$]+?\$|\\\[[\s\S]+?\\\]|\\\([^\)]+?\\\)/.test(text);
    const hasStandaloneCommands = /\\(frac|sqrt|times|div|pm|le|ge|neq|approx|sum|int|infty|alpha|beta|gamma|theta|pi|partial|cdot|degree|circ)/.test(text);

    if (!hasLatexDelimiters && !hasStandaloneCommands) {
      // Normal plain text without math
      return escapeHtml(text).replace(/\n/g, "<br/>");
    }

    // Process mixed text & LaTeX expressions
    return parseAndRenderMathText(text);
  }, [content]);

  if (!renderedHtml) return null;

  return (
    <span
      className={`math-rendered-content ${className}`}
      dangerouslySetInnerHTML={{ __html: renderedHtml }}
    />
  );
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderKatexSafe(mathCode: string, displayMode = false): string {
  try {
    return katex.renderToString(mathCode.trim(), {
      displayMode,
      throwOnError: false,
      output: "htmlAndMathml",
    });
  } catch (err) {
    return `<code>${escapeHtml(mathCode)}</code>`;
  }
}

function parseAndRenderMathText(fullText: string): string {
  // Regex matches explicit delimiters:
  // 1. $$ ... $$ (Display Math)
  // 2. $ ... $ (Inline Math)
  // 3. \[ ... \] (Display Math)
  // 4. \( ... \) (Inline Math)
  const explicitMathRegex = /(\$\$[\s\S]+?\$\$|\$(?!\s)[^\$\n]+?(?<!\s)\$|\\\[[\s\S]+?\\\]|\\\([^\)]+?\\\))/g;

  if (explicitMathRegex.test(fullText)) {
    return fullText
      .split(explicitMathRegex)
      .map((chunk) => {
        if (!chunk) return "";

        // Display math $$ ... $$
        if (chunk.startsWith("$$") && chunk.endsWith("$$")) {
          const math = chunk.slice(2, -2);
          return `<div class="my-2 text-center overflow-x-auto">${renderKatexSafe(math, true)}</div>`;
        }

        // Display math \[ ... \]
        if (chunk.startsWith("\\[") && chunk.endsWith("\\]")) {
          const math = chunk.slice(2, -2);
          return `<div class="my-2 text-center overflow-x-auto">${renderKatexSafe(math, true)}</div>`;
        }

        // Inline math $ ... $
        if (chunk.startsWith("$") && chunk.endsWith("$")) {
          const math = chunk.slice(1, -1);
          return renderKatexSafe(math, false);
        }

        // Inline math \( ... \)
        if (chunk.startsWith("\\(") && chunk.endsWith("\\)")) {
          const math = chunk.slice(2, -2);
          return renderKatexSafe(math, false);
        }

        // Check if plain text part has standalone LaTeX commands (e.g. 2\frac{1}{2} + 1\frac{2}{3} =)
        return renderStandaloneFormulasInText(chunk);
      })
      .join("");
  }

  // No explicit delimiters, but contains LaTeX commands
  return renderStandaloneFormulasInText(fullText);
}

function renderStandaloneFormulasInText(text: string): string {
  if (!/\\(frac|sqrt|times|div|pm|le|ge|neq|approx|sum|int|infty|alpha|beta|gamma|theta|pi|partial|cdot|degree|circ)/.test(text)) {
    return escapeHtml(text).replace(/\n/g, "<br/>");
  }

  // Split lines
  return text
    .split("\n")
    .map((line) => {
      // If line has no LaTeX command, just escape HTML
      if (!/\\(frac|sqrt|times|div|pm|le|ge|neq|approx|sum|int|infty|alpha|beta|gamma|theta|pi|partial|cdot|degree|circ)/.test(line)) {
        return escapeHtml(line);
      }

      // If the line is almost purely a formula (e.g. "2\frac{1}{2} + 1\frac{2}{3} =" or "\frac{a}{b}")
      const isPureFormula = !/[a-zA-Z]{4,}/.test(line.replace(/\\(frac|sqrt|times|div|pm|le|ge|neq|approx|sum|int|infty|alpha|beta|gamma|theta|pi|partial|cdot|degree|circ)/g, ""));
      if (isPureFormula) {
        return renderKatexSafe(line, false);
      }

      // If line mixes Indonesian/English words with math formulas:
      // Match mathematical formula chunks (tokens containing backslash or numbers/operators adjacent to backslash)
      // Example: "Berapakah hasil dari 2\frac{1}{2} + 1\frac{2}{3} = ?"
      const formulaPattern = /((?:(?:\d+\s*)?\\[a-zA-Z]+(?:\{[^{}]*\}|\[[^\[\]]*\]|[0-9a-zA-Z]*)*(?:[\s\+\-\*\/\=\(\)]*(?:\d+(?:\/\d+)?|\\[a-zA-Z]+(?:\{[^{}]*\}|\[[^\[\]]*\]|[0-9a-zA-Z]*)*|\w+))*)+)/g;

      return line.split(formulaPattern).map((segment) => {
        if (!segment) return "";
        if (/\\(frac|sqrt|times|div|pm|le|ge|neq|approx|sum|int|infty|alpha|beta|gamma|theta|pi|partial|cdot|degree|circ)/.test(segment)) {
          return renderKatexSafe(segment, false);
        }
        return escapeHtml(segment);
      }).join("");
    })
    .join("<br/>");
}
