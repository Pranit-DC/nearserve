"use client";

import React from "react";
import { parseDate } from "chrono-node";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";

/**
 * A simplified, self-contained smart datetime input inspired by the code you provided.
 * - Supports natural language input via chrono-node
 * - Exposes value as a Date via onValueChange
 * - Shows a small panel with a native date input and a time-picker list
 */

export type SmartDatetimeInputProps = {
  value?: Date;
  onValueChange: (date: Date) => void;
  placeholder?: string;
  disabled?: boolean;
};

const DEFAULT_SIZE = 96;

const formatDateTime = (datetime: Date | string) => {
  try {
    return new Date(datetime).toLocaleTimeString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    });
  } catch (e) {
    return "";
  }
};

const parseDateTime = (str: Date | string) => {
  if (str instanceof Date) return str;
  return parseDate(String(str));
};

export default function SmartDateTimePicker({
  value,
  onChange,
  className,
  required,
  id,
  name,
}: any) {
  // props are flexible because callers expect (id,name,value,onChange,...) signature
  const val: Date | undefined = value instanceof Date ? value : undefined;
  const onValueChange: (d: Date) => void =
    (onChange as any) || ((d: Date) => {});

  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState<string>(
    val ? formatDateTime(val) : ""
  );
  const [selected, setSelected] = React.useState<Date | undefined>(val);

  React.useEffect(() => {
    if (value instanceof Date) {
      setSelected(value);
      setInputValue(formatDateTime(value));
    }
  }, [value]);

  const handleParse = React.useCallback((raw: string) => {
    const parsed = parseDateTime(raw);
    if (parsed) {
      setSelected(parsed);
      setInputValue(formatDateTime(parsed));
      onValueChange(parsed);
    }
  }, []);

  // Time picker: generate 24*4 = 96 entries at 15-minute steps
  const timeList = React.useMemo(() => {
    const list: string[] = [];
    for (let h = 0; h < 24; h++) {
      for (let p = 0; p < 4; p++) {
        const m = p * 15;
        const date = new Date();
        date.setHours(h, m, 0, 0);
        list.push(format(date, "hh:mm a"));
      }
    }
    return list;
  }, []);

  // filter times to avoid past times when date is today (caller expects no past selections)
  const filteredTimeList = React.useMemo(() => {
    if (!selected) return timeList;
    const now = new Date();
    const selDate = new Date(selected);
    const sameDay =
      selDate.getFullYear() === now.getFullYear() &&
      selDate.getMonth() === now.getMonth() &&
      selDate.getDate() === now.getDate();
    if (!sameDay) return timeList;
    // only include times strictly after now
    return timeList.filter((t) => {
      const p = parseDateTime(t);
      if (!p) return false;
      const candidate = new Date(selDate);
      candidate.setHours(p.getHours(), p.getMinutes(), 0, 0);
      return candidate.getTime() > now.getTime();
    });
  }, [selected, timeList]);

  const applyDate = (d?: Date) => {
    if (!d) return;
    const next = new Date(d);
    if (selected) {
      next.setHours(selected.getHours(), selected.getMinutes());
    }
    setSelected(next);
    onValueChange(next);
    setInputValue(formatDateTime(next));
  };

  const applyTime = (timeStr: string) => {
    const now = selected ? new Date(selected) : new Date();
    const parsed = parseDateTime(timeStr);
    if (!parsed) return;
    now.setHours(parsed.getHours(), parsed.getMinutes());
    setSelected(now);
    onValueChange(now);
    setInputValue(formatDateTime(now));
  };

  return (
    <div className={cn("w-full relative", className)}>
      <div className="flex gap-2">
        <Input
          value={inputValue}
          placeholder={"e.g. tomorrow at 5pm"}
          onChange={(e) => setInputValue(e.currentTarget.value)}
          onBlur={(e) => handleParse(e.currentTarget.value)}
        />
        <button
          type="button"
          onClick={() => setOpen((s) => !s)}
          className={
            buttonVariants({ variant: "outline", size: "icon" }) as any
          }
        >
          <CalendarIcon className="size-4" />
        </button>
      </div>

      {open && (
        <div className="absolute z-50 mt-2 w-full rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#181818] shadow-xl overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] divide-y md:divide-y-0 md:divide-x divide-gray-200 dark:divide-gray-800">
            {/* Calendar Section */}
            <div className="p-2">
              <Calendar
                selected={selected}
                onSelect={(date) => {
                  if (date) {
                    applyDate(date);
                  }
                }}
                minDate={new Date()}
              />
            </div>

            {/* Time Section */}
            <div className="p-3">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Select Time
              </label>
              <div className="h-64 overflow-y-auto border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#303030] rounded-md">
                <div className="p-1.5">
                  {filteredTimeList.map((t, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        applyTime(t);
                        setOpen(false);
                      }}
                      className={cn(
                        "text-sm w-full text-left px-3 py-2 rounded-md transition-colors",
                        "text-gray-900 dark:text-gray-200",
                        "hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400",
                        selected &&
                          format(selected, "hh:mm a") === t &&
                          "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium"
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden input for form submission */}
      <input
        type="hidden"
        id={id}
        name={name}
        value={selected ? selected.toISOString() : ""}
        readOnly
      />
    </div>
  );
}
