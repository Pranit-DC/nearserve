// components/ProjectChatbot.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { cx } from "class-variance-authority";
import { AnimatePresence, motion } from "motion/react";
import React from "react";
import SiriOrb from "@/components/smoothui/siri-orb";
import { useClickOutside } from "@/components/smoothui/ai-input/use-click-outside";

type Message = {
  role: "user" | "bot";
  content: string;
};

const SPEED = 1;
const DOCK_HEIGHT = 44;
const FEEDBACK_BORDER_RADIUS = 14;
const DOCK_BORDER_RADIUS = 20;
const SPRING_STIFFNESS = 550;
const SPRING_DAMPING = 45;
const SPRING_MASS = 0.7;
const CLOSE_DELAY = 0.08;
const FEEDBACK_WIDTH = 500;
const FEEDBACK_HEIGHT = 600;

// Mirrors Tailwind's `sm` breakpoint (default 640px). Keep in sync with tailwind.config.js
const MOBILE_BREAKPOINT = 640;

// Classname groups for readability and maintainability
const CHATBOT_BASE =
  "relative z-3 flex flex-col items-center overflow-hidden border bg-background";
const CHATBOT_SHADOWS =
  "shadow-[0_12px_50px_rgba(0,0,0,0.18)] dark:shadow-[0_18px_60px_rgba(0,0,0,0.6)]";
const CHATBOT_HOVER =
  "hover:shadow-[0_20px_80px_rgba(0,0,0,0.28)] hover:dark:shadow-[0_22px_90px_rgba(0,0,0,0.7)] hover:-translate-y-1 hover:ring-4 hover:ring-primary/12";
const CHATBOT_TRANSITION =
  "ring-0 transition-shadow transition-transform duration-200 ease-out";

// Get responsive dimensions
const getResponsiveDimensions = () => {
  if (typeof window === "undefined") {
    return { width: FEEDBACK_WIDTH, height: FEEDBACK_HEIGHT };
  }
  const v = (window as any).visualViewport;
  const viewportWidth = v?.width ?? window.innerWidth;
  const viewportHeight = v?.height ?? window.innerHeight;
  const isMobile = viewportWidth < MOBILE_BREAKPOINT; // sm breakpoint

  return {
    width: isMobile ? viewportWidth - 32 : FEEDBACK_WIDTH,
    // Use visualViewport height when available to account for on-screen keyboards
    height: isMobile ? viewportHeight - 100 : FEEDBACK_HEIGHT,
  };
};

