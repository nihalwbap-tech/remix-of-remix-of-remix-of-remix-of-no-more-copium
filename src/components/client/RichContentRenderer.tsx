import React from "react";
import { cn } from "@/lib/utils";

interface RichContentRendererProps {
  content: string;
  className?: string;
}

/**
 * Parses markdown-like text into accessible React elements:
 * - Bold (**text** or __text__)
 * - Italic (*text* or _text_)
 * - Branded Links ([text](url)) in signature Netflix Red (#E50910) opening in new tabs
 * - Headings (# H1, ## H2, ### H3, #### H4)
 * - Blockquotes / Coach Callouts (> text)
 * - Bullet lists (- item or * item)
 * - Numbered lists (1. item)
 */
export function RichContentRenderer({ content, className }: RichContentRendererProps) {
  if (!content) return null;

  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];

  let currentList: { type: "ul" | "ol"; items: string[] } | null = null;

  const flushList = () => {
    if (!currentList) return;
    if (currentList.type === "ul") {
      elements.push(
        <ul
          key={`ul-${elements.length}`}
          className="my-3.5 space-y-2 pl-5 text-[1rem] leading-relaxed text-foreground/90 list-disc marker:text-primary"
        >
          {currentList.items.map((item, idx) => (
            <li key={idx} className="pl-1">
              {renderInlineFormatting(item)}
            </li>
          ))}
        </ul>,
      );
    } else {
      elements.push(
        <ol
          key={`ol-${elements.length}`}
          className="my-3.5 space-y-2 pl-5 text-[1rem] leading-relaxed text-foreground/90 list-decimal marker:text-primary marker:font-bold"
        >
          {currentList.items.map((item, idx) => (
            <li key={idx} className="pl-1">
              {renderInlineFormatting(item)}
            </li>
          ))}
        </ol>,
      );
    }
    currentList = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    if (!line) {
      flushList();
      continue;
    }

    // Headings
    if (line.startsWith("#### ")) {
      flushList();
      elements.push(
        <h4
          key={`h4-${i}`}
          className="mt-6 mb-2 text-base font-bold tracking-tight text-foreground"
        >
          {renderInlineFormatting(line.slice(5))}
        </h4>,
      );
      continue;
    }

    if (line.startsWith("### ")) {
      flushList();
      elements.push(
        <h3
          key={`h3-${i}`}
          className="mt-7 mb-2.5 text-lg font-bold tracking-tight text-foreground sm:text-xl"
        >
          {renderInlineFormatting(line.slice(4))}
        </h3>,
      );
      continue;
    }

    if (line.startsWith("## ")) {
      flushList();
      elements.push(
        <h2
          key={`h2-${i}`}
          className="mt-8 mb-3 text-xl font-bold tracking-tight text-foreground sm:text-2xl"
        >
          {renderInlineFormatting(line.slice(3))}
        </h2>,
      );
      continue;
    }

    if (line.startsWith("# ")) {
      flushList();
      elements.push(
        <h1
          key={`h1-${i}`}
          className="mt-8 mb-4 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl"
        >
          {renderInlineFormatting(line.slice(2))}
        </h1>,
      );
      continue;
    }

    // Blockquote / Coach Tip Callout
    if (line.startsWith("> ")) {
      flushList();
      elements.push(
        <blockquote
          key={`quote-${i}`}
          className="my-4 rounded-r-xl border-l-4 border-primary bg-primary/10 px-4 py-3.5 text-[0.9375rem] font-medium leading-relaxed text-foreground"
        >
          {renderInlineFormatting(line.slice(2))}
        </blockquote>,
      );
      continue;
    }

    // Bullet List (- or *)
    if (line.startsWith("- ") || line.startsWith("* ")) {
      if (!currentList || currentList.type !== "ul") {
        flushList();
        currentList = { type: "ul", items: [] };
      }
      currentList.items.push(line.slice(2));
      continue;
    }

    // Numbered List (1. , 2. )
    const olMatch = line.match(/^\d+\.\s+(.*)$/);
    if (olMatch) {
      if (!currentList || currentList.type !== "ol") {
        flushList();
        currentList = { type: "ol", items: [] };
      }
      currentList.items.push(olMatch[1]);
      continue;
    }

    // Regular Paragraph
    flushList();
    elements.push(
      <p
        key={`p-${i}`}
        className="my-3 text-[1rem] leading-relaxed text-foreground/90 sm:text-[1.0625rem]"
      >
        {renderInlineFormatting(line)}
      </p>,
    );
  }

  flushList();

  return <div className={cn("space-y-1 text-left", className)}>{elements}</div>;
}

/**
 * Parses bold (**text**), italic (*text*), and branded links ([text](url)) inside a line.
 */
function renderInlineFormatting(text: string): React.ReactNode {
  // Tokenize regex matching links [text](url), bold **text**, and italic *text*
  const pattern = /(!?\[([^\]]+)\]\(([^)]+)\))|(\*\*([^*]+)\*\*)|(\*([^*]+)\*)/g;
  const parts: React.ReactNode[] = [];
  let lastIdx = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIdx) {
      parts.push(text.substring(lastIdx, match.index));
    }

    if (match[1]) {
      // Link: [anchor](url)
      const linkText = match[2];
      const linkUrl = match[3];
      parts.push(
        <a
          key={`link-${match.index}`}
          href={linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-primary underline underline-offset-4 decoration-primary/60 hover:text-primary/80 hover:decoration-primary transition-colors"
        >
          {linkText}
        </a>,
      );
    } else if (match[4]) {
      // Bold: **text**
      parts.push(
        <strong key={`bold-${match.index}`} className="font-bold text-foreground">
          {match[5]}
        </strong>,
      );
    } else if (match[6]) {
      // Italic: *text*
      parts.push(
        <em key={`italic-${match.index}`} className="italic text-foreground/95">
          {match[7]}
        </em>,
      );
    }

    lastIdx = pattern.lastIndex;
  }

  if (lastIdx < text.length) {
    parts.push(text.substring(lastIdx));
  }

  return parts.length === 0 ? text : parts;
}
