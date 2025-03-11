"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import ButtonSignin from "./ButtonSignin";
import logo from "@/app/icon.png";
import config from "@/config";

const links = [
  {
    href: "/#pricing",
    label: "Pricing",
  },
  {
    href: "/#testimonials",
    label: "Reviews",
  },
  {
    href: "/#faq",
    label: "FAQ",
  },
];

const cta = <ButtonSignin extraStyle="btn-primary" />;

// A header with a logo on the left, links in the center (like Pricing, etc...), and a CTA (like Get Started or Login) on the right.
// The header is responsive, and on mobile, the links are hidden behind a burger button.
const Header = () => {
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // setIsOpen(false) when the route changes (i.e: when the user clicks on a link on mobile)
  useEffect(() => {
    setIsOpen(false);
  }, [searchParams]);

  // Add scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-base-200/95 backdrop-blur-md shadow-lg" : "bg-transparent"}`}>
      <nav
        className="container flex items-center justify-between px-8 py-4 mx-auto"
        aria-label="Global"
      >
        {/* Your logo/name on large screens */}
        <div className="flex lg:flex-1">
          <Link
            className="flex items-center gap-3 shrink-0 group"
            href="/"
            title={`${config.appName} hompage`}
          >
            <div className="relative w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 transition-transform duration-300 group-hover:scale-110">
              <Image
                src={logo}
                alt={`${config.appName} logo`}
                className="w-6"
                placeholder="blur"
                priority={true}
                width={24}
                height={24}
              />
            </div>
            <span className="font-extrabold text-xl bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent">{config.appName}</span>
          </Link>
        </div>
        
        {/* Burger button to open menu on mobile */}
        <div className="flex lg:hidden">
          <button
            type="button"
            className="-m-2.5 inline-flex items-center justify-center rounded-full p-2.5 bg-base-200/80 backdrop-blur-sm border border-base-300/50 shadow-md hover:bg-base-300/80 transition-all duration-200"
            onClick={() => setIsOpen(true)}
          >
            <span className="sr-only">Open main menu</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5 text-base-content"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
              />
            </svg>
          </button>
        </div>

        {/* Your links on large screens */}
        <div className="hidden lg:flex lg:justify-center lg:gap-12 lg:items-center">
          {links.map((link) => (
            <Link
              href={link.href}
              key={link.href}
              className="relative font-medium text-base-content/80 hover:text-base-content transition-colors duration-200 px-2 py-1 group"
              title={link.label}
            >
              {link.label}
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-500 group-hover:w-full transition-all duration-300"></span>
            </Link>
          ))}
        </div>

        {/* CTA on large screens */}
        <div className="hidden lg:flex lg:justify-end lg:flex-1">
          <div className="relative group">
            {cta}
          </div>
        </div>
      </nav>

      {/* Mobile menu, show/hide based on menu state. */}
      <div className={`relative z-50 ${isOpen ? "" : "hidden"}`}>
        <div
          className={`fixed inset-y-0 right-0 z-10 w-full px-8 py-6 overflow-y-auto bg-base-200/95 backdrop-blur-md sm:max-w-sm sm:ring-1 sm:ring-neutral/10 transform origin-right transition ease-in-out duration-300 shadow-2xl`}
        >
          {/* Your logo/name on small screens */}
          <div className="flex items-center justify-between">
            <Link
              className="flex items-center gap-3 shrink-0 group"
              title={`${config.appName} hompage`}
              href="/"
            >
              <div className="relative w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 transition-transform duration-300 group-hover:scale-110">
                <Image
                  src={logo}
                  alt={`${config.appName} logo`}
                  className="w-6"
                  placeholder="blur"
                  priority={true}
                  width={24}
                  height={24}
                />
              </div>
              <span className="font-extrabold text-xl bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent">{config.appName}</span>
            </Link>
            <button
              type="button"
              className="rounded-full p-2.5 bg-base-300/50 hover:bg-base-300 transition-colors duration-200"
              onClick={() => setIsOpen(false)}
            >
              <span className="sr-only">Close menu</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Your links on small screens */}
          <div className="flow-root mt-10">
            <div className="py-6">
              <div className="flex flex-col gap-y-6 items-start">
                {links.map((link) => (
                  <Link
                    href={link.href}
                    key={link.href}
                    className="text-lg font-medium text-base-content/80 hover:text-base-content transition-colors duration-200 hover:translate-x-1 transform flex items-center gap-2"
                    title={link.label}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
            <div className="divider my-8 opacity-30"></div>
            {/* Your CTA on small screens */}
            <div className="flex flex-col">
              <div className="relative group w-full">
                {cta}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;