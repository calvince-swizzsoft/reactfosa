import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FiClock, FiCornerDownLeft, FiSearch } from "react-icons/fi";
import { useAuth } from "@/context/AuthContext";
import { useModuleTree } from "@/context/ModuleTreeContext";
import { moduleRouteMap } from "@/lib/moduleRouteMap";

const MAX_RESULTS = 10;
const MAX_RECENT = 6;

const SYNONYMS = {
  coa: ["chart of accounts", "general ledger", "gl account"],
  member: ["customer", "registry"],
  members: ["customers", "registry"],
  staff: ["employee", "human resource"],
  hr: ["human resource", "employee"],
  teller: ["cash", "front office", "fosa"],
  fosa: ["front office", "teller", "cash"],
  payroll: ["salary", "employee"],
  period: ["posting period", "fiscal period"],
  bank: ["bank linkage", "bank reconciliation"],
  loan: ["loaning", "credit", "loan case"],
};

function flattenBuiltPages(nodes, parents = []) {
  return nodes.flatMap((node) => {
    const breadcrumb = [...parents, node.Description].filter(Boolean);
    const children = node.Children || [];
    if (children.length) return flattenBuiltPages(children, breadcrumb);

    const path = moduleRouteMap[node.Code];
    if (!path) return [];
    return [{ code: node.Code, label: node.Description || "Untitled page", path, breadcrumb }];
  });
}

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function expandedQuery(query) {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  return [normalize(query), ...words.flatMap((word) => SYNONYMS[word] || [])].filter(Boolean);
}

function scorePage(page, terms) {
  const label = normalize(page.label);
  const path = normalize(page.path).replaceAll("/", " ");
  const context = normalize(page.breadcrumb.join(" "));
  let score = 0;

  terms.forEach((term, index) => {
    const weight = index === 0 ? 4 : 1;
    if (label === term) score += 100 * weight;
    else if (label.startsWith(term)) score += 50 * weight;
    else if (label.includes(term)) score += 30 * weight;
    if (context.includes(term)) score += 12 * weight;
    if (path.includes(term)) score += 8 * weight;
    if (String(page.code).includes(term)) score += 5 * weight;
  });

  return score;
}

function readRecent(key, pagesByPath) {
  try {
    const stored = JSON.parse(localStorage.getItem(key));
    return Array.isArray(stored) ? stored.map((path) => pagesByPath.get(path)).filter(Boolean) : [];
  } catch {
    return [];
  }
}

export default function GlobalSearch() {
  const navigate = useNavigate();
  const location = useLocation();
  const { tree, loading } = useModuleTree();
  const { userName } = useAuth();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  const pages = useMemo(() => flattenBuiltPages(tree), [tree]);
  const pagesByPath = useMemo(() => new Map(pages.map((page) => [page.path, page])), [pages]);
  const recentKey = `globalSearchRecent:${userName || "anonymous"}`;
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    setRecent(readRecent(recentKey, pagesByPath));
  }, [recentKey, pagesByPath]);

  useEffect(() => {
    const page = pagesByPath.get(location.pathname);
    if (!page) return;
    setRecent((current) => {
      const next = [page, ...current.filter((item) => item.path !== page.path)].slice(0, MAX_RECENT);
      localStorage.setItem(recentKey, JSON.stringify(next.map((item) => item.path)));
      return next;
    });
  }, [location.pathname, pagesByPath, recentKey]);

  useEffect(() => {
    const handleShortcut = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
        requestAnimationFrame(() => inputRef.current?.focus());
      }
      if (event.key === "Escape") setOpen(false);
    };
    const handlePointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("keydown", handleShortcut);
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("keydown", handleShortcut);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);

  const results = useMemo(() => {
    if (!query.trim()) return recent;
    const terms = expandedQuery(query);
    return pages
      .map((page) => ({ page, score: scorePage(page, terms) }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score || a.page.label.localeCompare(b.page.label))
      .slice(0, MAX_RESULTS)
      .map((entry) => entry.page);
  }, [pages, query, recent]);

  useEffect(() => setActiveIndex(0), [query, open]);

  const openPage = (page) => {
    if (!page) return;
    setQuery("");
    setOpen(false);
    navigate(page.path);
  };

  const handleKeyDown = (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter" && results[activeIndex]) {
      event.preventDefault();
      openPage(results[activeIndex]);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-xl">
      <div className="flex items-center rounded-md bg-indigo-700 px-2 py-1 focus-within:ring-2 focus-within:ring-white/70">
        <FiSearch className="mr-2 shrink-0 text-gray-100" aria-hidden="true" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(event) => { setQuery(event.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Find a page or action..."
          aria-label="Search application pages"
          aria-expanded={open}
          aria-controls="global-search-results"
          className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder-gray-300"
        />
        <kbd className="hidden rounded border border-indigo-400 bg-indigo-800 px-1.5 py-0.5 text-[10px] text-indigo-100 sm:inline">Ctrl K</kbd>
      </div>

      {open && (
        <div id="global-search-results" className="absolute left-1/2 top-full z-50 mt-2 w-[min(36rem,calc(100vw-2rem))] -translate-x-1/2 overflow-hidden rounded-xl border border-gray-200 bg-white text-gray-800 shadow-2xl">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
            <span>{query.trim() ? "Pages" : "Recent"}</span>
            <span>{loading ? "Loading navigation..." : `${pages.length} available`}</span>
          </div>

          {results.length ? (
            <div className="max-h-80 overflow-y-auto p-2" role="listbox">
              {results.map((page, index) => (
                <button
                  key={`${page.code}-${page.path}`}
                  type="button"
                  role="option"
                  aria-selected={index === activeIndex}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => openPage(page)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left ${index === activeIndex ? "bg-indigo-50 text-indigo-800" : "hover:bg-gray-50"}`}
                >
                  {query.trim() ? <FiSearch className="shrink-0 text-indigo-500" /> : <FiClock className="shrink-0 text-gray-400" />}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{page.label}</span>
                    <span className="block truncate text-xs text-gray-500">{page.breadcrumb.slice(0, -1).join(" / ")}</span>
                  </span>
                  {index === activeIndex && <FiCornerDownLeft className="shrink-0 text-gray-400" aria-hidden="true" />}
                </button>
              ))}
            </div>
          ) : (
            <div className="px-6 py-10 text-center text-sm text-gray-500">
              {loading ? "Loading your permitted pages..." : query.trim() ? `No permitted pages match “${query.trim()}”.` : "Pages you visit will appear here."}
            </div>
          )}

          <div className="border-t border-gray-100 bg-gray-50 px-4 py-2 text-xs text-gray-500">
            Use ↑ ↓ to select, Enter to open, and Esc to close.
          </div>
        </div>
      )}
    </div>
  );
}
