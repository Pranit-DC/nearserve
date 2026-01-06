"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { FiUser, FiLogOut, FiSettings } from "react-icons/fi";
import Link from "next/link";
import { useUserProfile } from "@/hooks/use-user-profile";

export function FirebaseUserButton() {
  const { user, signOut } = useAuth();
  const { userProfile } = useUserProfile();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [openUp, setOpenUp] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);

      // decide whether to open upward if there's not enough space below
      requestAnimationFrame(() => {
        const btn = buttonRef.current;
        const menu = dropdownRef.current?.querySelector('[data-menu]') as HTMLElement | null;
        if (!btn || !menu) return;
        const btnRect = btn.getBoundingClientRect();
        const menuHeight = menu.offsetHeight;
        const spaceBelow = window.innerHeight - btnRect.bottom;
        setOpenUp(spaceBelow < menuHeight + 8); // 8px buffer
      });
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  if (!user) return null;

  const displayName = user.displayName || userProfile?.name || user.email?.split('@')[0] || "User";
  const photoURL = user.photoURL || userProfile?.workerProfile?.profilePic;
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        ref={buttonRef}
        className="flex items-center gap-2 rounded-full hover:opacity-80 transition-opacity"
      >
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-medium ring-1 ring-gray-200 dark:ring-gray-700 hover:ring-gray-300 dark:hover:ring-gray-600 transition-all duration-200">
          {photoURL ? (
            <img src={photoURL} alt={displayName} className="w-full h-full rounded-full object-cover" />
          ) : (
            <span className="text-sm">{initials}</span>
          )}
        </div>
      </button>

      {/* Inline logout for quick access on small screens */}
      <button
        onClick={async () => {
          setIsOpen(false);
          await signOut();
        }}
        className="ml-2 md:hidden flex items-center gap-2 text-sm text-red-600 hover:opacity-80"
        aria-label="Sign out"
      >
        <FiLogOut className="w-5 h-5" />
        <span className="ml-1">Sign Out</span>
      </button>

      {isOpen && (
        <div
          data-menu
          className={`absolute right-0 w-64 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-800 z-50 ${openUp ? 'bottom-full mb-2' : 'mt-2 top-full'}`}
        >
          <div className="p-4 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-medium">
                {photoURL ? (
                  <img src={photoURL} alt={displayName} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span>{initials}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {displayName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user.email}
                </p>
              </div>
            </div>
          </div>

          <div className="py-2">
            <button
              onClick={async () => {
                setIsOpen(false);
                await signOut();
              }}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <FiLogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
