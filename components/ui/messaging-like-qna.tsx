"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as Accordion from "@radix-ui/react-accordion";
import { MinusIcon, PlusIcon, User, FileText, Smartphone, Wallet, AlertCircle, Star, Target } from "lucide-react";
import { LucideIcon } from "lucide-react";

interface FAQItem {
  id: number;
  question: string;
  answer: string;
  icon?: LucideIcon;
}

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

export const FaqSection = ({
  data,
}: {
  data: FAQItem[];
}) => {
  const [openItem, setOpenItem] = useState<string | null>(null);

  return (
    <div className="mx-auto w-full max-w-xl rounded-lg bg-white dark:bg-[#181818] p-4 shadow-lg md:max-w-2xl border border-gray-200 dark:border-[#232323]">
      {/* Subheader / Timestamp */}
      <div className="mb-4 text-xs text-gray-400 dark:text-gray-500">
        Every day, <span className="font-medium">9:01 AM</span>
      </div>

      <Accordion.Root
        type="single"
        collapsible={true}
        value={openItem ?? ""}
        onValueChange={(value) => setOpenItem(value)}
      >
        {data.map((item) => (
          <Accordion.Item
            key={item.id}
            value={item.id.toString()}
            className="mb-2"
          >
            {/* Accordion Header */}
            <Accordion.Header>
              <Accordion.Trigger className="group flex justify-between items-center w-full">
                <div
                  className={cn(
                    "inline-flex group-hover:translate-x-1 rounded-2xl rounded-bl-md transition items-center justify-between px-3 py-1.5 text-left duration-200 outline-hidden",
                    openItem === item.id.toString()
                      ? "bg-blue-600 text-white"
                      : "text-gray-700 dark:text-gray-200"
                  )}
                >
                  {/* Icon & Question Text */}
                  <div className="relative flex items-center space-x-2">
                    {item.icon && <item.icon className="w-4 h-4 flex-shrink-0" />}
                    <span className="tracking-tight text-sm">{item.question}</span>
                  </div>
                </div>

                <span
                  className={cn(
                    "transition-transform ml-2 flex-shrink-0",
                    openItem === item.id.toString()
                      ? "rotate-0 text-white"
                      : "rotate-90 text-gray-400 dark:text-gray-200"
                  )}
                >
                  {openItem === item.id.toString() ? (
                    <MinusIcon className="size-4" />
                  ) : (
                    <PlusIcon className="size-4" />
                  )}
                </span>
              </Accordion.Trigger>
            </Accordion.Header>

            {/* Accordion Content with AnimatedPresence for smooth mount/unmount */}
            <Accordion.Content forceMount={true}>
              <AnimatePresence initial={false}>
                {openItem === item.id.toString() && (
                  <motion.div
                    key="content"
                    initial={{ height: 0, opacity: 0, x: -20 }}
                    animate={{ height: "auto", opacity: 1, x: 0 }}
                    exit={{
                      height: 0,
                      opacity: 0,
                      x: -20,
                      filter: "blur(8px)",
                    }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    style={{ overflow: "hidden" }}
                  >
                    <div className="relative ml-7 mt-2 md:ml-14">
                      <div className="relative inline-block rounded-2xl rounded-br mb-5 bg-blue-600 px-4 py-2 text-sm text-white shadow-lg">
                        {item.answer}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Accordion.Content>
          </Accordion.Item>
        ))}
      </Accordion.Root>
    </div>
  );
};

export default FaqSection;
