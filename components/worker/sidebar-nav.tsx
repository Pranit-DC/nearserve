"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import ProfileButton from "@/components/profile-button"
import React, { Dispatch, SetStateAction, useState, useEffect } from "react"
import { IconType } from "react-icons"
import {
  FiHome,
  FiBriefcase,
  FiUser,
  FiSettings,
  FiHelpCircle,
  FiBell,
  FiX,
  FiChevronsRight,
  FiChevronDown,
  FiSun,
  FiMoon,
  FiLogOut,
  FiGlobe
} from "react-icons/fi"
import { FaRupeeSign } from "react-icons/fa"
import { motion } from "framer-motion"
import { useTheme } from "next-themes"
import { useAuth } from "@/contexts/AuthContext"
import { FirebaseUserButton } from "@/components/firebase-user-button"
import StaggeredDropDown from "@/components/ui/staggered-dropdown"
import { NotificationBell } from "@/components/notification-bell"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";

const navigation = [
  {
    name: "Dashboard",
    href: "/worker/dashboard",
    icon: FiHome,
  },
  {
    name: "My Jobs",
    href: "/worker/job",
    icon: FiBriefcase,
  },
  {
    name: "Earnings",
    href: "/worker/earnings",
    icon: FaRupeeSign,
  },
  {
    name: "Profile",
    href: "/worker/profile",
    icon: FiUser,
  },
]

const secondaryNavigation = [
  {
    name: "Help & Support",
    href: "/worker/help",
    icon: FiHelpCircle,
  },
]

interface WorkerSidebarProps {
  onMobileClose?: () => void;
  open?: boolean;
  setOpen?: (open: boolean) => void;
}

const Option = ({
  Icon,
  title,
  href,
  pathname,
  open,
}: {
  Icon: IconType;
  title: string;
  href: string;
  pathname: string;
  open: boolean;
}) => {
  const isActive = pathname === href;

  return (
    <Link href={href}>
      <motion.button
        layout
        title={!open ? title : undefined}
        className={`relative flex h-10 w-full items-center rounded-lg transition-all duration-200 ${
          isActive 
            ? "bg-blue-50 dark:bg-gray-800/50 text-blue-600 dark:text-blue-400 shadow-sm" 
            : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/30 hover:text-gray-900 dark:hover:text-gray-200"
        }`}
      >
        <motion.div
          layout
          className="grid h-full w-10 place-content-center text-lg"
        >
          <Icon />
        </motion.div>
        {open && (
          <motion.span
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.125 }}
            className="text-sm font-medium"
          >
            {title}
          </motion.span>
        )}
      </motion.button>
    </Link>
  );
};

const ToggleClose = ({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}) => {
  return (
    <motion.button
      layout
      onClick={() => setOpen((pv) => !pv)}
      className="w-full border-t border-gray-200 dark:border-gray-700 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
    >
      <div className="flex items-center p-3">
        <motion.div
          layout
          className="grid size-10 place-content-center text-lg"
        >
          <FiChevronsRight
            className={`transition-transform text-gray-500 dark:text-gray-400 ${open && "rotate-180"}`}
          />
        </motion.div>
        {open && (
          <motion.span
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.125 }}
            className="text-xs font-medium text-gray-500 dark:text-gray-400"
          >
            Collapse
          </motion.span>
        )}
      </div>
    </motion.button>
  );
};

