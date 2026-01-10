'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/hooks/use-notifications';
import { FiBell, FiCheckCircle, FiClock, FiX, FiDollarSign, FiBriefcase, FiAlertCircle, FiInfo } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';

export function NotificationBell({ isExpanded = false }: { isExpanded?: boolean }) {
  const { user } = useAuth();
  const { notifications, unreadCount, loading } = useNotifications({
    userId: user?.uid || null,
    enabled: !!user?.uid,
    maxNotifications: 50,
  });
  
  const [isOpen, setIsOpen] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'unread'>('all');
  const router = useRouter();

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId }),
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
      });
      if (res.ok) {
        toast.success('All notifications marked as read');
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Failed to mark notifications as read');
    }
  };

  const handleNotificationClick = async (notification: any) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
      setIsOpen(false);
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const filteredNotifications = filterType === 'unread' 
    ? notifications.filter(n => !n.read)
    : notifications;

  const getNotificationIcon = (title: string) => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('payment')) return FiDollarSign;
    if (lowerTitle.includes('job') || lowerTitle.includes('request') || lowerTitle.includes('booking')) return FiBriefcase;
    if (lowerTitle.includes('alert') || lowerTitle.includes('warning')) return FiAlertCircle;
    return FiInfo;
  };

  const stripEmojis = (text: string) => {
    return text.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '').trim();
  };

  return (
    <>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="relative w-full p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-2"
        aria-label="Notifications"
      >
        <FiBell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        
        {isExpanded && (
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 text-left min-w-48">
            Notifications
          </span>
        )}
        
        {/* Unread Badge */}
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </button>

      {/* Notifications Drawer */}
      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerContent className="bg-white dark:bg-[#181818] border-0 dark:border-[#232323] flex flex-col w-full max-w-[900px] mx-auto max-h-[90vh]">
          {/* Header */}
          <DrawerHeader className="border-b border-gray-200 dark:border-[#232323] pt-4">
            <div className="flex items-center justify-between">
              <div>
                <DrawerTitle className="text-xl font-bold text-gray-900 dark:text-white">
                  Notifications
                </DrawerTitle>
                {unreadCount > 0 && (
                  <DrawerDescription className="text-gray-600 dark:text-gray-400">
                    {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                  </DrawerDescription>
                )}
              </div>
              <DrawerClose asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <FiX className="h-5 w-5" />
                </Button>
              </DrawerClose>
            </div>
          </DrawerHeader>

          {/* Filter Tabs */}
          <div className="flex gap-2 px-4 py-3 border-b border-gray-200 dark:border-[#232323]">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                filterType === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-[#232323] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#2c2c2c]'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType('unread')}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                filterType === 'unread'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-[#232323] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#2c2c2c]'
              }`}
            >
              Unread {unreadCount > 0 && `(${unreadCount})`}
            </button>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <div className="animate-spin w-6 h-6 border-2 border-gray-300 dark:border-gray-600 border-t-blue-600 rounded-full mx-auto"></div>
                <p className="mt-2 text-sm">Loading...</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <FiBell className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">
                  {filterType === 'unread' ? 'All caught up!' : 'No notifications yet'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-[#232323]">
                {filteredNotifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 cursor-pointer transition-colors border-l-4 ${
                      !notification.read
                        ? 'border-l-blue-600 bg-blue-50 dark:bg-[#1f1f1f] hover:bg-blue-100 dark:hover:bg-[#232323]'
                        : 'border-l-transparent hover:bg-gray-50 dark:hover:bg-[#1f1f1f]'
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {(() => {
                          const IconComponent = getNotificationIcon(notification.title);
                          return <IconComponent className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
                        })()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold ${
                          !notification.read
                            ? 'text-gray-900 dark:text-white'
                            : 'text-gray-700 dark:text-gray-300'
                        }`}>
                          {stripEmojis(notification.title)}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <FiClock className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                          <span className="text-xs text-gray-500 dark:text-gray-500">
                            {formatTime(notification.createdAt)}
                          </span>
                          {notification.read && (
                            <>
                              <span className="text-gray-400">•</span>
                              <FiCheckCircle className="w-3 h-3 text-gray-400" />
                              <span className="text-xs text-gray-500 dark:text-gray-500">Read</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {unreadCount > 0 && (
            <DrawerFooter className="border-t border-gray-200 dark:border-[#232323] py-3">
              <Button
                onClick={markAllAsRead}
                variant="outline"
                className="border-gray-200 dark:border-[#232323] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#232323]"
              >
                Mark all as read
              </Button>
            </DrawerFooter>
          )}
        </DrawerContent>
      </Drawer>
    </>
  );
}
