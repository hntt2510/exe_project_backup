import { useState, useEffect, useRef, useCallback } from "react";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { sendAIChatMessage, getApiErrorMessage } from "../../services/api";

const STORAGE_KEY = "aiChatMessages";

/** Format AI response: **bold** → <strong>, list (- / *), line breaks */
function formatAIContent(content: string): React.ReactNode {
  if (!content?.trim()) return content;

  const lines = content.split(/\r?\n/);
  const result: React.ReactNode[] = [];
  let listItems: React.ReactNode[] = [];
  let listKey = 0;

  const flushList = () => {
    if (listItems.length > 0) {
      result.push(
        <ul key={`list-${listKey++}`} className="ai-chatbox__list">
          {listItems}
        </ul>
      );
      listItems = [];
    }
  };

  /** Chuyển **text** thành <strong>, giữ nguyên chữ (không uppercase) */
  const formatInline = (text: string): React.ReactNode => {
    const parts: React.ReactNode[] = [];
    const re = /\*\*(.+?)\*\*/g;
    let lastIdx = 0;
    let m;
    let k = 0;
    while ((m = re.exec(text)) !== null) {
      if (m.index > lastIdx) parts.push(text.slice(lastIdx, m.index));
      parts.push(<strong key={k++}>{m[1]}</strong>);
      lastIdx = m.index + m[0].length;
    }
    parts.push(text.slice(lastIdx));
    return parts.length === 1 ? parts[0] : <>{parts}</>;
  };

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    const isListItem = /^[\*\-]\s+/.test(trimmed);

    if (isListItem) {
      const inner = trimmed.replace(/^[\*\-]\s+/, "");
      listItems.push(
        <li key={listItems.length} className="ai-chatbox__list-item">
          {formatInline(inner)}
        </li>
      );
    } else {
      flushList();
      if (trimmed) {
        result.push(
          <p key={result.length} className="ai-chatbox__paragraph">
            {formatInline(trimmed)}
          </p>
        );
      }
    }
  }
  flushList();

  return result.length === 0 ? content : (
    <div className="ai-chatbox__formatted">{result}</div>
  );
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

function loadMessages(): ChatMessage[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveMessages(messages: ChatMessage[]) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  } catch (e) {
    console.warn("[AIChatBox] Failed to save messages:", e);
  }
}

export default function AIChatBox() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(() =>
    Boolean(localStorage.getItem("accessToken"))
  );
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    localStorage.getItem("accessToken") ? loadMessages() : []
  );
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Chỉ lưu chat khi đã đăng nhập
  useEffect(() => {
    if (isLoggedIn) saveMessages(messages);
  }, [messages, isLoggedIn]);

  // Scroll to bottom when new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  // Listen for auth changes (login/logout)
  useEffect(() => {
    const handleLogout = () => {
      setIsLoggedIn(false);
      setMessages([]);
    };
    const handleStorage = () => {
      const token = localStorage.getItem("accessToken");
      const loggedIn = Boolean(token);
      setIsLoggedIn(loggedIn);
      setMessages(loggedIn ? loadMessages() : []);
    };
    window.addEventListener("auth-logout", handleLogout);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("auth-logout", handleLogout);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const reply = await sendAIChatMessage(text);
      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: reply,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: getApiErrorMessage(err),
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } finally {
      setLoading(false);
    }
  }, [input, loading]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Hiển thị chatbox cho mọi người; chỉ lưu chat khi đã đăng nhập
  return (
    <div className="ai-chatbox">
      {/* Floating button */}
      <button
        type="button"
        className="ai-chatbox__trigger"
        onClick={() => setIsOpen((o) => !o)}
        aria-label={isOpen ? "Đóng chat" : "Mở chat AI"}
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div className="ai-chatbox__panel">
          <div className="ai-chatbox__header">
            <MessageCircle size={20} />
            <span>Trợ lý AI</span>
          </div>

          <div className="ai-chatbox__messages">
            {messages.length === 0 && !loading && (
              <div className="ai-chatbox__empty">
                Chào bạn! Tôi có thể giúp gì cho bạn về du lịch văn hóa Cội Việt?
              </div>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`ai-chatbox__message ai-chatbox__message--${msg.role}`}
              >
                <div className="ai-chatbox__message-bubble">
                  {msg.role === "assistant"
                    ? formatAIContent(msg.content)
                    : msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="ai-chatbox__message ai-chatbox__message--assistant">
                <div className="ai-chatbox__message-bubble ai-chatbox__message--typing">
                  <Loader2 size={18} className="ai-chatbox__loader" />
                  <span>Đang suy nghĩ...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="ai-chatbox__input-wrap">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nhập tin nhắn..."
              rows={1}
              disabled={loading}
              className="ai-chatbox__input"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="ai-chatbox__send"
              aria-label="Gửi"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
