"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { MapPin, Search, Loader2, X } from "lucide-react";

interface NominatimResult {
    place_id: number;
    display_name: string;
    lat: string;
    lon: string;
    type: string;
    address?: {
        city?: string;
        town?: string;
        village?: string;
        state?: string;
        country?: string;
    };
}

interface LocationSearchInputProps {
    value: string;
    onChange: (value: string) => void;
    onSelectLocation: (location: { name: string; lat: number; lng: number }) => void;
    placeholder?: string;
    label?: string;
    error?: string;
}

export default function LocationSearchInput({
    value,
    onChange,
    onSelectLocation,
    placeholder = "Cari lokasi...",
    label,
    error,
}: LocationSearchInputProps) {
    const [query, setQuery] = useState(value);
    const [results, setResults] = useState<NominatimResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Sync external value
    useEffect(() => {
        setQuery(value);
    }, [value]);

    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const searchLocation = useCallback(async (searchQuery: string) => {
        if (searchQuery.trim().length < 3) {
            setResults([]);
            setIsOpen(false);
            return;
        }

        setIsSearching(true);
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=id&limit=6&addressdetails=1`,
                {
                    headers: {
                        "Accept-Language": "id",
                    },
                }
            );
            const data: NominatimResult[] = await res.json();
            setResults(data);
            setIsOpen(data.length > 0);
            setHighlightedIndex(-1);
        } catch (err) {
            console.error("Geocoding error:", err);
            setResults([]);
        } finally {
            setIsSearching(false);
        }
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setQuery(val);
        onChange(val);

        // Debounce search
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            searchLocation(val);
        }, 400);
    };

    const handleSelect = (result: NominatimResult) => {
        // Extract a clean name from the result
        const parts = result.display_name.split(",");
        const cleanName = parts[0].trim();

        setQuery(cleanName);
        onChange(cleanName);
        onSelectLocation({
            name: cleanName,
            lat: parseFloat(result.lat),
            lng: parseFloat(result.lon),
        });
        setIsOpen(false);
        setResults([]);
        inputRef.current?.blur();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen || results.length === 0) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlightedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
        } else if (e.key === "Enter") {
            e.preventDefault();
            if (highlightedIndex >= 0 && highlightedIndex < results.length) {
                handleSelect(results[highlightedIndex]);
            }
        } else if (e.key === "Escape") {
            setIsOpen(false);
        }
    };

    const handleClear = () => {
        setQuery("");
        onChange("");
        setResults([]);
        setIsOpen(false);
        inputRef.current?.focus();
    };

    const formatDisplayName = (result: NominatimResult) => {
        const parts = result.display_name.split(",");
        const main = parts[0].trim();
        const sub = parts.slice(1, 3).map((p) => p.trim()).join(", ");
        return { main, sub };
    };

    return (
        <div ref={containerRef} className="relative">
            {label && (
                <label className="text-sm font-medium text-slate-700 block mb-1.5">{label}</label>
            )}
            <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10">
                    {isSearching ? (
                        <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                    ) : (
                        <Search className="w-4 h-4" />
                    )}
                </div>
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => {
                        if (results.length > 0) setIsOpen(true);
                    }}
                    className={`w-full border rounded-lg pl-9 pr-9 py-2 text-sm uppercase focus:outline-none focus:ring-2 transition-colors ${error
                            ? "border-red-300 focus:ring-red-500"
                            : "border-slate-300 focus:ring-blue-500 focus:border-blue-400"
                        }`}
                    placeholder={placeholder}
                    autoComplete="off"
                />
                {query && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors z-10"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}

            {/* Dropdown Results */}
            {isOpen && results.length > 0 && (
                <div className="absolute z-50 w-full mt-1.5 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-3 py-2 bg-slate-50 border-b border-slate-100">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Hasil Pencarian ({results.length})
                        </span>
                    </div>
                    <div className="max-h-[240px] overflow-y-auto">
                        {results.map((result, index) => {
                            const { main, sub } = formatDisplayName(result);
                            return (
                                <button
                                    key={result.place_id}
                                    type="button"
                                    onClick={() => handleSelect(result)}
                                    onMouseEnter={() => setHighlightedIndex(index)}
                                    className={`w-full text-left px-3 py-2.5 flex items-start gap-3 transition-colors border-b border-slate-50 last:border-0 ${highlightedIndex === index
                                            ? "bg-blue-50"
                                            : "hover:bg-slate-50"
                                        }`}
                                >
                                    <div className={`mt-0.5 p-1.5 rounded-lg flex-shrink-0 ${highlightedIndex === index
                                            ? "bg-blue-100 text-blue-600"
                                            : "bg-slate-100 text-slate-400"
                                        }`}>
                                        <MapPin className="w-3.5 h-3.5" />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-sm font-semibold text-slate-800 truncate">
                                            {main}
                                        </span>
                                        {sub && (
                                            <span className="text-xs text-slate-400 truncate mt-0.5">
                                                {sub}
                                            </span>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
