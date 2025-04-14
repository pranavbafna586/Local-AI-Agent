"use client";

import { useState, useRef, useEffect } from "react";
import { queryGroqAPI } from "@/utils/groqApi";

interface ChatInterfaceProps {
  extractedText: string;
  selectedFile: File | null;
  isProcessing: boolean;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ChatInterface({
  extractedText,
  selectedFile,
  isProcessing,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || !extractedText || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Use our GROQ API utility to get a response
      const response = await queryGroqAPI(input, extractedText, messages);

      const assistantMessage: Message = {
        role: "assistant",
        content: response,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error calling GROQ API:", error);

      // Add error message
      const errorMessage: Message = {
        role: "assistant",
        content:
          "Sorry, I encountered an error while processing your question. Please try again.",
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatMessage = (message: Message) => {
    // Simple formatter that could be expanded to handle markdown, code, etc.
    return message.content.split("\n").map((line, i) => (
      <p key={i} className={i > 0 ? "mt-2" : ""}>
        {line}
      </p>
    ));
  };

  return (
    <div className="card h-full flex flex-col">
      <h2 className="text-xl font-semibold mb-4">Ask Questions</h2>

      <div
        className="flex-1 overflow-y-auto mb-4"
        style={{ maxHeight: "500px" }}
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-500">
            {selectedFile ? (
              isProcessing ? (
                <p>Processing your document...</p>
              ) : extractedText ? (
                <>
                  <svg
                    className="w-12 h-12 text-primary-300 mb-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                    />
                  </svg>
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
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-3/4 rounded-lg p-4 ${
                    message.role === "user"
                      ? "bg-primary-600 text-white"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {formatMessage(message)}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-3/4 rounded-lg p-4 bg-gray-100">
                  <div className="flex space-x-2">
                    <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div
                      className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                    <div
                      className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"
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
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}
