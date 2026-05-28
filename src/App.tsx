/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { io } from 'socket.io-client';
import { 
  MessageSquare, 
  BookOpen, 
  User, 
  Bell, 
  ShieldCheck, 
  LogOut, 
  Sparkles, 
  HelpCircle, 
  Info, 
  ShieldAlert, 
  CheckCircle,
  Hash,
  Activity
} from 'lucide-react';

import { User as UserType, Notification as NotificationType } from './types';
import AuthPage from './components/AuthPage';
import ForumFeed from './components/ForumFeed';
import PostDetails from './components/PostDetails';
import ChatRoom from './components/ChatRoom';
import ProfileTab from './components/ProfileTab';
import ModQueue from './components/ModQueue';

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('forum_token'));
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  
  // Dashboard states
  const [currentTab, setCurrentTab] = useState<'feed' | 'chat' | 'profile' | 'moderation'>('feed');
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  // Socket & Presence State
  const [socket, setSocket] = useState<any>(null);
  const [onlineUsers, setOnlineUsers] = useState<UserType[]>([]);

  // Notifications State
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ title: string; text: string; kind: string } | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Validate session on launch
  useEffect(() => {
    if (token) {
      fetch('/api/users/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Session login failed.');
      })
      .then(user => {
        setCurrentUser(user);
        fetchNotifications(token);
      })
      .catch(() => {
        // Clear expired tokens safely
        handleLogout();
      });
    }
  }, [token]);

  // Handle Dynamic Sockets Authentication
  useEffect(() => {
    if (!token) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    // Connect to same origin behind the Cloud Run container proxy port 3000
    const s = io();
    
    s.on('connect', () => {
      console.log('Socket network connection active.');
      s.emit('auth:socket', { token });
    });

    s.on('auth:success', ({ user }: { user: UserType }) => {
      console.log('Socket handshake authenticated:', user.name);
    });

    s.on('presence:list', (list: UserType[]) => {
      setOnlineUsers(list);
    });

    s.on('message:new', (msg: any) => {
      // Trigger a real subtle visual toast notification when messages land in other channels or rooms
      if (currentTab !== 'chat') {
        showLocalToast({
          title: `New Chat Message 💬`,
          text: `In channel: ${msg.authorName} says "${msg.text?.substring(0, 20)}..."`,
          kind: 'system'
        });
      }
    });

    s.on('auth:error', (error: any) => {
      console.error('Socket authentication failed:', error.message);
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, [token]);

  // Sync notifications logs
  const fetchNotifications = (authToken: string) => {
    fetch('/api/notifications', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    })
    .then(res => res.json())
    .then(data => {
      if (Array.isArray(data)) setNotifications(data);
    })
    .catch(err => console.error('Error listing notifications:', err));
  };

  // Add Local Alert notifications trigger
  const showLocalToast = (notif: { title: string; text: string; kind: string }) => {
    setToastMessage(notif);
    
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 4500);

    // Refresh notifications stack
    if (token) fetchNotifications(token);
  };

  // Clear incoming counters
  const handleMarkNotificationsAsRead = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/notifications/read-all', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, seen: true })));
      }
    } catch (err) {
      console.error('Error clearing receipts:', err);
    }
  };

  const handleAuthSuccess = (newToken: string, user: UserType) => {
    localStorage.setItem('forum_token', newToken);
    setToken(newToken);
    setCurrentUser(user);
    fetchNotifications(newToken);
    showLocalToast({
      title: 'Greetings Developer! 👋',
      text: 'You have entered the active discussion cohort workspace successfully.',
      kind: 'system'
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('forum_token');
    setToken(null);
    setCurrentUser(null);
    setOnlineUsers([]);
    setNotifications([]);
    setCurrentTab('feed');
    setSelectedPostId(null);
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
  };

  const unreadCount = notifications.filter(n => !n.seen).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased selection:bg-indigo-600 selection:text-white">
      {/* Dynamic Toast Notice Alerts */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            id="toast-notification-banner"
            initial={{ opacity: 0, y: -40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-55 w-full max-w-sm px-4"
          >
            <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-xl border border-slate-700 flex gap-3">
              <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div className="flex-1 text-xs">
                <span className="font-bold text-slate-100 block">{toastMessage.title}</span>
                <span className="text-slate-400 mt-1 block">{toastMessage.text}</span>
              </div>
              <button 
                onClick={() => setToastMessage(null)} 
                className="text-slate-500 hover:text-white font-black text-xs px-1 shrink-0 self-start"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Primary Top Header Navigation */}
      <header id="main-app-header" className="sticky top-0 z-40 bg-white border-b border-slate-200/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600 text-white font-heavy">
              <Activity className="w-5 h-5" />
            </span>
            <div className="leading-tight">
              <h1 className="text-[13px] font-black tracking-tight text-slate-900 font-sans uppercase">
                COMMUNITY DEV
              </h1>
              <p className="text-[10px] text-indigo-600 font-bold tracking-wide">
                Cohort Discussion & Live Chat
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {token && currentUser ? (
              <div className="flex items-center gap-4">
                {/* Real-time Notifications dropdown bell wrapper */}
                <div className="relative">
                  <button
                    id="btn-bell-dropdown"
                    onClick={() => {
                      setShowNotificationDropdown(!showNotificationDropdown);
                      if (!showNotificationDropdown) handleMarkNotificationsAsRead();
                    }}
                    className={`p-2 rounded-xl transition-all relative ${
                      showNotificationDropdown || unreadCount > 0
                        ? 'bg-slate-100 text-slate-800' 
                        : 'text-slate-500 hover:bg-slate-50/80'
                    }`}
                  >
                    <Bell className="w-4.5 h-4.5" />
                    {unreadCount > 0 && (
                      <span id="badge-notif-count" className="absolute top-1 right-1 w-4 h-4 bg-red-650 text-white rounded-full text-[9px] font-bold flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  <AnimatePresence>
                    {showNotificationDropdown && (
                      <motion.div
                        id="notifications-dropdown-menu"
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.98 }}
                        className="absolute right-0 mt-2.5 w-80 bg-white border border-slate-200 shadow-xl rounded-2xl overflow-hidden z-50 py-1"
                      >
                        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-150 flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">Cohort Inbox</span>
                          <button 
                            onClick={() => { handleMarkNotificationsAsRead(); setShowNotificationDropdown(false); }}
                            className="text-[10px] text-indigo-600 font-bold hover:underline"
                          >
                            Mark All Read
                          </button>
                        </div>

                        <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                          {notifications.length === 0 ? (
                            <div className="p-6 text-center text-xs text-slate-400">
                              Your inbox is empty. No recent replies.
                            </div>
                          ) : (
                            notifications.map(notif => (
                              <div 
                                key={notif.id} 
                                className={`p-3.5 hover:bg-slate-50/50 transition-colors text-xs flex gap-2 w-full text-left ${
                                  !notif.seen ? 'bg-indigo-50/10' : ''
                                }`}
                              >
                                <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                                <div className="space-y-0.5">
                                  <span className="font-bold text-slate-800">{notif.title}</span>
                                  <span className="text-slate-500 mt-0.5 block">{notif.text}</span>
                                  <span className="text-[9px] text-slate-350 block">{new Date(notif.createdAt).toLocaleDateString()}</span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Logged in User Tag details */}
                <div className="hidden sm:flex items-center gap-2 bg-slate-50 p-1.5 border border-slate-200/80 rounded-xl">
                  <img 
                    src={currentUser.avatarUrl} 
                    alt={currentUser.name} 
                    className="w-7 h-7 rounded-lg bg-white shrink-0 border border-slate-200" 
                    referrerPolicy="no-referrer"
                  />
                  <div className="text-[10px]">
                    <div className="font-bold text-slate-800">{currentUser.name}</div>
                    <div className="text-slate-400 text-[9px] uppercase tracking-wider">{currentUser.role} Account</div>
                  </div>
                </div>

                {/* Log out CTA button */}
                <button
                  id="btn-logout-trigger"
                  onClick={handleLogout}
                  title="Sign Out"
                  className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                >
                  <LogOut className="w-4.5 h-4.5" />
                </button>
              </div>
            ) : (
              <span className="text-xs text-slate-500 font-medium">Guest User Mode</span>
            )}
          </div>

        </div>
      </header>

      {/* Main Structural Layout Dashboard wrapper */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6" id="dashboard-workspace">
        {!token ? (
          <div className="max-w-md mx-auto py-8">
            <AuthPage onAuthSuccess={handleAuthSuccess} />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Left Hand Navigation Rail panel */}
            <nav id="left-sidebar-navigation" className="col-span-1 bg-white border border-slate-200 rounded-2xl p-4 h-fit space-y-1">
              <div className="px-3 pb-2.5 mb-1.5 border-b border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Dashboard Rails</span>
              </div>

              <button
                id="tab-btn-feed"
                onClick={() => { setCurrentTab('feed'); setSelectedPostId(null); }}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  currentTab === 'feed'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-650 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <BookOpen className="w-4.5 h-4.5" />
                  <span>Cohort Discussion Feed</span>
                </div>
              </button>

              <button
                id="tab-btn-chat"
                onClick={() => { setCurrentTab('chat'); setSelectedPostId(null); }}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  currentTab === 'chat'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-650 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <MessageSquare className="w-4.5 h-4.5" />
                  <span>Real-Time Channels</span>
                </div>
                {onlineUsers.length > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${currentTab === 'chat' ? 'bg-indigo-700 text-indigo-10s' : 'bg-green-50 text-green-700'}`}>
                    {onlineUsers.length} online
                  </span>
                )}
              </button>

              <button
                id="tab-btn-profile"
                onClick={() => { setCurrentTab('profile'); setSelectedPostId(null); }}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  currentTab === 'profile'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-650 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <User className="w-4.5 h-4.5" />
                  <span>Manage Profile Card</span>
                </div>
              </button>

              {currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'MOD') && (
                <button
                  id="tab-btn-moderation"
                  onClick={() => { setCurrentTab('moderation'); setSelectedPostId(null); }}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    currentTab === 'moderation'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-650 hover:bg-slate-50 border border-amber-200 bg-amber-50/10'
                  }`}
                >
                  <div className="flex items-center gap-2.5 text-amber-900">
                    <ShieldAlert className="w-4.5 h-4.5 text-amber-600" />
                    <span>Moderation Hub</span>
                  </div>
                </button>
              )}

              {/* Informative Cohort Static card */}
              <div className="pt-4 mt-4 border-t border-slate-100 p-3 bg-slate-50 rounded-xl space-y-1.5 text-[10px] text-slate-500">
                <div className="font-bold text-slate-705 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-indigo-505" />
                  <span>Interactive Proof Case</span>
                </div>
                <p>This workspace connects to live services running in real time. Launch threads, test key handshakes, or chat dynamically with Gemini bot!</p>
              </div>
            </nav>

            {/* Central Content Panel */}
            <div id="central-view-workspace" className="col-span-1 lg:col-span-3">
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedPostId ? `post-${selectedPostId}` : currentTab}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                >
                  {selectedPostId ? (
                    <PostDetails 
                      postId={selectedPostId} 
                      token={token} 
                      currentUser={currentUser} 
                      onBack={() => setSelectedPostId(null)}
                      onAddNotification={showLocalToast}
                    />
                  ) : currentTab === 'feed' ? (
                    <ForumFeed 
                      token={token} 
                      currentUser={currentUser} 
                      onSelectPost={(id) => setSelectedPostId(id)}
                      onAddNotification={showLocalToast}
                    />
                  ) : currentTab === 'chat' ? (
                    <ChatRoom 
                      socket={socket} 
                      currentUser={currentUser} 
                      onlineUsers={onlineUsers} 
                      onAddNotification={showLocalToast}
                    />
                  ) : currentTab === 'profile' ? (
                    <ProfileTab 
                      token={token} 
                      currentUser={currentUser} 
                      onUpdateUser={(updated) => setCurrentUser(updated)}
                      onAddNotification={showLocalToast}
                    />
                  ) : currentTab === 'moderation' ? (
                    <ModQueue 
                      token={token} 
                      currentUser={currentUser} 
                      onAddNotification={showLocalToast}
                    />
                  ) : (
                    <div className="text-center text-xs py-8">Section pending construction.</div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}