export default function ProjectChatbot({
  isExpanded = false,
}: {
  isExpanded?: boolean;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const feedbackRef = useRef<HTMLTextAreaElement | null>(null);
  const submitRef = useRef<HTMLButtonElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [showFeedback, setShowFeedback] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [dimensions, setDimensions] = useState({
    width: FEEDBACK_WIDTH,
    height: FEEDBACK_HEIGHT,
  });
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "bot",
      content:
        "Hi! Ask me anything about the NearServe architecture or features.",
    },
  ]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Initialize and update dimensions on client side
  useEffect(() => {
    if (!mounted || typeof window === "undefined") return;

    // Set initial dimensions after mount
    setDimensions(getResponsiveDimensions());
    // Throttle resize updates using requestAnimationFrame to avoid
    // excessive state updates during continuous resize/orientation changes.
    let rafId: number | null = null;
    const handleResize = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        setDimensions(getResponsiveDimensions());
        rafId = null;
      });
    };

    // Prefer visualViewport resize events when available (handles virtual keyboard).
    const vv = (window as any).visualViewport;
    if (vv && typeof vv.addEventListener === "function") {
      vv.addEventListener("resize", handleResize);
    }

    window.addEventListener("resize", handleResize);

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      if (vv && typeof vv.removeEventListener === "function") {
        vv.removeEventListener("resize", handleResize);
      }
      window.removeEventListener("resize", handleResize);
    };
  }, [mounted]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const closeFeedback = React.useCallback(() => {
    setShowFeedback(false);
    feedbackRef.current?.blur();
  }, []);

  const openFeedback = React.useCallback(() => {
    setShowFeedback(true);
    setTimeout(() => {
      feedbackRef.current?.focus();
    });
  }, []);

  useClickOutside(rootRef, closeFeedback);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      });

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          content: data.response || "Sorry, I encountered an error.",
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "bot", content: "Network error. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Escape") {
      closeFeedback();
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submitRef.current?.click();
    }
  };

  return (
    <div className="fixed bottom-12 right-6 z-50 max-sm:bottom-4 max-sm:right-4">
      <motion.div
        animate={{
          width: showFeedback ? dimensions.width : "auto",
          height: showFeedback ? dimensions.height : DOCK_HEIGHT,
          borderRadius: showFeedback
            ? FEEDBACK_BORDER_RADIUS
            : DOCK_BORDER_RADIUS,
        }}
        className={cx(
          CHATBOT_BASE,
          CHATBOT_SHADOWS,
          CHATBOT_HOVER,
          CHATBOT_TRANSITION
        )}
        initial={false}
        ref={rootRef}
        transition={{
          type: "spring",
          stiffness: SPRING_STIFFNESS / SPEED,
          damping: SPRING_DAMPING,
          mass: SPRING_MASS,
          delay: showFeedback ? 0 : CLOSE_DELAY,
        }}
      >
        {/* Dock */}
        <footer className="mt-auto flex h-[44px] select-none items-center justify-center whitespace-nowrap">
          {!showFeedback && (
            <button
              onClick={openFeedback}
              className="w-full p-2 rounded-lg hover:bg-muted transition-colors flex items-center gap-2"
              type="button"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  initial={{ opacity: 0 }}
                  key="siri-orb"
                  transition={{ duration: 0.2 }}
                >
                  <SiriOrb
                    colors={{
                      bg: "oklch(22.64% 0 0)",
                    }}
                    size="24px"
                  />
                </motion.div>
              </AnimatePresence>

              <span className="text-sm font-medium text-foreground text-left">
                Ask AI
              </span>
            </button>
          )}
        </footer>

        {/* Feedback/Chat Interface */}
        <form
          className="absolute bottom-0"
          onSubmit={handleSubmit}
          style={{
            width: dimensions.width,
            height: dimensions.height,
            pointerEvents: showFeedback ? "all" : "none",
          }}
        >
          <AnimatePresence>
            {showFeedback && (
              <motion.div
                animate={{ opacity: 1 }}
                className="flex h-full flex-col p-1"
                exit={{ opacity: 0 }}
                initial={{ opacity: 0 }}
                transition={{
                  type: "spring",
                  stiffness: SPRING_STIFFNESS / SPEED,
                  damping: SPRING_DAMPING,
                  mass: SPRING_MASS,
                }}
              >
                {/* Header */}
                <div className="flex justify-between py-6 px-2 max-sm:py-2 relative items-center">
                  <p className="z-2 pl-[38px] max-sm:pl-[38px] flex select-none items-center gap-[6px] text-foreground font-semibold text-sm max-sm:text-base">
                    NearServe AI
                  </p>
                  <button
                    className="flex cursor-pointer select-none items-center justify-center gap-1 rounded-[12px] bg-transparent pr-1 text-center text-foreground hover:bg-muted max-sm:pr-0 max-sm:p-1.5"
                    onClick={closeFeedback}
                    type="button"
                  >
                    <X size={18} className="max-sm:w-5 max-sm:h-5" />
                  </button>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 max-sm:p-2 space-y-4 max-sm:space-y-3 rounded-md bg-muted/30">
                  {messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${
                        msg.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[85%] max-sm:max-w-[90%] rounded-lg p-3 max-sm:p-2 text-sm max-sm:text-xs ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-background border shadow-sm"
                        }`}
                      >
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-background p-3 max-sm:p-2 rounded-lg border shadow-sm">
                        <Loader2 className="w-4 h-4 animate-spin" />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-2 max-sm:p-1.5">
                  <div className="flex items-end gap-2 max-sm:gap-1.5">
                    <textarea
                      className="flex-1 resize-none rounded-md bg-muted p-3 max-sm:p-2 outline-0 min-h-[60px] max-sm:min-h-[50px] max-h-[120px] max-sm:max-h-[100px] text-sm max-sm:text-xs"
                      name="message"
                      onKeyDown={onKeyDown}
                      placeholder="Ask me anything..."
                      ref={feedbackRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      rows={2}
                    />
                    <button
                      className="flex items-center justify-center gap-1 rounded-[12px] bg-primary text-primary-foreground px-3 py-2 max-sm:px-2 max-sm:py-1.5 hover:bg-primary/90 disabled:opacity-50"
                      ref={submitRef}
                      type="submit"
                      disabled={isLoading || !input.trim()}
                      aria-label="Send message"
                    >
                      <Kbd className="w-fit max-sm:text-xs">↵</Kbd>
                    </button>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Enter to send — Shift+Enter for newline
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {showFeedback && (
              <motion.div
                animate={{ opacity: 1 }}
                className="absolute left-3 top-6 max-sm:left-3 max-sm:top-3"
                exit={{ opacity: 0 }}
                initial={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <SiriOrb
                  colors={{
                    bg: "oklch(22.64% 0 0)",
                  }}
                  size="24px"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </motion.div>
    </div>
  );
}

function Kbd({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  return (
    <kbd
      className={cx(
        "flex h-6 w-fit items-center justify-center rounded-sm border bg-muted px-[6px] font-sans text-foreground text-xs",
        className
      )}
    >
      {children}
    </kbd>
  );
}
