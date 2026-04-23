'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Calendar } from './calendar';

interface DatePickerProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

function formatDisplay(iso: string): string {
  if (!iso) return '';
  const [year, month, day] = iso.split('-');
  if (!year || !month || !day) return iso;
  return `${day}/${month}/${year}`;
}

function toDate(iso: string): Date | undefined {
  if (!iso) return undefined;
  const d = new Date(iso + 'T00:00:00');
  return isNaN(d.getTime()) ? undefined : d;
}

function toIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function DatePicker({ value, onChange, placeholder = 'Sélectionner une date', disabled, className }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const selected = toDate(value ?? '');

  const updateCoords = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setCoords({ top: rect.bottom + window.scrollY + 4, left: rect.left + window.scrollX, width: rect.width });
  }, []);

  function handleOpen() {
    updateCoords();
    setOpen(true);
  }

  function handleSelect(date: Date | undefined) {
    if (!date) return;
    onChange(toIso(date));
    setOpen(false);
  }

  // Fermer sur clic extérieur
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        popupRef.current?.contains(e.target as Node)
      ) return;
      setOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  // Recalculer la position si scroll ou resize
  useEffect(() => {
    if (!open) return;
    window.addEventListener('scroll', updateCoords, true);
    window.addEventListener('resize', updateCoords);
    return () => {
      window.removeEventListener('scroll', updateCoords, true);
      window.removeEventListener('resize', updateCoords);
    };
  }, [open, updateCoords]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={handleOpen}
        className={cn(
          'w-full flex items-center gap-2 px-3 py-2 text-sm border border-slate-300 rounded-lg',
          'focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent',
          'hover:border-slate-400 transition-colors bg-white text-left',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          !value && 'text-slate-400',
          className,
        )}
      >
        <CalendarIcon className="w-4 h-4 text-slate-400 flex-shrink-0" />
        <span>{value ? formatDisplay(value) : placeholder}</span>
      </button>

      {open && typeof document !== 'undefined' && createPortal(
        <div
          ref={popupRef}
          style={{ position: 'absolute', top: coords.top, left: coords.left, minWidth: coords.width, zIndex: 9999 }}
          className="bg-white rounded-xl border border-slate-200 shadow-xl"
        >
          <Calendar
            mode="single"
            selected={selected}
            onSelect={handleSelect}
            defaultMonth={selected ?? new Date()}
            disabled={{ after: new Date() }}
          />
        </div>,
        document.body,
      )}
    </>
  );
}
