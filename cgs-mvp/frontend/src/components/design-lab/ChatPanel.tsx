import { useState, useRef, useEffect } from "react";
import { useChatHistory, useSendMessage } from "@/hooks/useChat";
import { Button } from "@/components/ui/button";
import { Loader2, Send, Sparkles, ArrowUpRight, X } from "lucide-react";
import type { ChatMessage, ChatResponse } from "@/types/design-lab";

interface ChatPanelProps {
  outputId: string;
  onClose: () => void;
  onOutputUpdated?: (response: ChatResponse) => void;
}

function formatTime(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleTimeString("it-IT", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function ActionBadge({ actionType }: { actionType: string }) {
  const config: Record<string, { label: string; className: string }> = {
    edit_output: {
      label: "Content edited",
      className: "bg-blue-500/10 text-blue-400",
    },
    update_context: {
      label: "Context updated",
      className: "bg-purple-500/10 text-purple-400",
    },
    update_brief: {
      label: "Brief updated",
      className: "bg-amber-500/10 text-amber-400",
    },
  };

  const c = config[actionType];
  if (!c) return null;

  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${c.className}`}
    >
      <ArrowUpRight className="w-3 h-3" />
      {c.label}
    </span>
  );
}

export default function ChatPanel({
  outputId,
  onClose,
  onOutputUpdated,
}: ChatPanelProps) {
  const { data: history, isLoading: historyLoading } =
    useChatHistory(outputId);
  const sendMessage = useSendMessage(outputId);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, sendMessage.isPending]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = () => {
    const message = input.trim();
    if (!message || sendMessage.isPending) return;

    setInput("");
    sendMessage.mutate(message, {
      onSuccess: (data) => {
        if (data.updated_output) {
          onOutputUpdated?.(data);
        }
      },
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-surface border-l border-neutral-800">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-semibold text-neutral-200">
            Chat Editor
          </h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-7 w-7 p-0 text-neutral-500 hover:text-neutral-300"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {historyLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-neutral-500" />
          </div>
        ) : history && history.length > 0 ? (
          history.map((msg: ChatMessage) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                  msg.role === "user"
                    ? "bg-accent/15 text-neutral-100"
                    : "bg-surface-elevated text-neutral-300"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[10px] text-neutral-600">
                    {formatTime(msg.created_at)}
                  </span>
                  {msg.action_type && (
                    <ActionBadge actionType={msg.action_type} />
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <Sparkles className="w-6 h-6 text-neutral-600 mx-auto mb-2" />
            <p className="text-sm text-neutral-400">
              Ask for content edits, context updates, or brief changes.
            </p>
            <div className="mt-4 space-y-2">
              {[
                "Make the tone more formal",
                "Add a call to action",
                "Shorten the text",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setInput(suggestion)}
                  className="block w-full text-left text-xs text-neutral-200 hover:text-white bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 hover:border-neutral-600 rounded-lg px-3 py-2.5 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Pending indicator */}
        {sendMessage.isPending && (
          <div className="flex justify-start">
            <div className="bg-surface-elevated rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
                <span className="text-xs text-neutral-500">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error */}
      {sendMessage.isError && (
        <div className="px-4 py-2 text-xs text-red-400 bg-red-500/5 border-t border-red-500/10">
          Error: {sendMessage.error.message}
        </div>
      )}

      {/* Input */}
      <div className="border-t border-neutral-800 p-3">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 bg-surface-elevated text-neutral-200 text-sm rounded-xl px-4 py-2.5 resize-none border border-neutral-700 focus:border-accent focus:outline-none placeholder:text-neutral-600 max-h-24 overflow-y-auto"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || sendMessage.isPending}
            size="sm"
            className="h-10 w-10 p-0 rounded-xl bg-accent hover:bg-accent/80 text-white disabled:opacity-30"
          >
            {sendMessage.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
