import { useState, useEffect, useRef } from "react";
import api from "../api";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import toast from "react-hot-toast";

function TableChat({ tableId, initialChatHistory = [] }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(initialChatHistory);
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    setMessages(initialChatHistory);
  }, [tableId]);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open]);

  async function loadChatHistory() {
    if (!tableId) return;
    try {
      setLoadingHistory(true);
      const res = await api.get(`/api/tables/${tableId}/chat`);
      setMessages(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  }

  function toggleOpen() {
    const next = !open;
    setOpen(next);
    if (next && messages.length === 0) {
      loadChatHistory();
    }
  }

  async function handleAsk() {
    const q = question.trim();
    if (!q || !tableId) return;

    setMessages(prev => [...prev, { role: "user", text: q, createdAt: new Date() }]);
    setQuestion("");
    setAsking(true);

    try {
      const res = await api.post(`/api/tables/${tableId}/chat`, { question: q });
      setMessages(res.data.chatHistory || []);
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || "Failed to get an answer";
      toast.error(msg);
      setMessages(prev => [
        ...prev,
        { role: "assistant", text: "Sorry, something went wrong. Please try again.", createdAt: new Date() },
      ]);
    } finally {
      setAsking(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  }

  if (!tableId) return null;

  return (
    <div className="mt-6 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
      <button
        onClick={toggleOpen}
        className="w-full flex items-center justify-between px-5 py-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
      >
        <span className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
          💬 Ask about this table
        </span>
        <span className="text-gray-400 dark:text-gray-500">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="bg-white dark:bg-gray-900 transition-colors duration-300">
          {/* Messages */}
          <div className="max-h-96 overflow-y-auto p-5 space-y-4">
            {loadingHistory ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : messages.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-6">
                Ask anything about this table — e.g. "What is the total debit amount?" or "Which row has the highest balance?"
              </p>
            ) : (
              messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                      m.role === "user"
                        ? "bg-blue-600 text-white rounded-br-sm"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-sm"
                    }`}
                  >
                    {m.role === "assistant" ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:m-0">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
                            strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                            ul: ({ children }) => <ul className="list-disc ml-4 mb-1">{children}</ul>,
                            li: ({ children }) => <li className="mb-0.5">{children}</li>,
                            table: ({ children }) => (
                              <table className="border-collapse text-xs mt-1 mb-1">{children}</table>
                            ),
                            th: ({ children }) => (
                              <th className="border border-gray-400 px-2 py-1 font-semibold">{children}</th>
                            ),
                            td: ({ children }) => (
                              <td className="border border-gray-400 px-2 py-1">{children}</td>
                            ),
                          }}
                        >
                          {m.text}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      m.text
                    )}
                  </div>
                </div>
              ))
            )}

            {asking && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-sm px-4 py-2.5 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"></span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="flex items-end gap-2 p-4 border-t border-gray-200 dark:border-gray-800">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question about this table..."
              rows={1}
              disabled={asking}
              className="flex-1 resize-none border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
            />
            <button
              onClick={handleAsk}
              disabled={asking || !question.trim()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              {asking ? "..." : "Send"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default TableChat;
