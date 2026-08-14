import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, X, Send } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export default function AIChatAdvisor() {
  const { data: settings } = trpc.cms.publicContent.siteSettings.useQuery();
  const siteName = settings?.siteName?.trim() || "";
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "您好！我是 AI 清潔顧問。我可以幫您：\n• 推薦適合的清潔服務\n• 提供價格估算\n• 回答清潔相關問題\n\n請告訴我您的需求！",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!siteName) return;
    setMessages((current) => current.length === 1 && current[0]?.id === "welcome"
      ? [{ ...current[0], content: `您好！我是 ${siteName} AI 清潔顧問。我可以幫您：\n• 推薦適合的清潔服務\n• 提供價格估算\n• 回答清潔相關問題\n\n請告訴我您的需求！` }]
      : current);
  }, [siteName]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    // 添加用戶訊息
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // 調用 OpenAI API（需要後端端點）
      const response = await fetch("/api/trpc/ai.chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: input,
          conversationHistory: messages,
        }),
      });

      if (!response.ok) {
        throw new Error("API request failed");
      }

      const data = await response.json();

      // 添加 AI 回應
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response || "抱歉，我無法理解您的問題。請重新嘗試。",
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error:", error);
      toast.error("無法連接 AI 服務，請稍後重試");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* 聊天視窗 */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-96 bg-white rounded-lg shadow-2xl flex flex-col z-40 animate-in fade-in slide-in-from-bottom-2 duration-200">
          {/* 標題欄 */}
          <div className="bg-gradient-to-r from-primary to-secondary text-white p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              <h3 className="font-semibold">AI 清潔顧問</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-white/20 p-1 rounded transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* 訊息區域 */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg ${
                    msg.role === "user"
                      ? "bg-primary text-white rounded-br-none"
                      : "bg-gray-100 text-gray-800 rounded-bl-none"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg rounded-bl-none">
                  <div className="flex gap-1">
                    <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                    <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 輸入區域 */}
          <div className="border-t p-4 flex gap-2">
            <Input
              placeholder="輸入您的問題..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter" && !isLoading) {
                  handleSendMessage();
                }
              }}
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              size="sm"
              onClick={handleSendMessage}
              disabled={isLoading || !input.trim()}
              className="bg-primary hover:bg-primary/90"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* 打開聊天按鈕 */}
      {!isOpen && (
        <Button
          size="lg"
          className="fixed bottom-6 left-6 rounded-full h-14 w-14 p-0 flex items-center justify-center shadow-lg bg-primary hover:bg-primary/90 z-40 animate-bounce"
          onClick={() => setIsOpen(true)}
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}
    </>
  );
}
