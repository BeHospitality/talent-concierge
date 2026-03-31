import { useState, useRef, useEffect, useCallback } from "react";
import { Send, X, Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type AgentContext = {
  path?: string;
  name?: string;
  archetype?: string;
  page?: string;
};

export default function PocketAgent({ context }: { context?: AgentContext }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showLabel, setShowLabel] = useState(true);
  const [shouldPulse, setShouldPulse] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Hide label and pulse after 8 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLabel(false);
      setShouldPulse(false);
    }, 8000);
    return () => clearTimeout(timer);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const sendMessage = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMsg: Message = { role: "user", content: trimmed };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("agent-chat", {
        body: {
          messages: updatedMessages,
          context: context || { page: "portal" },
        },
      });

      if (error) throw error;

      if (data?.content) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.content },
        ]);
      } else if (data?.error) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "I'm having trouble connecting right now. Try again in a moment.",
          },
        ]);
      }
    } catch (err) {
      console.error("[PocketAgent] Error:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Something went wrong. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, context]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // CLOSED STATE
  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-[1000] flex flex-col items-end">
        {/* Floating label */}
        {showLabel && (
          <div
            className="mb-2 px-[10px] py-1 rounded-md text-white text-[11px] whitespace-nowrap animate-fade-in"
            style={{
              background: "rgba(0,0,0,0.6)",
              fontFamily: "'DM Sans', sans-serif",
              animation: "fadeOut 0.5s ease 7.5s forwards",
            }}
          >
            Ask me anything
          </div>
        )}
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 rounded-2xl border-none cursor-pointer flex items-center justify-center transition-transform hover:scale-105"
          style={{
            background: "#f59e0b",
            boxShadow: "0 4px 24px rgba(245,158,11,0.4)",
            animation: shouldPulse ? "pulse-gold 2s ease 4" : "none",
          }}
          aria-label="Open career agent chat"
        >
          <Sparkles className="w-6 h-6 text-white" />
        </button>
      </div>
    );
  }

  // OPEN STATE
  return (
    <div
      className="fixed bottom-6 right-6 z-[1000] flex flex-col sm:w-[380px] w-[calc(100vw-32px)] sm:max-h-[560px] max-h-[70vh] sm:bottom-6 sm:right-6 bottom-4 right-4"
      style={{
        background: "#0f1729",
        border: "1px solid rgba(255,255,255,0.10)",
        borderRadius: "20px",
        boxShadow: "0 8px 48px rgba(0,0,0,0.6)",
      }}
    >
      {/* HEADER */}
      <div
        className="flex items-center justify-between px-[18px] py-4 shrink-0"
        style={{
          background: "rgba(245,158,11,0.08)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          borderRadius: "20px 20px 0 0",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(245,158,11,0.15)" }}
          >
            <Sparkles className="w-[18px] h-[18px]" style={{ color: "#f59e0b" }} />
          </div>
          <div>
            <div
              className="text-white text-sm font-semibold leading-tight"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              Career Agent
            </div>
            <div
              className="text-[11px] leading-tight mt-0.5"
              style={{
                color: "rgba(255,255,255,0.45)",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Powered by Be Connect
            </div>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer border-none transition-colors"
          style={{ background: "rgba(255,255,255,0.06)" }}
          aria-label="Close chat"
        >
          <X className="w-4 h-4" style={{ color: "rgba(255,255,255,0.5)" }} />
        </button>
      </div>

      {/* MESSAGES */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-[18px] py-4 space-y-3"
        style={{ minHeight: 0 }}
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: "rgba(245,158,11,0.10)" }}
            >
              <Sparkles className="w-6 h-6" style={{ color: "#f59e0b" }} />
            </div>
            <p
              className="text-sm mb-1"
              style={{
                color: "rgba(255,255,255,0.7)",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Hi! I'm your career companion.
            </p>
            <p
              className="text-xs"
              style={{
                color: "rgba(255,255,255,0.35)",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Ask me about opportunities, pathways, or next steps.
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className="max-w-[85%] px-3.5 py-2.5 text-[13px] leading-relaxed"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                borderRadius:
                  msg.role === "user"
                    ? "16px 16px 4px 16px"
                    : "16px 16px 16px 4px",
                background:
                  msg.role === "user"
                    ? "rgba(245,158,11,0.15)"
                    : "rgba(255,255,255,0.05)",
                color:
                  msg.role === "user"
                    ? "#f59e0b"
                    : "rgba(255,255,255,0.85)",
                border:
                  msg.role === "user"
                    ? "1px solid rgba(245,158,11,0.25)"
                    : "1px solid rgba(255,255,255,0.06)",
              }}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div
              className="px-3.5 py-2.5 flex items-center gap-2"
              style={{
                borderRadius: "16px 16px 16px 4px",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <Loader2
                className="w-3.5 h-3.5 animate-spin"
                style={{ color: "rgba(255,255,255,0.4)" }}
              />
              <span
                className="text-[12px]"
                style={{
                  color: "rgba(255,255,255,0.4)",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                Thinking…
              </span>
            </div>
          </div>
        )}
      </div>

      {/* INPUT */}
      <div
        className="px-[18px] pb-[18px] pt-2 shrink-0"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div
          className="flex items-end gap-2 rounded-xl px-3.5 py-2.5"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message…"
            rows={1}
            className="flex-1 bg-transparent border-none outline-none resize-none text-[13px] leading-relaxed placeholder:text-white/25"
            style={{
              color: "rgba(255,255,255,0.85)",
              fontFamily: "'DM Sans', sans-serif",
              maxHeight: "80px",
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="w-8 h-8 rounded-lg flex items-center justify-center border-none cursor-pointer transition-all shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              background: input.trim() ? "#f59e0b" : "rgba(255,255,255,0.06)",
            }}
            aria-label="Send message"
          >
            <Send
              className="w-3.5 h-3.5"
              style={{
                color: input.trim() ? "white" : "rgba(255,255,255,0.3)",
              }}
            />
          </button>
        </div>
      </div>

      {/* Keyframes injected via style tag */}
      <style>{`
        @keyframes pulse-gold {
          0%, 100% { box-shadow: 0 4px 24px rgba(245,158,11,0.4); }
          50% { box-shadow: 0 4px 32px rgba(245,158,11,0.7); }
        }
        @keyframes fadeOut {
          to { opacity: 0; pointer-events: none; }
        }
      `}</style>
    </div>
  );
}