export function WorkerSidebar({ onMobileClose, open = true, setOpen }: WorkerSidebarProps) {
  const pathname = usePathname()
  const { theme, setTheme, systemTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const { signOut } = useAuth();
  const [currentLang, setCurrentLang] = useState('en');

  useEffect(() => setMounted(true), [])

  const languages = [
    { value: 'en', label: 'English' },
    { value: 'hi', label: 'हिन्दी' },
    { value: 'mr', label: 'मराठी' },
  ];

  const changeLanguage = (langCode: string) => {
    const select = document.querySelector('.goog-te-combo') as HTMLSelectElement;
    if (select) {
      select.value = langCode;
      select.dispatchEvent(new Event('change'));
      setCurrentLang(langCode);
      localStorage.setItem('preferredLanguage', langCode);
    }
  };

  const currentTheme = theme === "system" ? systemTheme : theme
  
  // Use internal state only if no external state is provided (for mobile)
  const [internalOpen, setInternalOpen] = useState(true)
  const isOpen = setOpen ? open : internalOpen
  const toggleOpen = setOpen ? ((newOpen: boolean | ((prev: boolean) => boolean)) => {
    if (typeof newOpen === 'function') {
      setOpen(newOpen(open))
    } else {
      setOpen(newOpen)
    }
  }) : setInternalOpen

  return (
    <motion.nav
      layout
      className="fixed left-0 top-0 h-full shrink-0 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-[#181818] flex flex-col z-40"
      style={{
        width: isOpen ? "256px" : "fit-content",
        overflow: isOpen ? "hidden" : "visible",
      }}
    >
      {/* Brand Header - Clickable to go home */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <Link href="/" aria-label="Go to Home">
            {isOpen ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center space-x-3 cursor-pointer"
              >
                <img 
                  src="/logo.svg" 
                  alt="NearServe Logo" 
                  className="w-8 h-8 object-contain filter brightness-0 dark:brightness-100 dark:invert"
                />
                <span className="font-semibold text-gray-900 dark:text-white tracking-tight">NearServe</span>
              </motion.div>
            ) : (
              <img 
                src="/logo.svg" 
                alt="NearServe Logo" 
                className="w-8 h-8 object-contain filter brightness-0 dark:brightness-100 dark:invert cursor-pointer"
              />
            )}
          </Link>
        </div>
      </div>
      
      {/* Mobile close button */}
      {onMobileClose && (
        <div className="lg:hidden flex justify-end p-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onMobileClose}
            className="h-8 w-8 p-0"
          >
            <FiX className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Navigation */}
      <div className="flex-1 space-y-2 px-3 py-4 overflow-hidden">
        {navigation.map((item) => (
          <Option
            key={item.name}
            Icon={item.icon}
            title={item.name}
            href={item.href}
            pathname={pathname}
            open={isOpen}
          />
        ))}
      </div>

      {/* Secondary Navigation */}
      <div className="space-y-2 px-3 border-t border-gray-200 dark:border-gray-700 pt-4 pb-4 overflow-visible">
        {/* Notification Bell */}
        <motion.div
          layout
          className="relative flex h-10 w-full items-center rounded-lg transition-all duration-200 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/30 hover:text-gray-900 dark:hover:text-gray-200"
        >
          <motion.div
            layout
            className="grid h-full w-10 place-content-center text-lg"
          >
            <div title={!isOpen ? "Notifications" : undefined}>
              <NotificationBell />
            </div>
          </motion.div>
          {isOpen && (
            <motion.span
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.125 }}
              className="text-sm font-medium"
            >
              Notifications
            </motion.span>
          )}
        </motion.div>
        
        {/* Theme Toggle */}
        {mounted && (
          <motion.button
            layout
            title={!isOpen ? (currentTheme === "dark" ? "Light Mode" : "Dark Mode") : undefined}
            onClick={() => setTheme(currentTheme === "dark" ? "light" : "dark")}
            className="relative flex h-10 w-full items-center rounded-lg transition-colors text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <motion.div
              layout
              className="grid h-full w-10 place-content-center text-lg"
            >
              {currentTheme === "dark" ? <FiSun /> : <FiMoon />}
            </motion.div>
            {isOpen && (
              <motion.span
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.125 }}
                className="text-sm font-medium"
              >
                {currentTheme === "dark" ? "Light Mode" : "Dark Mode"}
              </motion.span>
            )}
          </motion.button>
        )}
        
        {/* Language Switcher */}
        <motion.div
          layout
          className="relative"
          style={{ overflow: 'visible' }}
        >
          {isOpen ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.125 }}
              className="flex items-center h-10 w-full"
            >
              <div className="grid h-full w-10 place-content-center text-lg text-gray-500 dark:text-gray-400">
                <FiGlobe />
              </div>
              <div className="flex-1">
                <StaggeredDropDown
                  items={languages}
                  selected={currentLang}
                  onSelect={changeLanguage}
                  label="Language"
                />
              </div>
            </motion.div>
          ) : (
            <div className="relative flex h-10 w-full items-center justify-center">
              <StaggeredDropDown
                items={languages}
                selected={currentLang}
                onSelect={changeLanguage}
                label=""
                isCollapsed={true}
              />
            </div>
          )}
        </motion.div>

        {secondaryNavigation.map((item) => (
          <Option
            key={item.name}
            Icon={item.icon}
            title={item.name}
            href={item.href}
            pathname={pathname}
            open={isOpen}
          />
        ))}
      </div>

      {/* User Profile Section & Sign Out */}
      <div className="px-2 py-3 border-t border-gray-200 dark:border-gray-700 mb-2">
        <div className={`flex items-center ${isOpen ? 'justify-between' : 'justify-center flex-col'} gap-2`}>
          <FirebaseUserButton />
          <Dialog>
            <DialogTrigger asChild>
              <motion.button
                layout
                title={!isOpen ? "Sign Out" : undefined}
                className={`flex items-center gap-2 ${isOpen ? 'px-3 py-2' : 'p-2'} rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-gray-800 transition-colors`}
                aria-label="Sign out"
              >
                <FiLogOut className="w-4 h-4" />
                {isOpen && <span className="text-sm font-medium">Sign Out</span>}
              </motion.button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Sign Out</DialogTitle>
                <DialogDescription>
                  Are you sure you want to sign out?
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <button className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600">Cancel</button>
                </DialogClose>
                <button
                  className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
                  onClick={async () => {
                    await signOut();
                  }}
                >Sign Out</button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Collapse Button - Now at bottom but visible */}
      <ToggleClose open={isOpen} setOpen={toggleOpen} />
    </motion.nav>
  )
}
