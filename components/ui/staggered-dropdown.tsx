"use client";

import { FiChevronDown } from "react-icons/fi";
import { motion } from "framer-motion";
import { Dispatch, SetStateAction, useState } from "react";
import { IconType } from "react-icons";

const wrapperVariants = {
  open: {
    scaleY: 1,
    transition: {
      when: "beforeChildren",
      staggerChildren: 0.06,
    },
  },
  closed: {
    scaleY: 0,
    transition: {
      when: "afterChildren",
      staggerChildren: 0.06,
    },
  },
};

const iconVariants = {
  open: { rotate: 180 },
  closed: { rotate: 0 },
};

const itemVariants = {
  open: {
    opacity: 1,
    y: 0,
    transition: {
      when: "beforeChildren",
    },
  },
  closed: {
    opacity: 0,
    y: -8,
    transition: {
      when: "afterChildren",
    },
  },
};

const actionIconVariants = {
  open: { scale: 1, y: 0 },
  closed: { scale: 0, y: -7 },
};

export default function StaggeredDropDown({
  items,
  selected,
  onSelectAction,
  onSelect,
  label,
  isCollapsed = false,
}: {
  items: { value: string; label: string }[];
  selected: string;
  // Accept either a client callback (`onSelect`) or a Server Action (`onSelectAction`).
  onSelectAction?: (value: string) => void;
  onSelect?: (value: string) => void;
  label?: string;
  isCollapsed?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const handleSelect = (v: string) => {
    if (onSelect) return onSelect(v);
    if (onSelectAction) return onSelectAction(v);
    return;
  };

  return (
    <div className="relative inline-block w-full">
      <motion.div animate={open ? "open" : "closed"} className="relative">
        <button
          onClick={() => setOpen((pv) => !pv)}
          type="button"
          className="flex items-center justify-between w-full gap-3 px-4 py-3 rounded-lg text-sm bg-white dark:bg-[#303030] border-2 border-gray-200 dark:border-[#2c2c2c] hover:border-blue-300 dark:hover:border-blue-600 focus:border-blue-500 dark:focus:border-blue-500 transition-all duration-200 shadow-sm"
        >
          <span className="font-medium text-gray-900 dark:text-white truncate">
            {label ??
              items.find((i) => i.value === selected)?.label ??
              "Select your education level"}
          </span>
          <motion.span
            variants={iconVariants}
            className="text-base text-gray-500 dark:text-gray-400 flex-shrink-0"
          >
            <FiChevronDown />
          </motion.span>
        </button>

        <motion.ul
          initial={wrapperVariants.closed}
          variants={wrapperVariants}
          className={`flex flex-col gap-0.5 p-1.5 rounded-lg bg-white dark:bg-[#303030] border-2 border-gray-200 dark:border-[#2c2c2c] shadow-2xl absolute top-[calc(100%+0.5rem)] w-full overflow-hidden z-50 max-h-64 overflow-y-auto scrollbar-hide ${
            isCollapsed ? "left-full ml-2" : "left-0"
          }`}
          style={{
            originY: "top",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {items.map((it) => (
            <Option
              key={it.value}
              text={it.label}
              value={it.value}
              setOpen={setOpen}
              onSelect={handleSelect}
              selected={selected}
            />
          ))}
        </motion.ul>
      </motion.div>
    </div>
  );
}

const Option = ({
  text,
  value,
  setOpen,
  onSelect,
  selected,
}: {
  text: string;
  value: string;
  setOpen: Dispatch<SetStateAction<boolean>>;
  onSelect: (v: string) => void;
  selected: string;
}) => {
  return (
    <motion.li
      variants={itemVariants}
      onClick={() => {
        onSelect(value);
        setOpen(false);
      }}
      className={`flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium rounded-md transition-all duration-200 cursor-pointer ${
        selected === value
          ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 shadow-sm"
          : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#252525]"
      }`}
    >
      <motion.span
        variants={actionIconVariants}
        className={`flex items-center justify-center w-5 h-5 flex-shrink-0 ${
          selected === value ? "text-blue-600 dark:text-blue-400" : ""
        }`}
      >
        {selected === value && (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M5 13l4 4L19 7"
            />
          </svg>
        )}
      </motion.span>
      <span className="truncate">{text}</span>
    </motion.li>
  );
};
