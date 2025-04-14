"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IChatHistory } from "@/models/ChatHistory";
import { formatDistanceToNow } from 'date-fns';
import { X, Clock, Trash2, MessageSquare, FileText } from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectHistory: (sessionId: string) => void;
  currentSessionId: string | null;
}

export default function Sidebar({ 
  isOpen, 
  onClose, 
  onSelectHistory,
  currentSessionId
}: SidebarProps) {
  const [histories, setHistories] = useState<IChatHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchChatHistories();
    }
  }, [isOpen]);

  const fetchChatHistories = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/chat-history');
      const data = await response.json();
      setHistories(data);
    } catch (error) {
      console.error('Error fetching chat histories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteHistory = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`/api/chat-history?sessionId=${sessionId}`, {
        method: 'DELETE',
      });
      // Update the local state to remove the deleted history
      setHistories(histories.filter(history => history.sessionId !== sessionId));
    } catch (error) {
      console.error('Error deleting history:', error);
    }
  };

  const formatTimestamp = (date: string | Date) => {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return formatDistanceToNow(dateObj, { addSuffix: true });
    } catch (error) {
      return 'Unknown date';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-40 md:hidden"
            onClick={onClose}
          />
          
          {/* Sidebar */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.2 }}
            className="fixed top-0 left-0 bottom-0 w-80 bg-white z-50 shadow-xl flex flex-col border-r border-gray-200"
          >
            <div className="flex items-center justify-between bg-primary-600 text-white p-4">
              <h2 className="text-lg font-semibold">Conversation History</h2>
              <button 
                onClick={onClose}
                className="p-1 rounded-full hover:bg-primary-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
              {isLoading ? (
                <div className="flex justify-center items-center h-24">
                  <div className="animate-pulse flex space-x-2">
                    <div className="h-3 w-3 bg-primary-400 rounded-full"></div>
                    <div className="h-3 w-3 bg-primary-400 rounded-full delay-75"></div>
                    <div className="h-3 w-3 bg-primary-400 rounded-full delay-150"></div>
                  </div>
                </div>
              ) : histories.length === 0 ? (
                <div className="text-center p-6 text-gray-500">
                  <MessageSquare className="w-12 h-12 mx-auto mb-2 text-primary-300" />
                  <p>No conversation history yet</p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {histories.map((history) => (
                    <li 
                      key={history.sessionId}
                      onClick={() => onSelectHistory(history.sessionId)}
                      className={`p-3 rounded-lg cursor-pointer transition-colors relative animate-fade-in ${
                        currentSessionId === history.sessionId 
                          ? 'bg-primary-50 border border-primary-200' 
                          : 'hover:bg-gray-50 border border-transparent'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`rounded-lg p-2 ${
                          currentSessionId === history.sessionId 
                            ? 'bg-primary-100' 
                            : 'bg-gray-100'
                        }`}>
                          <FileText size={18} className={`${
                            currentSessionId === history.sessionId 
                              ? 'text-primary-600' 
                              : 'text-gray-600'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">
                            {history.documentName || "Unnamed Document"}
                          </h3>
                          <p className="text-sm text-gray-500 truncate">
                            {history.messages.length} messages
                          </p>
                          <div className="flex items-center mt-1 text-xs text-gray-500">
                            <Clock size={12} className="mr-1" />
                            {formatTimestamp(history.updatedAt)}
                          </div>
                        </div>
                        <button
                          onClick={(e) => deleteHistory(history.sessionId, e)}
                          className="p-1.5 rounded-full hover:bg-gray-200 transition-colors text-gray-400 hover:text-red-500"
                          title="Delete conversation"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            
            <div className="p-4 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  <span className="font-medium text-primary-600">LokAI</span> Document Assistant
                </div>
                <div className="flex items-center text-xs text-gray-500">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                  Connected
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
