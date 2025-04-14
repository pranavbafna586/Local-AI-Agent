"use client";

import { useState } from "react";
import Header from "@/components/Header";
import DocumentUploader from "@/components/DocumentUploader";
import ChatInterface from "@/components/ChatInterface";

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

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
            />
          </div>
        </div>
      </div>

      <footer className="bg-gray-100 py-6">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>© {new Date().getFullYear()} LokAI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
