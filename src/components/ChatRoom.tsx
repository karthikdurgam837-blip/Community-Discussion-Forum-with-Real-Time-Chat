/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Send, Users, Sparkles, Volume2, ShieldCheck, MessageSquare, BookOpen, User, Hash } from 'lucide-react';
import { Room, Message, User as UserType } from '../types';

interface ChatRoomProps {
  socket: any; // Socket.io instance from App
  currentUser: UserType | null;
  onlineUsers: UserType[];
  onAddNotification: (notif: { title: string; text: string; kind: string }) => void;
}

export default function ChatRoom({ socket, currentUser, onlineUsers, onAddNotification }: ChatRoomProps) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string>('room-general');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>('ARCHITECT');
  
  // Typing state for other users in the room
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load chat channels
  useEffect(() => {
    // Rooms are static from our database seeder
    const channels: Room[] = [
      { id: 'room-announcements', kind: 'CHANNEL', name: '📢 announcements', slug: 'announcements', desc: 'Broadcast forum updates & staff guidelines.', members: [] },
      { id: 'room-general', kind: 'CHANNEL', name: '💬 general-chat', slug: 'general-chat', desc: 'Settle in, hang out, and chat with other cohorts.', members: [] },
      { id: 'room-tech', kind: 'CHANNEL', name: '💻 tech-dev', slug: 'tech-dev', desc: 'Debug blocks, discuss modules, and share links.', members: [] },
      { id: 'room-ai-assistant', kind: 'CHANNEL', name: '🤖 ai-assistant', slug: 'ai-assistant', desc: 'Converse directly with Gemini Assistant in real time.', members: [] },
    ];
    setRooms(channels);

    // Initial message loader from server for the room
    fetchMessagesForRoom(selectedRoomId);
  }, [selectedRoomId]);

  const fetchMessagesForRoom = (roomId: string) => {
    // Fetch initial persistent log of messages
    // Wait, the API doesn't have an explicit bulk messages endpoint, but we can easily add on/emits if needed, or query '/api/messages'
    // To make it immediately responsive, we can fetch from an endpoint or load from server
    fetch(`/api/messages/${roomId}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setMessages(data);
      })
      .catch(err => console.error('Error fetching chat logs:', err));
  };

  // Socket routing and handling on currentRoom edits
  useEffect(() => {
    if (!socket) return;

    // Join room
    socket.emit('room:join', selectedRoomId);

    // Message receiver event
    const handleNewMessage = (msg: Message) => {
      if (msg.roomId === selectedRoomId) {
        setMessages(prev => {
          // Prevent duplicates
          if (prev.some(p => p.id === msg.id)) return prev;
          return [...prev, msg];
        });
        scrollToBottom();
      }
    };

    // Typing changes event
    const handleTypingStatus = (data: { roomId: string; userName: string; isTyping: boolean }) => {
      if (data.roomId === selectedRoomId) {
        setTypingUsers(prev => ({
          ...prev,
          [data.userName]: data.isTyping
        }));
      }
    };

    socket.on('message:new', handleNewMessage);
    socket.on('typing:status', handleTypingStatus);

    return () => {
      socket.emit('room:leave', selectedRoomId);
      socket.off('message:new', handleNewMessage);
      socket.off('typing:status', handleTypingStatus);
    };
  }, [socket, selectedRoomId]);

  // Scroll to bottom helper
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 60);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle typing key presses
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    if (!socket || !currentUser) return;

    // Trigger typing event start
    socket.emit('typing:start', { roomId: selectedRoomId, userName: currentUser.name });

    // Throttle typing stop event
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing:stop', { roomId: selectedRoomId, userName: currentUser.name });
    }, 1500);
  };

  // Dispatch Socket Send Message
  const handleSendMessageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    if (!currentUser) {
      onAddNotification({
        title: 'Sign In Required ⚠️',
        text: 'You must authenticate to publish live messages!',
        kind: 'system'
      });
      return;
    }

    // Direct emitting with preferred assistant persona
    socket.emit('message:send', {
      roomId: selectedRoomId,
      text: inputText.trim(),
      personaId: selectedPersonaId
    });

    // Reset local typing indicator manually
    if (socket) {
      socket.emit('typing:stop', { roomId: selectedRoomId, userName: currentUser.name });
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    setInputText('');
  };

  // Get list of typing names
  const activeTypistNames = Object.entries(typingUsers)
    .filter(([_, isTyping]) => isTyping)
    .map(([name, _]) => name);

  // Active channel details
  const activeRoom = rooms.find(r => r.id === selectedRoomId);

  return (
    <div id="chat-tab-layout" className="grid grid-cols-1 md:grid-cols-4 border border-slate-200 bg-white rounded-2xl overflow-hidden min-h-[68vh]">
      
      {/* Sidebar Channel Navigator */}
      <div id="chat-channels-col" className="md:col-span-1 bg-slate-50 border-r border-slate-200 p-4 space-y-4">
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
            Cohort Rooms
          </h3>
          <div className="space-y-1">
            {rooms.map(room => (
              <button
                key={room.id}
                id={`channel-${room.slug}`}
                onClick={() => setSelectedRoomId(room.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all text-left ${
                  selectedRoomId === room.id 
                    ? 'bg-indigo-600 text-white shadow-xs' 
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Hash className="w-3.5 h-3.5 opacity-65 shrink-0" />
                <span className="truncate">{room.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Live Cohort presence panel */}
        <div id="chat-presence-box" className="pt-2 border-t border-slate-200">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
            <Users className="w-3.5 h-3.5" />
            <span>Online Students ({onlineUsers.length})</span>
          </div>
          <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
            {onlineUsers.length === 0 ? (
              <p className="text-[10px] text-slate-450 italic">Connected members directory empty.</p>
            ) : (
              onlineUsers.map(user => (
                <div key={user.id} className="flex items-center gap-2 bg-white p-1.5 border border-slate-200 rounded-lg shadow-2xs">
                  <div className="relative shrink-0">
                    <img src={user.avatarUrl} alt={user.name} className="w-6 h-6 rounded bg-slate-150" referrerPolicy="no-referrer" />
                    <span className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 border border-white rounded-full" />
                  </div>
                  <div className="text-[10px] truncate flex-1">
                    <div className="font-bold text-slate-800 flex items-center gap-1">
                      {user.name.substring(0, 16)}
                      {user.role !== 'MEMBER' && (
                        <span className="bg-slate-900 text-white text-[8px] font-extrabold px-1 rounded">STAFF</span>
                      )}
                    </div>
                    <div className="text-slate-400 text-[8px] truncate">{user.bio || 'MERN developer'}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Main Conversation Window */}
      <div id="chat-interactive-col" className="md:col-span-3 flex flex-col bg-slate-50/20">
        {/* Active room Header */}
        <div className="px-5 py-3.5 bg-white border-b border-slate-150 flex items-center justify-between shrink-0">
          <div>
            <h4 className="text-sm font-black text-slate-900">
              {activeRoom?.name || 'Channel Chat'}
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              {activeRoom?.desc || 'Live messaging pipeline.'}
            </p>
          </div>

          {selectedRoomId === 'room-ai-assistant' && (
            <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
              <span className="text-[10px] uppercase font-black text-indigo-600 tracking-wider hidden sm:inline-flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-500 animate-pulse" />
                <span>Specialty:</span>
              </span>
              <select
                id="mentor-specialty-picker"
                value={selectedPersonaId}
                onChange={(e) => {
                  setSelectedPersonaId(e.target.value);
                  onAddNotification({
                    title: 'Specialty Configured ⚡',
                    text: `AI target mentor switched to ${e.target.value}`,
                    kind: 'system'
                  });
                }}
                className="text-[11px] bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 rounded-lg px-2 py-1.5 font-bold focus:outline-none focus:ring-1 focus:ring-indigo-600 cursor-pointer transition-all"
              >
                <option value="ARCHITECT">🏗️ Tech Architect</option>
                <option value="WEBSOCKETS">⚡ WebSockets Guru</option>
                <option value="TYPESCRIPT">🛡️ TypeScript Auditor</option>
                <option value="SECURITY_ADVOCATE">🔐 Security Specialist</option>
              </select>
            </div>
          )}
        </div>

        {/* Channels Message timeline */}
        <div id="chat-messages-scroll" className="flex-1 p-5 overflow-y-auto space-y-4 max-h-[460px]">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-450 gap-2">
              <MessageSquare className="w-8 h-8 text-slate-300" />
              <p className="text-xs font-semibold">Timeline clean. Draft a message to lock-in community activity!</p>
            </div>
          ) : (
            messages.map((msg, index) => {
              const isMe = currentUser && msg.authorId === currentUser.id;
              const isAi = msg.authorId === 'user-ai';
              
              return (
                <div 
                  key={msg.id || index} 
                  id={`msg-node-${msg.id}`}
                  className={`flex gap-2.5 items-start max-w-[85%] ${isMe ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                >
                  <img 
                    src={msg.authorAvatar} 
                    alt={msg.authorName} 
                    className="w-8 h-8 rounded-full bg-slate-100 shrink-0" 
                    referrerPolicy="no-referrer"
                  />
                  
                  <div className="space-y-1">
                    <div className={`flex items-center gap-1.5 text-[10px] ${isMe ? 'justify-end' : ''}`}>
                      <span className="font-extrabold text-slate-700">{msg.authorName}</span>
                      {msg.authorRole !== 'MEMBER' && (
                        <span className={`text-[8px] font-bold px-1 rounded ${isAi ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-white'}`}>
                          {msg.authorRole}
                        </span>
                      )}
                      <span className="text-slate-350">•</span>
                      <span className="text-slate-400">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    <div className={`p-3 rounded-xl text-xs whitespace-pre-wrap leading-relaxed shadow-3xs ${
                      isMe 
                        ? 'bg-indigo-600 text-white rounded-tr-none' 
                        : isAi 
                          ? 'bg-violet-50 border border-violet-150 text-slate-800 rounded-tl-none font-sans' 
                          : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Live Typing layout panel */}
        {activeTypistNames.length > 0 && (
          <div className="px-5 py-1 text-[11px] text-slate-500 italic shrink-0 bg-slate-50">
            {activeTypistNames.join(', ')} {activeTypistNames.length === 1 ? 'is' : 'are'} typing...
          </div>
        )}

        {/* Interaction Input form */}
        <div className="p-4 bg-white border-t border-slate-150 shrink-0">
          {currentUser ? (
            <form onSubmit={handleSendMessageSubmit} id="chat-input-form" className="flex gap-2">
              <input
                id="chat-text-input"
                type="text"
                value={inputText}
                onChange={handleInputChange}
                required
                placeholder={selectedRoomId === 'room-ai-assistant' 
                  ? 'Ask Gemini anything (e.g., "Explain socket.io handshake authorization")...'
                  : `Message ${activeRoom?.name || 'channel'}...`
                }
                className="flex-1 px-4 py-2 border border-slate-250 bg-slate-50/70 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white"
              />
              <button
                id="chat-send-btn"
                type="submit"
                className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all shrink-0 shadow-xs"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <div className="text-center text-xs py-2 text-slate-500 bg-slate-50 rounded-xl">
              Please sign in/register, or use the student demo credentials to interact in this chat room.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
