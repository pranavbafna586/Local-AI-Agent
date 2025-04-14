"use client";

import { useState, useRef, useEffect } from "react";
import { queryGroqAPI } from "@/utils/groqApi";
import { IMessage } from "@/models/ChatHistory";
import { v4 as uuidv4 } from "uuid";
import { Send, MessageSquare } from "lucide-react";

interface ChatInterfaceProps {
  extractedText: string;
  selectedFile: File | null;
  isProcessing: boolean;
  sessionId?: string;
  onNewSession?: (sessionId: string) => void;
}

export default function ChatInterface({
  extractedText,
  selectedFile,
  isProcessing,
  sessionId: propSessionId,
  onNewSession,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [input, setInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [sessionId, setSessionId] = useState<string>(propSessionId || "");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize session or load existing session data
  useEffect(() => {
    // If a sessionId is provided via props, use that
    if (propSessionId) {
      setSessionId(propSessionId);
      loadChatHistory(propSessionId);
    } else if (selectedFile) {
      // If a new file is uploaded, create a new session
      const newSessionId = uuidv4();
      setSessionId(newSessionId);
      if (onNewSession) {
        onNewSession(newSessionId);
      }
    }
  }, [propSessionId, selectedFile]);

  // Save messages to MongoDB whenever they change
  useEffect(() => {
    if (sessionId && messages.length > 0) {
      saveChatHistory();
    }
  }, [messages, sessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadChatHistory = async (sid: string) => {
    try {
      const response = await fetch(`/api/chat-history?sessionId=${sid}`);
      const data = await response.json();

      if (data && data.messages && Array.isArray(data.messages)) {
        setMessages(data.messages);
      }
    } catch (error) {
      console.error("Error loading chat history:", error);
    }
  };

  const saveChatHistory = async () => {
    if (!sessionId || messages.length === 0) return;

    try {
      await fetch("/api/chat-history", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          documentName: selectedFile?.name || "Unnamed Document",
          documentType: selectedFile?.type || "",
          messages,
        }),
      });
    } catch (error) {
      console.error("Error saving chat history:", error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || !extractedText || isLoading) return;

    const userMessage: IMessage = {
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Use our GROQ API utility to get a response
      const response = await queryGroqAPI(input, extractedText, messages);

      const assistantMessage: IMessage = {
        role: "assistant",
        content: response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error calling GROQ API:", error);

      // Add error message
      const errorMessage: IMessage = {
        role: "assistant",
        content:
          "Sorry, I encountered an error while processing your question. Please try again.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatMessage = (message: IMessage) => {
    // Simple formatter that could be expanded to handle markdown, code, etc.
    return message.content.split("\n").map((line, i) => (
      <p key={i} className={i > 0 ? "mt-2" : ""}>
        {line}
      </p>
    ));
  };

  return (
    <div className="card h-full flex flex-col">
      <h2 className="text-xl font-semibold mb-4 flex items-center text-primary-800">
        <MessageSquare className="w-5 h-5 mr-2 text-primary-600" />
        Ask Questions
      </h2>

      <div
        className="flex-1 overflow-y-auto mb-4 custom-scrollbar bg-gray-50 rounded-lg"
        style={{ maxHeight: "500px" }}
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-500">
            {selectedFile ? (
              isProcessing ? (
                <div className="animate-pulse">
                  <p>Processing your document...</p>
                  <div className="mt-3 flex justify-center">
                    <div className="h-2 w-32 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-500 animate-[progress_1.5s_ease-in-out_infinite]"
                        style={{ width: "60%" }}
                      ></div>
                    </div>
                  </div>
                </div>
              ) : extractedText ? (
                <>
                  <MessageSquare className="w-12 h-12 text-primary-300 mb-4" />
                  <p className="font-medium mb-1">Ask your first question</p>
                  <p className="text-sm">
                    You can ask any question about the document you've uploaded.
                  </p>
                </>
              ) : (
                <p>Upload and process a document to start asking questions</p>
              )
            ) : (
              <p>Upload a document to start the conversation</p>
            )}
          </div>
        ) : (
          <div className="space-y-4 p-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                } animate-fade-in`}
              >
                <div
                  className={`max-w-3/4 rounded-lg p-4 ${
                    message.role === "user"
                      ? "chat-bubble-user"
                      : "chat-bubble-assistant"
                  }`}
                >
                  {formatMessage(message)}
                  <div className="mt-1 text-right text-xs opacity-60">
                    {message.timestamp &&
                      new Date(message.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-3/4 rounded-lg p-4 bg-gray-100">
                  <div className="flex space-x-2">
                    <div className="h-2 w-2 bg-primary-400 rounded-full animate-bounce"></div>
                    <div
                      className="h-2 w-2 bg-primary-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                    <div
                      className="h-2 w-2 bg-primary-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.4s" }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="mt-auto">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={!extractedText || isProcessing || isLoading}
            placeholder={
              !selectedFile
                ? "Upload a document first"
                : isProcessing
                ? "Processing document..."
                : "Type your question here..."
            }
            className="w-full border border-gray-300 rounded-md py-3 pl-4 pr-12 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
          />
          <button
            type="submit"
            disabled={
              !extractedText || isProcessing || !input.trim() || isLoading
            }
            className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-md ${
              !extractedText || isProcessing || !input.trim() || isLoading
                ? "text-gray-400 cursor-not-allowed"
                : "text-primary-600 hover:bg-primary-50"
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <div className="text-xs text-gray-500 mt-2 text-right">
          {sessionId && <span>Session ID: {sessionId.slice(0, 8)}</span>}
        </div>
      </form>
    </div>
  );
}
