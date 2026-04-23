'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Loader2 } from 'lucide-react';

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

export interface AddressCoords {
  lat: number;
  lng: number;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onCoordinates: (coords: AddressCoords | null) => void;
  disabled?: boolean;
  placeholder?: string;
  hasError?: boolean;
  className?: string;
}

async function searchNominatim(query: string): Promise<NominatimResult[]> {
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', query);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '5');
  url.searchParams.set('countrycodes', 'fr');
  url.searchParams.set('addressdetails', '0');

  const res = await fetch(url.toString(), {
    headers: { 'User-Agent': 'KURA-App/1.0 (contact@kura.fr)' },
    signal: AbortSignal.timeout(5000),
  });
  return res.json() as Promise<NominatimResult[]>;
}

export function AddressAutocomplete({
  value,
  onChange,
  onCoordinates,
  disabled,
  placeholder = '12 rue de la Paix, 75001 Paris',
  hasError,
  className,
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(async (query: string) => {
    if (query.length < 5) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }
    setIsSearching(true);
    try {
      const results = await searchNominatim(query);
      setSuggestions(results);
      setIsOpen(results.length > 0);
    } catch {
      setSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newValue = e.target.value;
    onChange(newValue);
    onCoordinates(null); // reset coords on manual edit

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => void search(newValue), 500);
  }

  function handleSelect(result: NominatimResult) {
    onChange(result.display_name);
    onCoordinates({ lat: parseFloat(result.lat), lng: parseFloat(result.lon) });
    setSuggestions([]);
    setIsOpen(false);
  }

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cleanup debounce on unmount
  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={value}
          onChange={handleChange}
          onFocus={() => suggestions.length > 0 && setIsOpen(true)}
          disabled={disabled}
          placeholder={placeholder}
          autoComplete="off"
          className={`w-full pl-8 pr-8 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e2d6b] focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed placeholder:text-slate-400 ${
            hasError ? 'border-red-400' : 'border-slate-300'
          } ${className ?? ''}`}
        />
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 animate-spin" />
        )}
      </div>

      {isOpen && suggestions.length > 0 && (
        <ul className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden max-h-56 overflow-y-auto">
          {suggestions.map((s) => (
            <li key={s.place_id}>
              <button
                type="button"
                onMouseDown={() => handleSelect(s)}
                className="w-full flex items-start gap-2 px-3 py-2.5 text-left text-sm hover:bg-slate-50 transition-colors"
              >
                <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                <span className="text-slate-700 line-clamp-2">{s.display_name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
