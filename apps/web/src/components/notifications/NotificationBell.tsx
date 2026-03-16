'use client';

import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useSubscription } from '@apollo/client';
import { useRouter } from 'next/navigation';
import { MY_NOTIFICATIONS_QUERY, UNREAD_COUNT_QUERY } from '@/graphql/queries/notification.queries';
import {
  MARK_NOTIFICATION_READ_MUTATION,
  MARK_ALL_READ_MUTATION,
  DELETE_NOTIFICATION_MUTATION,
} from '@/graphql/mutations/notification.mutations';
import { NOTIFICATION_RECEIVED_SUBSCRIPTION } from '@/graphql/subscriptions/notification.subscriptions';

const typeIcon: Record<string, string> = {
  TASK_ASSIGNED: '👤',
  TASK_COMMENTED: '💬',
  TASK_MENTIONED: '@',
  TASK_DUE_SOON: '⏰',
  MEMBER_INVITED: '✉️',
  MEMBER_JOINED: '🎉',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const { data: notifData, refetch: refetchNotifs } = useQuery(MY_NOTIFICATIONS_QUERY);
  const { data: countData, refetch: refetchCount } = useQuery(UNREAD_COUNT_QUERY);

  const [markRead] = useMutation(MARK_NOTIFICATION_READ_MUTATION);
  const [markAllRead] = useMutation(MARK_ALL_READ_MUTATION);
  const [deleteNotif] = useMutation(DELETE_NOTIFICATION_MUTATION);

  // Real-time subscription
  useSubscription(NOTIFICATION_RECEIVED_SUBSCRIPTION, {
    onData: () => {
      refetchNotifs();
      refetchCount();
    },
  });

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const notifications = notifData?.myNotifications ?? [];
  const unreadCount = countData?.unreadNotificationCount ?? 0;

  const handleNotifClick = async (notif: any) => {
    if (!notif.isRead) {
      await markRead({ variables: { id: notif.id } });
      refetchCount();
    }
    setOpen(false);
    if (notif.resourceType === 'task' && notif.resourceId) {
      // Task detail is shown via modal on the project page;
      // navigate to the project containing the task (resourceId = taskId)
    }
  };

  const handleMarkAll = async () => {
    await markAllRead();
    refetchNotifs();
    refetchCount();
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteNotif({ variables: { id } });
    refetchNotifs();
    refetchCount();
  };

  return (
    <div className="relative" ref={dropRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        title="Notifications"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-10 w-80 bg-white rounded-xl shadow-xl border z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <span className="text-sm font-semibold text-gray-900">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAll}
                className="text-xs text-blue-600 hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto divide-y">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-2xl mb-2">🔔</p>
                <p className="text-sm text-gray-500">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notif: any) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotifClick(notif)}
                  className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                    !notif.isRead ? 'bg-blue-50/60' : ''
                  }`}
                >
                  {/* Icon */}
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm flex-shrink-0 mt-0.5">
                    {typeIcon[notif.type] ?? '🔔'}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium ${!notif.isRead ? 'text-gray-900' : 'text-gray-600'} line-clamp-1`}>
                      {notif.title}
                    </p>
                    <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{notif.body}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{timeAgo(notif.createdAt)}</p>
                  </div>

                  {/* Unread dot + delete */}
                  <div className="flex items-center gap-1.5 flex-shrink-0 mt-1">
                    {!notif.isRead && (
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                    )}
                    <button
                      onClick={(e) => handleDelete(e, notif.id)}
                      className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-gray-500 text-xs"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="px-4 py-2 border-t">
              <p className="text-xs text-gray-400 text-center">{notifications.length} notifications</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
