
"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

export type Option = { id: string; name: string };

export default function IngredientPicker({
  options,
  value,
  onChange,
  placeholder = "Search ingredient…",
  disabled = false,
  className = ""
}: {
  options: Option[];
  value?: string;
  onChange: (id: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = useMemo(
    () => options.find(o => o.id === value),
    [options, value]
  );

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return options.slice(0, 200);
    return options.filter(o =>
      o.name.toLowerCase().includes(s) || o.id.toLowerCase().includes(s)
    ).slice(0, 200);
  }, [options, q]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!panelRef.current || !btnRef.current) return;
      const t = e.target as Node;
      if (!panelRef.current.contains(t) && !btnRef.current.contains(t)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0);
    } else {
      setQ("");
    }
  }, [open]);

  function handleKey(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Escape") { setOpen(false); }
  }

  return (
    <div className={`relative ${className}`} onKeyDown={handleKey}>
      <button
        ref={btnRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        className="w-full inline-flex items-center justify-between rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm hover:border-zinc-500 disabled:opacity-50"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate text-left">{selected ? selected.name : "Select ingredient…"}</span>
        <ChevronDown className="ml-2 h-4 w-4 opacity-70" />
      </button>

      {open && (
        <div
          ref={panelRef}
          className="absolute z-50 mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900 shadow-lg"
          role="listbox"
        >
          <div className="p-2 border-b border-zinc-700">
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={placeholder}
              className="w-full rounded-md bg-zinc-950 px-2 py-1.5 text-sm outline-none"
            />
          </div>
          <div className="max-h-64 overflow-auto">
            {filtered.length === 0 && (
              <div className="px-3 py-2 text-sm text-zinc-400">No matches</div>
            )}
            {filtered.map(o => (
              <button
                key={o.id}
                type="button"
                role="option"
                aria-selected={o.id === value}
                onClick={() => { onChange(o.id); setOpen(false); }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-zinc-800 ${o.id===value ? "bg-zinc-800" : ""}`}
              >
                <div className="truncate">{o.name}</div>
                <div className="text-xs opacity-60 truncate">{o.id}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
