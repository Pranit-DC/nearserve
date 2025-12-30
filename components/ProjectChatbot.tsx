// components/ProjectChatbot.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { cx } from "class-variance-authority";
import { AnimatePresence, motion } from "motion/react";
import React from "react";
import SiriOrb from "@/src/components/smoothui/siri-orb";
import { useClickOutside } from "@/src/components/smoothui/ai-input/use-click-outside";

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

export default function ProjectChatbot() {
  const rootRef = useRef<HTMLDivElement>(null);
  const feedbackRef = useRef<HTMLTextAreaElement | null>(null);
  const submitRef = useRef<HTMLButtonElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [showFeedback, setShowFeedback] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "bot",
      content:
        "Hi! Ask me anything about the NearServe architecture or features.",
    },
  ]);

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
    if (e.key === "Enter" && e.metaKey) {
      e.preventDefault();
      submitRef.current?.click();
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-50 max-sm:bottom-6 max-sm:right-6">
      <motion.div
        animate={{
          width: showFeedback ? FEEDBACK_WIDTH : "auto",
          height: showFeedback ? FEEDBACK_HEIGHT : DOCK_HEIGHT,
          borderRadius: showFeedback
            ? FEEDBACK_BORDER_RADIUS
            : DOCK_BORDER_RADIUS,
        }}
        className={cx(
          "relative z-3 flex flex-col items-center overflow-hidden border bg-background shadow-2xl"
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
            <div className="flex items-center justify-center gap-2 px-3 max-sm:h-10 max-sm:px-2">
              <div className="flex w-fit items-center gap-2">
                <AnimatePresence mode="wait">
                  {showFeedback ? (
                    <motion.div
                      animate={{ opacity: 0 }}
                      className="h-5 w-5"
                      exit={{ opacity: 0 }}
                      initial={{ opacity: 0 }}
                      key="placeholder"
                    />
                  ) : (
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
                  )}
                </AnimatePresence>
              </div>

              <Button
                className="flex h-fit flex-1 justify-end rounded-full px-2 py-0.5!"
                onClick={openFeedback}
                type="button"
                variant="ghost"
              >
                <span className="truncate">Ask AI</span>
              </Button>
            </div>
          </footer>

          {/* Feedback/Chat Interface */}
          <form
            className="absolute bottom-0"
            onSubmit={handleSubmit}
            style={{
              width: FEEDBACK_WIDTH,
              height: FEEDBACK_HEIGHT,
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
                  <div className="flex justify-between py-1 px-2">
                    <p className="z-2 ml-[38px] flex select-none items-center gap-[6px] text-foreground font-semibold">
                      NearServe AI 🤖
                    </p>
                    <button
                      className="flex cursor-pointer select-none items-center justify-center gap-1 rounded-[12px] bg-transparent pr-1 text-center text-foreground hover:bg-muted"
                      onClick={closeFeedback}
                      type="button"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {/* Messages Area */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 rounded-md bg-muted/30">
                    {messages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex ${
                          msg.role === "user" ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[85%] rounded-lg p-3 text-sm ${
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
                        <div className="bg-background p-3 rounded-lg border shadow-sm">
                          <Loader2 className="w-4 h-4 animate-spin" />
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input Area */}
                  <div className="p-2">
                    <div className="flex items-end gap-2">
                      <textarea
                        className="flex-1 resize-none rounded-md bg-muted p-3 outline-0 min-h-[60px] max-h-[120px]"
                        name="message"
                        onKeyDown={onKeyDown}
                        placeholder="Ask me anything..."
                        ref={feedbackRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        rows={2}
                      />
                      <button
                        className="flex items-center justify-center gap-1 rounded-[12px] bg-primary text-primary-foreground px-3 py-2 hover:bg-primary/90 disabled:opacity-50"
                        ref={submitRef}
                        type="submit"
                        disabled={isLoading || !input.trim()}
                      >
                        <Kbd>⌘</Kbd>
                        <Kbd className="w-fit">↵</Kbd>
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <AnimatePresence>
              {showFeedback && (
                <motion.div
                  animate={{ opacity: 1 }}
                  className="absolute top-2 left-3"
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
