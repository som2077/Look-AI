"use client";

import Link from "next/link";
import {
  PlayIcon,
  TwitterLogoIcon,
  CodeIcon,
} from "@radix-ui/react-icons";

const footerLinks = {
  Product: [
    { label: "Features", href: "/features" },
    { label: "How It Works", href: "/how-it-works" },
    { label: "Pricing", href: "/pricing" },
    { label: "What's New", href: "/whats-new" },
  ],
  Style: [
    { label: "Trend Reports", href: "/trend-reports" },
    { label: "Style Quiz", href: "/style-quiz" },
  ],
  Resources: [
    { label: "Blog", href: "/blog" },
    { label: "Help Center", href: "/help-center" },
    { label: "Changelog", href: "/changelog" },
  ],
  Company: [
    { label: "About Us", href: "/about" },
    { label: "Our Mission", href: "/mission" },
  ],
  Community: [
    { label: "Request a Feature", href: "/request-feature" },
    { label: "Report a Bug", href: "/report-bug" },
    { label: "Share Feedback", href: "/feedback" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Refund Policy", href: "/refund" },
  ],
};

export default function Footer() {
  return (
    <footer className="w-full bg-white">
      {/* Top CTA Section */}
      <section className="border-t border-border bg-white">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-center gap-6 py-16 px-6 text-center">
          <h2 className="text-4xl font-bold tracking-tight text-black">
            Try now.
          </h2>
          <a
            href="#"
            className="group flex items-center gap-3 rounded-full bg-black px-8 py-4 text-white font-medium transition-colors hover:bg-zinc-900"
          >
            <PlayIcon className="h-5 w-5 flex-shrink-0" />
            Get it on Google Play
          </a>
        </div>
      </section>

      {/* Main Footer */}
      <section className="border-t border-border">
        <div className="mx-auto flex max-w-5xl flex-col gap-12 px-6 py-12 sm:flex-row sm:items-end sm:justify-between">
          {/* Left: Brand */}
          <div className="flex flex-col gap-4">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-black">
                <PlayIcon className="h-4 w-4 text-white fill-white" />
              </div>
              <span className="text-xl font-bold text-black">Look AI</span>
            </Link>
            <p className="text-sm text-zinc-600">
              Download Look AI
            </p>
            <a
              href="#"
              className="group flex items-center gap-2 rounded-full bg-black px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-900"
            >
              <PlayIcon className="h-4 w-4 flex-shrink-0 text-white fill-white" />
              Get it on Google Play
            </a>
          </div>

          {/* Main Footer - Two Columns */}
          <div className="grid grid-cols-1 gap-x-16 gap-y-12 sm:grid-cols-2 sm:gap-x-[72px]">
            {/* Left: Product, Styling, Resources */}
            <div className="grid grid-cols-3 gap-x-8 gap-y-6">
              {Object.entries(footerLinks).slice(0, 3).map(([category, links]) => (
                <div key={category} className="flex flex-col gap-3">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
                    {category}
                  </h3>
                  <ul className="flex flex-col gap-2">
                    {links.map((link) => (
                      <li key={link.label}>
                        <Link
                          href={link.href}
                          className="text-sm text-zinc-700 transition-colors hover:text-black"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Right: Company, Community, Legal */}
            <div className="grid grid-cols-3 gap-x-8 gap-y-6">
              {Object.entries(footerLinks).slice(3, 6).map(([category, links]) => (
                <div key={category} className="flex flex-col gap-3">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
                    {category}
                  </h3>
                  <ul className="flex flex-col gap-2">
                    {links.map((link) => (
                      <li key={link.label}>
                        <Link
                          href={link.href}
                          className="text-sm text-zinc-700 transition-colors hover:text-black"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Bar */}
      <section className="border-t border-border bg-white">
        <div className="mx-auto flex flex-wrap items-center justify-between gap-4 px-6 py-6 text-sm text-zinc-600 sm:justify-between">
          <p className="text-xs text-zinc-500">
            © Copyright 2026, All rights reserved
          </p>
          <div className="flex items-center gap-4">
            <a
              href="https://x.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-600 transition-colors hover:text-black"
            >
              <TwitterLogoIcon className="h-5 w-5" />
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-600 transition-colors hover:text-black"
            >
              <CodeIcon className="h-5 w-5" />
            </a>
          </div>
        </div>
      </section>
    </footer>
  );
}
