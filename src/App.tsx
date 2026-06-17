import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Database,
  RefreshCw,
  Search,
  Calendar,
  ExternalLink,
  ChevronRight,
  ArrowLeft,
  X,
  Info,
  Layers,
  Sparkles,
  RefreshCcw,
  AlertTriangle,
  Lightbulb,
  Terminal,
  Settings,
  Flame,
  CheckCircle2,
  BookOpen
} from "lucide-react";
import { ReleaseNote, FeedResponse } from "./types";
import TwitterSharePanel from "./components/TwitterSharePanel";

function formatDate(dateStr: string): string {
  if (!dateStr) return "Recent";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export default function App() {
  const [notes, setNotes] = useState<ReleaseNote[]>([]);
  const [feedTitle, setFeedTitle] = useState("BigQuery Release Notes");
  const [feedUpdated, setFeedUpdated] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search & filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedNote, setSelectedNote] = useState<ReleaseNote | null>(null);
  
  // Mobile responsive layout state: either "list" view or "detail" view
  const [mobileView, setMobileView] = useState<"list" | "detail">("list");

  // Fetch release notes from fullstack Express endpoint
  const fetchNotes = async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const res = await fetch("/api/release-notes");
      if (!res.ok) {
        throw new Error(`Failed to load release notes: Server returned ${res.status}`);
      }
      
      const data: FeedResponse = await res.json();
      if (data.success) {
        setNotes(data.entries);
        setFeedTitle(data.feedTitle);
        setFeedUpdated(data.feedUpdated);
        
        // Default to select first note on desktop if none currently selected
        if (data.entries.length > 0 && !selectedNote) {
          setSelectedNote(data.entries[0]);
        }
      } else {
        throw new Error(data.error || "An error occurred while parsing the feed.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred while communicating with the server.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  // Compute stats based on the complete un-filtered dataset
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: notes.length,
      feature: 0,
      changed: 0,
      fixed: 0,
      deprecated: 0,
      announcement: 0,
    };
    notes.forEach((note) => {
      if (counts[note.category] !== undefined) {
        counts[note.category]++;
      } else {
        counts.announcement++;
      }
    });
    return counts;
  }, [notes]);

  // Handle Search and Category filters
  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      const matchesCategory = selectedCategory === "all" || note.category === selectedCategory;
      const cleanContent = note.content.toLowerCase();
      const cleanTitle = note.title.toLowerCase();
      const query = searchQuery.toLowerCase();
      const matchesSearch = cleanTitle.includes(query) || cleanContent.includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [notes, selectedCategory, searchQuery]);

  // Adjust selected note if it's no longer inside filtered listing
  useEffect(() => {
    if (selectedNote && !filteredNotes.some((n) => n.id === selectedNote.id)) {
      if (filteredNotes.length > 0) {
        setSelectedNote(filteredNotes[0]);
      } else {
        setSelectedNote(null);
      }
    }
  }, [filteredNotes, selectedNote]);

  const selectNote = (note: ReleaseNote) => {
    setSelectedNote(note);
    setMobileView("detail");
  };

  const getCategoryTheme = (category: string) => {
    switch (category) {
      case "feature":
        return {
          bg: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
          dot: "bg-emerald-500",
          label: "Feature",
          icon: Sparkles
        };
      case "changed":
        return {
          bg: "bg-indigo-50 text-indigo-700 border-indigo-200/60",
          dot: "bg-indigo-500",
          label: "Changed",
          icon: Layers
        };
      case "fixed":
        return {
          bg: "bg-sky-50 text-sky-700 border-sky-200/60",
          dot: "bg-sky-500",
          label: "Fixed",
          icon: CheckCircle2
        };
      case "deprecated":
        return {
          bg: "bg-rose-50 text-rose-700 border-rose-200/60",
          dot: "bg-rose-500",
          label: "Deprecated",
          icon: Flame
        };
      case "announcement":
      default:
        return {
          bg: "bg-amber-50 text-amber-700 border-amber-200/60",
          dot: "bg-amber-500",
          label: "Announcement",
          icon: Info
        };
    }
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] text-slate-800 font-sans selection:bg-gblue-100 flex flex-col">
      
      {/* Premium Header Bar */}
      <header className="bg-[#1e293b] text-white border-b border-slate-800 shadow-md shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4.5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 bg-gblue-500 text-white rounded-xl shadow-lg shadow-gblue-500/25 flex items-center justify-center">
              <Database className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display font-bold text-xl sm:text-2xl tracking-tight text-white">
                  BigQuery Release Notes
                </h1>
                <span className="hidden md:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase bg-gblue-600/50 text-gblue-200 border border-gblue-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-gblue-400 animate-ping"></span>
                  Live Sync
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1.5 font-sans flex items-center gap-1">
                <span>Official feed reader for BigQuery updates</span>
                {feedUpdated && (
                  <>
                    <span className="opacity-40">•</span>
                    <span className="text-slate-400 font-mono">Last Cloud Sync: {formatDate(feedUpdated)}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Sync Trigger and stats breakdown */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={() => fetchNotes(true)}
              disabled={refreshing || loading}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gblue-500 hover:bg-gblue-600 active:scale-98 transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              id="btn-feed-refresh"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-white" : ""}`} />
              <span>{refreshing ? "Fetching Cloud..." : "Refresh Feed"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Body Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6 overflow-hidden">
        
        {/* Error Notification Banner */}
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-3 shadow-xs shrink-0">
            <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-rose-900">Feed Connection Issue</h3>
              <p className="text-xs text-rose-700 mt-1 leading-relaxed">{error}</p>
            </div>
            <button
              onClick={() => fetchNotes()}
              className="px-3 py-1 bg-white border border-rose-200 text-rose-700 rounded-lg text-xs font-semibold hover:bg-rose-50 active:bg-rose-100 cursor-pointer transition-all"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Global Loading Spinner View */}
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 gap-4 shrink-0">
            <div className="relative flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-gblue-100 border-t-gblue-500 rounded-full animate-spin"></div>
              <Database className="w-4 h-4 text-gblue-500 absolute" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-800">Downloading Official Google Feed</p>
              <p className="text-xs text-slate-400 mt-1">Connecting to Cloud Platform Release Notes...</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden min-h-[500px]">
            
            {/* LEFT SIDE: Feed Listings & Search, toggled dynamically on mobile */}
            <section
              className={`flex-1 md:w-5/12 lg:w-4/12 flex flex-col gap-4 overflow-hidden ${
                mobileView === "detail" ? "hidden md:flex" : "flex"
              }`}
            >
              {/* Search input field */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-4.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search updates (e.g. storage, regional)..."
                  className="w-full pl-11 pr-10 py-3 bg-white border border-slate-200/80 rounded-xl text-sm placeholder:text-slate-400 focus:outline-hidden focus:border-gblue-500 focus:ring-1 focus:ring-gblue-400/20 shadow-xs transition-all"
                  id="search-input"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer p-0.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                    id="btn-clear-search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Advanced Category Pills Grid */}
              <div className="flex flex-wrap gap-1.5 shrink-0">
                {(["all", "feature", "changed", "fixed", "deprecated", "announcement"] as const).map((cat) => {
                  const isActive = selectedCategory === cat;
                  const count = categoryCounts[cat] || 0;
                  
                  // Label styles
                  let label = "All Updates";
                  let activeStyle = "bg-gblue-600 text-white shadow-md shadow-gblue-500/10";
                  let hoverStyle = "hover:bg-slate-100 text-slate-600";
                  
                  if (cat === "feature") {
                    label = "Features";
                    if (isActive) activeStyle = "bg-emerald-600 text-white shadow-md shadow-emerald-500/15";
                  } else if (cat === "changed") {
                    label = "Changes";
                    if (isActive) activeStyle = "bg-indigo-600 text-white shadow-md shadow-indigo-500/15";
                  } else if (cat === "fixed") {
                    label = "Fixes";
                    if (isActive) activeStyle = "bg-sky-600 text-white shadow-md shadow-sky-500/15";
                  } else if (cat === "deprecated") {
                    label = "Deprecations";
                    if (isActive) activeStyle = "bg-rose-600 text-white shadow-sm shadow-rose-500/15";
                  } else if (cat === "announcement") {
                    label = "Info";
                    if (isActive) activeStyle = "bg-amber-600 text-white shadow-sm shadow-amber-500/15";
                  }

                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all duration-150 flex items-center gap-1.5 border border-transparent ${
                        isActive ? activeStyle : `bg-white border-slate-200/50 ${hoverStyle}`
                      }`}
                      id={`btn-category-${cat}`}
                    >
                      <span>{label}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono leading-none ${
                          isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Action indicators */}
              <div className="flex justify-between items-center text-[11px] text-slate-400 font-mono tracking-wider uppercase px-1">
                <span>Matching Updates ({filteredNotes.length})</span>
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory("all");
                    }}
                    className="text-gblue-500 hover:underline cursor-pointer"
                  >
                    Reset Filter
                  </button>
                )}
              </div>

              {/* Feed List Items Container */}
              <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2.5">
                <AnimatePresence mode="popLayout">
                  {filteredNotes.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="p-8 bg-white border border-dashed border-slate-200 rounded-2xl text-center py-12 flex flex-col items-center gap-3"
                    >
                      <div className="p-3 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center">
                        <Terminal className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-700">No updates match filters</p>
                        <p className="text-xs text-slate-400 mt-1">Try adapting your search parameters or query text.</p>
                      </div>
                    </motion.div>
                  ) : (
                    filteredNotes.map((note) => {
                      const isSelected = selectedNote?.id === note.id;
                      const theme = getCategoryTheme(note.category);
                      const Icon = theme.icon;

                      return (
                        <motion.button
                          key={note.id}
                          layout="position"
                          onClick={() => selectNote(note)}
                          className={`w-full text-left p-4 rounded-xl border transition-all duration-200 flex flex-col gap-2 cursor-pointer relative overflow-hidden group ${
                            isSelected
                              ? "bg-white border-gblue-500 shadow-md ring-1 ring-gblue-500/25"
                              : "bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-xs hover:bg-slate-50/40"
                          }`}
                          id={`note-card-${note.id}`}
                        >
                          {/* Accent visual border line on selected item */}
                          {isSelected && (
                            <span className="absolute left-0 top-0 bottom-0 w-1 bg-gblue-500"></span>
                          )}

                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border flex items-center gap-1 ${theme.bg}`}
                            >
                              <Icon className="w-3 h-3" />
                              {theme.label}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(note.updated)}
                            </span>
                          </div>

                          <h4
                            className={`font-display font-bold text-sm leading-tight transition-colors line-clamp-2 ${
                              isSelected ? "text-slate-900" : "text-slate-800 group-hover:text-slate-900"
                            }`}
                          >
                            {note.title}
                          </h4>

                          {/* Quick HTML text snippet strip */}
                          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                            {note.content.replace(/<[^>]*>/g, "")}
                          </p>

                          <div className="flex items-center justify-end text-[11px] text-gblue-500 font-semibold group-hover:translate-x-1 transition-transform self-end pt-1">
                            <span>Open Details</span>
                            <ChevronRight className="w-3 h-3 ml-0.5" />
                          </div>
                        </motion.button>
                      );
                    })
                  )}
                </AnimatePresence>
              </div>
            </section>

            {/* RIGHT SIDE: Selected Detail and Twitter share section */}
            <section
              className={`flex-1 md:w-7/12 lg:w-8/12 flex-col gap-4 overflow-hidden ${
                mobileView === "detail" ? "flex" : "hidden md:flex"
              }`}
            >
              <AnimatePresence mode="wait">
                {selectedNote ? (
                  <motion.div
                    key={selectedNote.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex-1 flex flex-col gap-4 overflow-hidden"
                  >
                    {/* Back button for mobile view */}
                    <div className="md:hidden shrink-0">
                      <button
                        onClick={() => setMobileView("list")}
                        className="py-2.5 px-4 bg-white border border-slate-200 rounded-xl text-slate-700 text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-xs active:bg-slate-50"
                        id="btn-back-to-list"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        Back to release updates list
                      </button>
                    </div>

                    <div className="flex-1 bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden flex flex-col">
                      
                      {/* Note Details Header */}
                      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 shrink-0">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold border flex items-center gap-1 ${
                                getCategoryTheme(selectedNote.category).bg
                              }`}
                            >
                              {getCategoryTheme(selectedNote.category).label}
                            </span>
                            <span className="text-xs text-slate-400 font-mono flex items-center gap-1.5 ml-2">
                              <Calendar className="w-3.5 h-3.5" />
                              Published {formatDate(selectedNote.updated)}
                            </span>
                          </div>
                          
                          <h2 className="font-display font-bold text-slate-900 text-lg sm:text-xl leading-snug">
                            {selectedNote.title}
                          </h2>
                        </div>

                        <a
                          href={selectedNote.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-gblue-50 hover:bg-gblue-100 border border-gblue-200/50 text-gblue-600 rounded-xl text-xs font-semibold transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer hover:text-gblue-700 select-none shrink-0"
                          id="btn-open-original"
                        >
                          <span>Official Source</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>

                      {/* Render note HTML content */}
                      <div className="flex-1 overflow-y-auto p-6 sm:p-8">
                        <div
                          className="release-note-content"
                          dangerouslySetInnerHTML={{ __html: selectedNote.content }}
                        />
                      </div>
                    </div>

                    {/* Integrated Twitter Sharing Composer Card */}
                    <div className="shrink-0">
                      <TwitterSharePanel note={selectedNote} />
                    </div>

                  </motion.div>
                ) : (
                  <div className="flex-1 bg-white border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center p-8 py-20 text-center gap-4">
                    <div className="p-4 bg-gblue-50 text-gblue-500 rounded-2xl flex items-center justify-center">
                      <BookOpen className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="font-display font-semibold text-slate-800 text-base">Select an Update</h3>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                        To view detailed specs, code blocks, parameter listings, and prepare dynamic social tweets, pick a release update from the feed.
                      </p>
                    </div>
                  </div>
                )}
              </AnimatePresence>
            </section>

          </div>
        )}

      </main>

      {/* Humble Footer */}
      <footer className="bg-white border-t border-slate-100 py-3.5 text-center shrink-0">
        <p className="text-[11px] text-slate-400 font-mono uppercase tracking-wider">
          BigQuery Live Stream • Developed with React, Tailwind & Express
        </p>
      </footer>

    </div>
  );
}
