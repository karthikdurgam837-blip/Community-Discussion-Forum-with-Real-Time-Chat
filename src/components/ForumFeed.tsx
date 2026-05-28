/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Search, PlusCircle, ArrowUp, ArrowDown, MessageSquare, Tag, AlertTriangle, BookOpen, Clock, RefreshCw, Sparkles, Award, Terminal, Activity, Copy, Check, Play, Flame } from 'lucide-react';
import { Post, Category } from '../types';

interface ForumFeedProps {
  token: string | null;
  currentUser: any;
  onSelectPost: (postId: string) => void;
  onAddNotification: (notif: { title: string; text: string; kind: string }) => void;
}

export default function ForumFeed({ token, currentUser, onSelectPost, onAddNotification }: ForumFeedProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);

  // New Post Form State
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newContent, setNewContent] = useState<string>('');
  const [newCategoryId, setNewCategoryId] = useState<string>('');
  const [newTagsStr, setNewTagsStr] = useState<string>('');
  const [submitLoading, setSubmitLoading] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // AI suggest and Analytics State
  const [aiSuggesting, setAiSuggesting] = useState<boolean>(false);
  const [analytics, setAnalytics] = useState<any>(null);

  // Live Interactive Sandbox State
  const [sandboxCode, setSandboxCode] = useState<string>('console.log("Evaluating Socket.IO handshake event...");');
  const [sandboxLanguage, setSandboxLanguage] = useState<string>('typescript');
  const [sandboxOutput, setSandboxOutput] = useState<string[]>([]);
  const [sandboxRunning, setSandboxRunning] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Fetch Categories & Analytics
  useEffect(() => {
    fetch('/api/categories')
      .then(r => r.json())
      .then(data => {
        setCategories(data);
        if (data.length > 0) setNewCategoryId(data[0].id);
      })
      .catch(err => console.error('Error fetching categories:', err));

    fetch('/api/cohort-analytics')
      .then(r => r.json())
      .then(data => setAnalytics(data))
      .catch(err => console.error('Error loading analytics:', err));
  }, []);

  const handleAISuggesetPostMetadata = async () => {
    if (!newTitle.trim() && !newContent.trim()) {
      onAddNotification({
        title: 'Draft Required 💡',
        text: 'Please input a draft title or body content first to suggest keywords.',
        kind: 'system'
      });
      return;
    }
    setAiSuggesting(true);
    try {
      const res = await fetch('/api/ai/suggest-post-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle, content: newContent })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.optimizedTitle) {
          setNewTitle(data.optimizedTitle);
        }
        if (data.suggestedTags && data.suggestedTags.length > 0) {
          setNewTagsStr(data.suggestedTags.join(', '));
        }
        onAddNotification({
          title: 'AI Thread Title Polished ⚡',
          text: 'Optimized headline and categorized tags suggestions successfully written!',
          kind: 'reply'
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAiSuggesting(false);
    }
  };

  const handleRunSandbox = async () => {
    setSandboxRunning(true);
    setSandboxOutput(['Initializing VM container...', 'Verifying TypeScript security constraints...']);
    try {
      const res = await fetch('/api/sandbox/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: sandboxCode, language: sandboxLanguage })
      });
      if (res.ok) {
        const data = await res.json();
        setTimeout(() => {
          setSandboxOutput(data.outputs || []);
          setSandboxRunning(false);
        }, 800);
      } else {
        setSandboxOutput(['Evaluation instance failed to respond.']);
        setSandboxRunning(false);
      }
    } catch (err) {
      setSandboxOutput(['Check network credentials and retry.']);
      setSandboxRunning(false);
    }
  };

  // Fetch Posts
  const fetchPosts = () => {
    setLoading(true);
    let url = `/api/posts?page=${page}`;
    if (selectedCategory) url += `&categoryId=${selectedCategory}`;
    if (selectedTag) url += `&tag=${selectedTag}`;
    if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;

    fetch(url)
      .then(r => r.json())
      .then(data => {
        setPosts(data.posts || []);
        setTotalPages(data.totalPages || 1);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading posts:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchPosts();
  }, [selectedCategory, selectedTag, page, searchQuery]);

  // Handle Vote Call
  const handleVote = async (postId: string, type: 'UP' | 'DOWN', e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering route navigation
    if (!token) {
      onAddNotification({
        title: 'Authentication Required',
        text: 'Please sign in to upvote or downvote discussion threads!',
        kind: 'system'
      });
      return;
    }

    try {
      const res = await fetch(`/api/posts/${postId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ type })
      });
      
      if (res.ok) {
        // Optimistically update vote UI
        setPosts(prev => prev.map(p => {
          if (p.id === postId) {
            let change = type === 'UP' ? 1 : -1;
            // Basic score toggle logic matching backend
            return { ...p, score: p.score + change };
          }
          return p;
        }));
      }
    } catch (err) {
      console.error('Vote failed:', err);
    }
  };

  // Submit New Post
  const handleCreatePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitLoading(true);

    if (!newTitle.trim() || !newContent.trim() || !newCategoryId) {
      setFormError('Please fill out all post attributes.');
      setSubmitLoading(false);
      return;
    }

    const tagsArray = newTagsStr.split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newTitle,
          contentMd: newContent,
          categoryId: newCategoryId,
          tags: tagsArray
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create post.');
      }

      // Check if post creation triggered AI auto-moderation
      if (res.status === 202) {
        onAddNotification({
          title: 'Post Held for Review ⏳',
          text: 'Auto-moderator: Flagged potential policy violation. staff will review it shortly.',
          kind: 'moderation'
        });
      } else {
        onAddNotification({
          title: 'Post Published 🎉',
          text: 'Your discussion thread has been launched successfully!',
          kind: 'reply'
        });
      }

      // Reset Form fields
      setNewTitle('');
      setNewContent('');
      setNewTagsStr('');
      setShowCreateForm(false);
      
      // Reload feeds
      fetchPosts();
    } catch (err: any) {
      setFormError(err.message || 'Server error creating post.');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Common tags gathered for visual filter chips
  const popularTags = ['socket-io', 'web-sockets', 'react', 'tailwind', 'jwt', 'node-js', 'full-stack', 'welcome'];

  return (
    <div className="space-y-6">
      <div id="forum-feed-view" className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
      {/* Central main feed workspace - Left Column */}
      <div className="md:col-span-3 space-y-6">
        {/* Search and Action Bar */}
        <div className="flex flex-col sm:flex-row gap-3.5 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4.5 h-4.5 text-slate-400" />
            <input
              id="search-box"
              type="text"
              placeholder="Search discussion topics, titles, or tag words..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2 border border-slate-250 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          {token && (
            <button
              id="btn-trigger-post"
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl text-sm transition-colors shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Launch Discussion</span>
            </button>
          )}
        </div>

        {/* Slide down New Post Form Panel */}
        {showCreateForm && (
          <form onSubmit={handleCreatePostSubmit} id="create-post-form" className="p-5 bg-indigo-50/55 border border-indigo-150 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                New Asynchronous Discussion Thread
              </h3>
              
              <button
                type="button"
                onClick={handleAISuggesetPostMetadata}
                disabled={aiSuggesting}
                className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-55 cursor-pointer shadow-2xs"
              >
                <Sparkles className={`w-3.5 h-3.5 ${aiSuggesting ? 'animate-spin' : 'animate-pulse'}`} />
                <span>{aiSuggesting ? 'Polishing...' : '⚡ AI Optimize Draft'}</span>
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-100/80 border border-red-200 text-red-650 rounded-lg text-xs font-medium">
                {formError}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Discussion Title</label>
                <input
                  id="post-form-title"
                  type="text"
                  required
                  placeholder="Ex. Best way to scale Socket.IO connections?"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-250 bg-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 font-sans"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Forum Category (Topic Group)</label>
                <select
                  id="post-form-category"
                  value={newCategoryId}
                  onChange={(e) => setNewCategoryId(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-250 bg-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 font-sans cursor-pointer"
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 block">Thread Content (Markdown Supported)</label>
              <textarea
                id="post-form-content"
                required
                rows={5}
                placeholder="Provide a detailed explanation. Use markdown blocks for code syntax or bullet styling..."
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                className="w-full px-3 py-2 border border-slate-250 bg-white rounded-lg text-sm font-sans focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Tags (Separated by commas)</label>
              <input
                id="post-form-tags"
                type="text"
                placeholder="e.g. react, node-js, socket-io"
                value={newTagsStr}
                onChange={(e) => setNewTagsStr(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-250 bg-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 font-sans"
              />
            </div>

            <div className="flex gap-2.5 justify-end">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-3.5 py-1.5 border border-slate-250 hover:bg-slate-100 rounded-lg text-xs font-medium text-slate-600 cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="btn-submit-post"
                type="submit"
                disabled={submitLoading}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium disabled:opacity-50 cursor-pointer"
              >
                {submitLoading ? 'AI Moderating & Posting...' : 'Publish Post'}
              </button>
            </div>
          </form>
        )}

        {/* Discussion List Area */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
            <p className="text-sm font-medium">Refreshing Discussion Boards...</p>
          </div>
        ) : posts.length === 0 ? (
          <div id="empty-posts" className="bg-slate-50 rounded-2xl py-14 px-6 border border-slate-150 text-center space-y-2">
            <p className="text-base font-bold text-slate-700">No discussion threads found</p>
            <p className="text-sm text-slate-500">Be the first in the cohort to launch a thread in this category topic!</p>
            {token && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl mt-2"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Launch Now</span>
              </button>
            )}
          </div>
        ) : (
          <div id="posts-list" className="space-y-4">
            {posts.map(post => (
              <div
                key={post.id}
                onClick={() => onSelectPost(post.id)}
                className="p-5 bg-white border border-slate-200 hover:border-indigo-200 hover:shadow-xs rounded-xl transition-all cursor-pointer flex gap-4 items-start"
              >
                {/* Left Voting Column */}
                <div className="flex flex-col items-center gap-1 bg-slate-50/80 hover:bg-slate-100/80 rounded-lg p-1 shrink-0">
                  <button
                    onClick={(e) => handleVote(post.id, 'UP', e)}
                    title="Upvote Post"
                    className="p-1 hover:text-indigo-600 transition-colors"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-extrabold text-slate-700 min-w-5 text-center">{post.score}</span>
                  <button
                    onClick={(e) => handleVote(post.id, 'DOWN', e)}
                    title="Downvote Post"
                    className="p-1 hover:text-red-500 transition-colors"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                </div>

                {/* Central post Details */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {post.categoryName}
                    </span>
                    {post.moderationStatus === 'PENDING' && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Pending Review
                      </span>
                    )}
                    {post.isFlagged && post.moderationStatus === 'PENDING' && (
                      <span className="text-xs font-medium text-amber-600 italic">
                        ({post.flagReason || 'Auto-moderated content holding'})
                      </span>
                    )}
                  </div>

                  <h4 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 leading-snug">
                    {post.title}
                  </h4>

                  <p className="text-xs text-slate-500 line-clamp-2">
                    {post.contentMd}
                  </p>

                  {/* Tags */}
                  {post.tags.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap pt-1">
                      {post.tags.map(tag => (
                        <span key={tag} className="text-xs text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Footer details */}
                  <div className="flex items-center justify-between text-xs text-slate-500 pt-1 flex-wrap gap-2 border-t border-slate-50">
                    <div className="flex items-center gap-2">
                      <img 
                        src={post.authorAvatar} 
                        alt={post.authorName} 
                        className="w-5 h-5 rounded-full bg-slate-100 shrink-0" 
                        referrerPolicy="no-referrer"
                      />
                      <span className="font-semibold text-slate-700">{post.authorName}</span>
                      <span className="text-slate-300">•</span>
                      <span className="flex items-center gap-0.5"><Clock className="w-3.5 h-3.5" /> {new Date(post.createdAt).toLocaleDateString()}</span>
                    </div>

                    <div className="flex items-center gap-1 text-indigo-600 font-medium">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{post.commentsCount} replies</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination control footer */}
        {totalPages > 1 && (
          <div id="forum-pagination" className="flex justify-between items-center bg-white p-3 border border-slate-200 rounded-xl">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="px-3.5 py-1.5 text-xs font-semibold bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg disabled:opacity-40"
            >
              Prev Page
            </button>
            <span className="text-xs text-slate-500">
              Page <b>{page}</b> of <b>{totalPages}</b>
            </span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
              className="px-3.5 py-1.5 text-xs font-semibold bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg disabled:opacity-40"
            >
              Next Page
            </button>
          </div>
        )}
      </div>

      {/* Right Sidebar Filter Panel - Right Column */}
      <div className="md:col-span-1 space-y-5 md:sticky md:top-20 h-fit">
        {/* Categories filtration panel */}
        <div id="category-sidebar-card" className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-2xs">
          <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
            <span>Discussion Topics</span>
          </h4>
          <div id="category-selector" className="flex flex-col gap-1.5">
            <button
              onClick={() => { setSelectedCategory(''); setPage(1); }}
              className={`w-full text-left px-3.5 py-2 text-xs font-semibold rounded-xl transition-all border ${
                !selectedCategory 
                  ? 'bg-slate-900 border-slate-900 text-white shadow-2xs' 
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
              }`}
            >
              🌐 All Categories
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => { setSelectedCategory(cat.id); setSelectedTag(''); setPage(1); }}
                className={`w-full text-left px-3.5 py-2 text-xs font-semibold rounded-xl transition-all border truncate ${
                  selectedCategory === cat.id 
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-2xs' 
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Hot tag Filter chips panel */}
        <div id="tags-sidebar-card" className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-2xs">
          <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Tag className="w-3.5 h-3.5 text-slate-400" />
            <span>Popular Tags</span>
          </h4>
          <div id="tags-selector" className="flex flex-wrap gap-1.5 font-sans">
            {popularTags.map(tag => (
              <button
                key={tag}
                onClick={() => { setSelectedTag(selectedTag === tag ? '' : tag); setPage(1); }}
                className={`px-2.5 py-1 rounded-xl text-xs transition-all border text-left shrink-0 font-medium cursor-pointer ${
                  selectedTag === tag 
                    ? 'bg-indigo-100 border-indigo-300 text-indigo-700 font-semibold' 
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-550'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>

        {/* Gamified Weekly Leaderboard */}
        {analytics?.leaderboard && (
          <div id="leaderboard-sidebar-card" className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-2xs">
            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Award className="w-3.5 h-3.5 text-amber-500" />
              <span>Mentor Leadership (Weekly)</span>
            </h4>
            <div className="space-y-2.5">
              {analytics.leaderboard.map((user: any, index: number) => (
                <div key={user.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="relative">
                      <img src={user.avatar} className="w-7 h-7 rounded-full bg-slate-50 shrink-0 border border-slate-100 object-cover" />
                      <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-white ${user.status === 'Online' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-800 block leading-tight">{user.name}</span>
                      <span className="text-[9px] text-slate-400 font-medium block leading-none">{user.role}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {index === 0 && <Flame className="w-3 h-3 text-rose-500 fill-rose-500 shrink-0" />}
                    <span className="text-xs font-extrabold text-slate-700 font-mono">{user.xp} <span className="text-[10px] text-slate-400 font-bold">XP</span></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>

    {/* Cohort activity Metrics and Sandbox Playground side by side below */}
    <div id="forum-feed-bottom-widgets" className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-250/50 mt-4">
      {/* Dynamic Cohort Analytics insights */}
      {analytics && (
        <div id="analytics-bottom-card" className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-2xs">
          <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-indigo-600" />
            <span>Cohort Activity Metrics</span>
          </h4>
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-2.5 bg-slate-50/70 border border-slate-100 rounded-xl text-center">
              <span className="block text-lg font-black text-indigo-600">{analytics.activeStudentsCount}</span>
              <span className="text-[10px] text-slate-500 font-medium uppercase">Active Now</span>
            </div>
            <div className="p-2.5 bg-slate-50/70 border border-slate-100 rounded-xl text-center">
              <span className="block text-lg font-black text-indigo-600">{analytics.activeThreadsToday}</span>
              <span className="text-[10px] text-slate-500 font-medium uppercase">Threads Today</span>
            </div>
          </div>
          
          <div className="pt-1.5 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium">Avg Thread Resolution:</span>
              <span className="font-extrabold text-slate-700 font-mono text-[11px] bg-slate-50 border border-slate-150 px-1.5 py-0.5 rounded-full">{analytics.averageResolutionTimeMinutes} mins</span>
            </div>
            
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Topic Share:</span>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-slate-650">
                  <span className="font-medium">React Hooks</span>
                  <span className="font-bold">41%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1">
                  <div className="bg-indigo-500 h-1 rounded-full" style={{ width: '41%' }} />
                </div>
                
                <div className="flex items-center justify-between text-[11px] text-slate-650">
                  <span className="font-medium">WebSocket Handshakes</span>
                  <span className="font-bold">29%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1">
                  <div className="bg-indigo-500 h-1 rounded-full" style={{ width: '29%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Live Code Sandbox evaluation console */}
      <div id="sandbox-bottom-card" className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 text-slate-100 shadow-xl overflow-hidden relative">
        <div className="absolute right-3 top-3.5 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[9.5px] font-bold text-slate-450 uppercase tracking-widest font-mono">Sandbox VM</span>
        </div>

        <h4 className="text-[10.5px] font-black text-slate-350 uppercase tracking-wider flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-emerald-400" />
          <span>Interactive Code Playground</span>
        </h4>

        <div className="space-y-3.5 text-xs">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Boilerplate Presets:</label>
            <div className="flex flex-wrap gap-1">
              <button
                type="button"
                onClick={() => setSandboxCode('console.log("Binding socket callbacks...");\n// simulation test\nsocket.connect("port:3000");')}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-750 text-slate-300 text-[10px] font-mono cursor-pointer transition-all"
              >
                socket_sim
              </button>
              <button
                type="button"
                onClick={() => setSandboxCode('// JWT token structure check\nconst userPayload = { role: "ADMIN", userId: "student-1" };\nconst signToken = jwt.sign(userPayload);\nconsole.log(signToken);')}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-750 text-slate-300 text-[10px] font-mono cursor-pointer transition-all"
              >
                jwt_sign
              </button>
              <button
                type="button"
                onClick={() => setSandboxCode('console.log("Memory leak checker running...");\nuseEffect(() => {\n  const handler = () => {};\n  window.addEventListener("scroll", handler);\n  return () => window.removeEventListener("scroll", handler);\n}, []);')}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-750 text-slate-300 text-[10px] font-mono cursor-pointer transition-all"
              >
                use_effect_mem
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Source Sandbox Editor:</label>
              <span className="text-[9px] font-mono text-indigo-400 bg-indigo-950/50 px-1 rounded">JS/TS</span>
            </div>
            <textarea
              rows={4}
              value={sandboxCode}
              onChange={(e) => setSandboxCode(e.target.value)}
              className="w-full p-2 bg-slate-950 hover:bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
              placeholder="Write draft code block here..."
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleRunSandbox}
              disabled={sandboxRunning}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-800 text-slate-950 font-extrabold text-[11px] uppercase tracking-wider rounded-lg transition-all cursor-pointer shadow-md"
            >
              <Play className="w-3.5 h-3.5 fill-slate-950" />
              <span>{sandboxRunning ? 'Compiling...' : 'Run sandbox'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(sandboxCode);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="px-3 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-lg text-xs cursor-pointer transition-all"
              title="Copy Code"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Sandbox Virtual Console Output */}
          {sandboxOutput.length > 0 && (
            <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg space-y-1 max-h-36 overflow-y-auto">
              <span className="text-[9.5px] font-bold text-slate-500 uppercase tracking-widest font-mono block">Virtual Run Log Console:</span>
              <div className="font-mono text-[10px] space-y-1 select-text">
                {sandboxOutput.map((out, idx) => (
                  <div key={idx} className={out.startsWith('✓') || out.startsWith('🔐') || out.startsWith('🔑') || out.startsWith('⚡') ? 'text-emerald-450' : out.includes('Error') || out.includes('failure') ? 'text-rose-400' : 'text-slate-350'}>
                    {out}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
  );
}
