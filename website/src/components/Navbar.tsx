"use client";

import Link from "next/link";
import { PlayIcon } from "@radix-ui/react-icons";

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-zinc-100 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black">
            <PlayIcon className="h-4 w-4 text-white fill-white" />
          </div>
          <span className="text-lg font-bold text-black">Look AI</span>
        </Link>

        {/* Navigation Links */}
        <div className="hidden items-center gap-8 sm:flex">
          <Link
            href="/features"
            className="text-sm font-medium text-zinc-700 transition-colors hover:text-black"
          >
            Features
          </Link>
          <Link
            href="/how-it-works"
            className="text-sm font-medium text-zinc-700 transition-colors hover:text-black"
          >
            How It Works
          </Link>
          <Link
            href="/pricing"
            className="text-sm font-medium text-zinc-700 transition-colors hover:text-black"
          >
            Pricing
          </Link>
          <Link
            href="/blog"
            className="text-sm font-medium text-zinc-700 transition-colors hover:text-black"
          >
            Blog
          </Link>
        </div>

        {/* CTA Button */}
        <a
          href="#"
          className="flex items-center gap-2 rounded-full bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-900 sm:px-5 sm:py-2.5"
        >
          <PlayIcon className="h-4 w-4 flex-shrink-0 text-white fill-white" />
          <span className="hidden sm:inline">Get it on</span> Google Play
        </a>
      </div>
    </nav>
  );
}
