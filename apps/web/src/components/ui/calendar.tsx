'use client';

import { DayPicker } from 'react-day-picker';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type CalendarProps = React.ComponentProps<typeof DayPicker>;

export function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-3', className)}
      classNames={{
        months: 'flex flex-col',
        month: 'space-y-4',
        month_caption: 'flex justify-center pt-1 relative items-center',
        caption_label: 'text-sm font-medium text-slate-900',
        nav: 'space-x-1 flex items-center absolute inset-x-0 top-1 justify-between px-1',
        button_previous: 'p-1 rounded-md hover:bg-slate-100 transition-colors text-slate-600',
        button_next: 'p-1 rounded-md hover:bg-slate-100 transition-colors text-slate-600',
        month_grid: 'w-full border-collapse space-y-1',
        weekdays: 'flex',
        weekday: 'text-slate-400 rounded-md w-9 font-normal text-[0.8rem] text-center',
        week: 'flex w-full mt-2',
        day: 'h-9 w-9 text-center text-sm p-0 relative',
        day_button: cn(
          'h-9 w-9 p-0 font-normal rounded-md transition-colors',
          'hover:bg-teal-50 hover:text-teal-700',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500',
        ),
        selected: '[&>button]:bg-teal-600 [&>button]:text-white [&>button]:hover:bg-teal-700 [&>button]:hover:text-white',
        today: '[&>button]:font-semibold [&>button]:text-teal-600',
        outside: '[&>button]:text-slate-300 [&>button]:hover:text-slate-400',
        disabled: '[&>button]:text-slate-300 [&>button]:cursor-not-allowed [&>button]:hover:bg-transparent',
        range_middle: '[&>button]:bg-teal-50 [&>button]:text-teal-700 [&>button]:rounded-none',
        hidden: 'invisible',
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === 'left' ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />,
      }}
      {...props}
    />
  );
}