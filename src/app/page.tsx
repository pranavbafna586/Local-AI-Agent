"use client";
import { useState, useEffect } from "react";
import Header from "@/components/Header";
import DocumentUploader from "@/components/DocumentUploader";
import ChatInterface from "@/components/ChatInterface";
import Sidebar from "@/components/Sidebar";
import { v4 as uuidv4 } from "uuid";

export default function Home() {
  // State for document handling
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // State for sidebar and session management
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleSelectHistory = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    setIsSidebarOpen(false);
  };

  const handleNewSession = (sessionId: string) => {
    setCurrentSessionId(sessionId);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header toggleSidebar={toggleSidebar} />

      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onSelectHistory={handleSelectHistory}
        currentSessionId={currentSessionId}
      />

      <div className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-5 lg:col-span-4">
            <DocumentUploader
              selectedFile={selectedFile}
              setSelectedFile={setSelectedFile}
              setExtractedText={setExtractedText}
              isProcessing={isProcessing}
              setIsProcessing={setIsProcessing}
            />
          </div>
          <div className="md:col-span-7 lg:col-span-8">
            <ChatInterface
              extractedText={extractedText}
              selectedFile={selectedFile}
              isProcessing={isProcessing}
              sessionId={currentSessionId || undefined}
              onNewSession={handleNewSession}
            />
          </div>
        </div>
      </div>

      <footer className="bg-gray-100 py-6 mt-8">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>© {new Date().getFullYear()} LokAI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
