"use client";

import Image from "next/image";
import Link from "next/link";

export default function Header() {
  return (
    <header className="bg-white shadow">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
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
            <button className="btn-primary">Get Started</button>
          </div>
        </div>
      </div>
    </header>
  );
}
