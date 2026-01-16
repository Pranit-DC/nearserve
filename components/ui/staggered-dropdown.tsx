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
  label,
  isCollapsed = false,
}: {
  items: { value: string; label: string }[];
  selected: string;
  // Server Action callback for selecting an item
  onSelectAction?: (value: string) => void;
  label?: string;
  isCollapsed?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const handleSelect = (v: string) => {
    if (onSelectAction) return onSelectAction(v);
    return;
  };

  return (
    <div className="relative inline-block">
      <motion.div animate={open ? "open" : "closed"} className="relative">
        <button
          onClick={() => setOpen((pv) => !pv)}
          className="flex items-center gap-2 px-3 py-2 rounded-md text-sm bg-transparent border border-transparent hover:bg-gray-100 dark:hover:bg-[#303030] transition-colors"
        >
          <span className="font-medium">{label ?? items.find(i => i.value === selected)?.label ?? 'Select'}</span>
          <motion.span variants={iconVariants} className="text-base"><FiChevronDown /></motion.span>
        </button>

        <motion.ul
          initial={wrapperVariants.closed}
          variants={wrapperVariants}
          style={{ originY: "top" }}
          className={`flex flex-col gap-1 p-2 rounded-lg bg-white dark:bg-[#303030] shadow-xl absolute top-[120%] w-48 overflow-hidden z-50 ${
            isCollapsed ? 'left-full ml-2' : 'left-1/2 -translate-x-1/2'
          }`}
        >
          {items.map((it) => (
            <Option key={it.value} text={it.label} value={it.value} setOpen={setOpen} onSelect={handleSelect} selected={selected} />
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
      className={`flex items-center gap-2 w-full p-2 text-sm font-medium whitespace-nowrap rounded-md hover:bg-gray-100 dark:hover:bg-[#303030] text-slate-700 dark:text-slate-200 transition-colors cursor-pointer ${selected === value ? 'bg-gray-100 dark:bg-[#303030]' : ''}`}
    >
      <motion.span variants={actionIconVariants} className="w-4 text-xs opacity-80">{selected === value ? '✓' : ''}</motion.span>
      <span>{text}</span>
    </motion.li>
  );
};
