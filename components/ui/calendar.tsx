"use client";

import * as React from "react";
import {
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  format,
  isSameMonth,
  isSameDay,
  isToday,
  isBefore,
  startOfDay,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CalendarProps {
  selected?: Date;
  onSelect?: (date: Date) => void;
  minDate?: Date;
  className?: string;
}

export function Calendar({
  selected,
  onSelect,
  minDate = new Date(),
  className,
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(
    selected || new Date()
  );

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const dateFormat = "d";
  const rows: Date[][] = [];
  let days: Date[] = [];
  let day = startDate;

  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      days.push(day);
      day = addDays(day, 1);
    }
    rows.push(days);
    days = [];
  }

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const onDateClick = (day: Date) => {
    if (isBefore(startOfDay(day), startOfDay(minDate))) {
      return;
    }
    onSelect?.(day);
  };

  return (
    <div className={cn("p-3", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={prevMonth}
          className="p-1.5 hover:bg-gray-100 dark:hover:bg-[#303030] rounded-md transition-colors"
        >
          <ChevronLeft className="h-4 w-4 text-gray-600 dark:text-gray-400" />
        </button>
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
          {format(currentMonth, "MMMM yyyy")}
        </h2>
        <button
          type="button"
          onClick={nextMonth}
          className="p-1.5 hover:bg-gray-100 dark:hover:bg-[#303030] rounded-md transition-colors"
        >
          <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* Days of week */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-gray-600 dark:text-gray-400 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="space-y-1">
        {rows.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 gap-1">
            {week.map((day, dayIndex) => {
              const isCurrentMonth = isSameMonth(day, monthStart);
              const isSelected = selected && isSameDay(day, selected);
              const isTodayDate = isToday(day);
              const isDisabled = isBefore(startOfDay(day), startOfDay(minDate));

              return (
                <button
                  key={dayIndex}
                  type="button"
                  onClick={() => onDateClick(day)}
                  disabled={isDisabled}
                  className={cn(
                    "h-9 w-9 text-sm rounded-md transition-all duration-200 relative",
                    isCurrentMonth
                      ? "text-gray-900 dark:text-white"
                      : "text-gray-400 dark:text-gray-600",
                    isSelected &&
                      "bg-blue-600 text-white hover:bg-blue-700 font-semibold",
                    !isSelected &&
                      isTodayDate &&
                      "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-semibold",
                    !isSelected &&
                      !isTodayDate &&
                      !isDisabled &&
                      "hover:bg-gray-100 dark:hover:bg-[#303030]",
                    isDisabled &&
                      "opacity-40 cursor-not-allowed hover:bg-transparent"
                  )}
                >
                  {format(day, dateFormat)}
                  {isTodayDate && !isSelected && (
                    <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-600 dark:bg-blue-400 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer buttons */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={() => onSelect?.(new Date())}
          className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
        >
          Today
        </button>
        <button
          type="button"
          onClick={() => onSelect?.(undefined as any)}
          className="text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
