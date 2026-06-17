import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Twitter, ArrowUpRight, Copy, Check, Sparkles, MessageSquare, AlertCircle } from "lucide-react";
import { ReleaseNote } from "../types";

interface TwitterSharePanelProps {
  note: ReleaseNote;
}

function stripHtml(html: string): string {
  if (!html) return "";
  // Strip tags
  let text = html.replace(/<[^>]*>/g, "");
  // Decode common HTML entities
  text = text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
  // Clean up whitespace
  return text.replace(/\s+/g, " ").trim();
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return dateStr;
  }
}

export default function TwitterSharePanel({ note }: TwitterSharePanelProps) {
  const [draft, setDraft] = useState("");
  const [activePreset, setActivePreset] = useState<"professional" | "excited" | "alert">("professional");
  const [copied, setCopied] = useState(false);
  const maxChars = 280;

  const strippedDesc = stripHtml(note.content);
  const formattedDate = formatDate(note.updated);

  // Generate draft based on activePreset and current note
  useEffect(() => {
    // Truncate stripped description to make room for hashtags and link
    const words = strippedDesc.split(" ");
    let snippet = strippedDesc;
    if (snippet.length > 120) {
      snippet = snippet.substring(0, 115) + "...";
    }

    let rawText = "";

    switch (activePreset) {
      case "excited":
        rawText = `🚀 BigQuery announced an exciting update on ${formattedDate}!\n\n"${note.title}"\n\n📌 Check out what's new: ${note.link} #BigQuery #GoogleCloud #DataAnalytics`;
        break;
      case "alert":
        rawText = `⚠️ Stay Informed: Google Cloud BigQuery Release Update (${formattedDate})\n\n"${note.title}"\n\n🔍 Details inside: ${note.link} #BigQuery #DataEngineering #GoogleCloud`;
        break;
      case "professional":
      default:
        rawText = `Google Cloud BigQuery Update (${formattedDate}):\n"${note.title}"\n\n${snippet}\n\n👉 Learn more: ${note.link} #BigQuery #GoogleCloud`;
        break;
    }

    // Limit to max chars if generated text exceeds 280
    if (rawText.length > maxChars) {
      rawText = rawText.substring(0, maxChars - 3) + "...";
    }

    setDraft(rawText);
  }, [note, activePreset]);

  const handleShare = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(draft)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(draft);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  const remaining = maxChars - draft.length;
  const isOver = remaining < 0;

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-semibold text-slate-900 flex items-center gap-2 text-lg">
          <Twitter className="w-5 h-5 text-sky-500 fill-current" />
          Tweet This Update
        </h3>
        <span className="text-xs text-slate-400 font-mono">Draft Composer</span>
      </div>

      {/* Preset Pickers */}
      <div className="grid grid-cols-3 gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
        <button
          onClick={() => setActivePreset("professional")}
          className={`py-1.5 px-3 rounded-lg text-xs font-medium cursor-pointer transition-all duration-150 flex items-center justify-center gap-1.5 ${
            activePreset === "professional"
              ? "bg-white text-slate-900 shadow-sm border border-slate-200"
              : "text-slate-500 hover:text-slate-800"
          }`}
          id="btn-tweet-preset-pro"
        >
          <Sparkles className="w-3.5 h-3.5 text-gblue-500" />
          Professional
        </button>
        <button
          onClick={() => setActivePreset("excited")}
          className={`py-1.5 px-3 rounded-lg text-xs font-medium cursor-pointer transition-all duration-150 flex items-center justify-center gap-1.5 ${
            activePreset === "excited"
              ? "bg-white text-slate-900 shadow-sm border border-slate-200"
              : "text-slate-500 hover:text-slate-800"
          }`}
          id="btn-tweet-preset-excited"
        >
          <MessageSquare className="w-3.5 h-3.5 text-orange-500" />
          Technical
        </button>
        <button
          onClick={() => setActivePreset("alert")}
          className={`py-1.5 px-3 rounded-lg text-xs font-medium cursor-pointer transition-all duration-150 flex items-center justify-center gap-1.5 ${
            activePreset === "alert"
              ? "bg-white text-slate-900 shadow-sm border border-slate-200"
              : "text-slate-500 hover:text-slate-800"
          }`}
          id="btn-tweet-preset-alert"
        >
          <AlertCircle className="w-3.5 h-3.5 text-yellow-500" />
          Direct Alert
        </button>
      </div>

      {/* Custom Composer area */}
      <div className="relative">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={5}
          maxLength={350}
          className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm text-slate-800 focus:outline-hidden focus:bg-white transition-all resize-none font-sans ${
            isOver
              ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500/20"
              : "border-slate-200 focus:border-gblue-500 focus:ring-1 focus:ring-gblue-500/20"
          }`}
          placeholder="Compose your custom tweet..."
          id="textarea-tweet-draft"
        />

        {/* Floating character counter element */}
        <div className="absolute bottom-3 right-3 flex items-center gap-3">
          <span
            className={`text-xs font-mono font-medium ${
              isOver ? "text-red-500" : remaining <= 20 ? "text-amber-500" : "text-slate-400"
            }`}
          >
            {remaining}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleCopy}
          disabled={!draft}
          className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 hover:border-slate-300 active:bg-slate-50 text-slate-700 bg-white hover:bg-slate-50 text-sm font-medium transition-all duration-150 cursor-pointer flex items-center justify-center gap-2"
          id="btn-tweet-copy"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-500" />
              <span className="text-emerald-600">Copied text!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 text-slate-500" />
              <span>Copy Draft</span>
            </>
          )}
        </button>

        <button
          onClick={handleShare}
          disabled={!draft || isOver}
          className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all duration-200 shadow-sm flex items-center justify-center gap-2 cursor-pointer group"
          id="btn-tweet-share"
        >
          <Twitter className="w-4 h-4 text-sky-400 fill-current" />
          <span>Post to Twitter</span>
          <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </button>
      </div>

      {isOver && (
        <div className="p-3 bg-red-50 rounded-xl border border-red-100 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <p className="text-xs text-red-700 leading-relaxed">
            Your tweet exceeds Twitter's standard 280-character limit. Please trim some text to post directly!
          </p>
        </div>
      )}
    </div>
  );
}
