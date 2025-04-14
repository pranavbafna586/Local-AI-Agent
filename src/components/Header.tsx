"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu } from "lucide-react";

interface HeaderProps {
  toggleSidebar: () => void;
}

export default function Header({ toggleSidebar }: HeaderProps) {
  return (
    <header className="bg-white shadow sticky top-0 z-30">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-md hover:bg-gray-100 transition-colors"
              aria-label="Toggle sidebar"
            >
              <Menu size={24} className="text-gray-700" />
            </button>

            <div className="flex items-center space-x-2">
              <div className="h-10 w-10 relative">
                <svg
                  className="w-full h-full text-primary-600"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">LokAI</h1>
            </div>
          </div>

          <nav className="hidden md:flex space-x-8">
            <Link
              href="/"
              className="text-gray-600 hover:text-primary-600 font-medium"
            >
              Home
            </Link>
            <Link
              href="/#about"
              className="text-gray-600 hover:text-primary-600 font-medium"
            >
              About
            </Link>
            <Link
              href="/#features"
              className="text-gray-600 hover:text-primary-600 font-medium"
            >
              Features
            </Link>
          </nav>

          <div className="flex items-center space-x-4">
            <button className="hidden md:block bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-md transition-colors">
              Get Started
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
