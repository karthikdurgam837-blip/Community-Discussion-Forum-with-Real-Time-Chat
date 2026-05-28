/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Send, Trash2, Clock, MessageSquare, CornerDownRight, ShieldCheck, Sparkles, Cpu, Layers, HelpCircle, Check } from 'lucide-react';
import { Post, Comment } from '../types';

interface PostDetailsProps {
  postId: string;
  token: string | null;
  currentUser: any;
  onBack: () => void;
  onAddNotification: (notif: { title: string; text: string; kind: string }) => void;
}

export default function PostDetails({ postId, token, currentUser, onBack, onAddNotification }: PostDetailsProps) {
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newCommentText, setNewCommentText] = useState<string>('');
  
  // Track IDs of comments being replied to (nested threads)
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [nestedReplyText, setNestedReplyText] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(true);
  const [publishLoading, setPublishLoading] = useState<boolean>(false);

  // Gemini Dev Assist States
  const [assistLoading, setAssistLoading] = useState<boolean>(false);
  const [assistResult, setAssistResult] = useState<string>('');
  const [assistReplies, setAssistReplies] = useState<string[]>([]);
  const [activeAssistTab, setActiveAssistTab] = useState<string | null>(null);

  const handleTriggerThreadAssist = async (action: 'SUMMARIZE' | 'CODEREVIEW' | 'QUICKREPLIES') => {
    setAssistLoading(true);
    setActiveAssistTab(action);
    setAssistResult('');
    setAssistReplies([]);
    try {
      const res = await fetch('/api/ai/thread-assist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ postId, action })
      });
      if (!res.ok) throw new Error('Unsuccessful assistant request.');
      const data = await res.json();
      if (action === 'QUICKREPLIES') {
        setAssistReplies(data.replies || []);
      } else {
        setAssistResult(data.text || '');
      }
    } catch (err) {
      console.error(err);
      setAssistResult('An error occurred calling the server thread mentor. Please check your setup.');
    } finally {
      setAssistLoading(false);
    }
  };

  // Fetch Post and comments together
  const fetchPostAndComments = async () => {
    setLoading(true);
    try {
      const postRes = await fetch(`/api/posts/${postId}`);
      if (!postRes.ok) throw new Error('Post not found.');
      const postData = await postRes.json();
      setPost(postData);

      const commentsRes = await fetch(`/api/posts/${postId}/comments`);
      const commentsData = await commentsRes.json();
      setComments(commentsData);
    } catch (err) {
      console.error('Failed loading post elements:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPostAndComments();
  }, [postId]);

  // Submit Comments (Root level)
  const handleCommentSubmit = async (e: React.FormEvent, parentId: string | null = null) => {
    e.preventDefault();
    if (!token) {
      onAddNotification({
        title: 'Authentication Required',
        text: 'Sign in to add your feedback to this cohort discussion!',
        kind: 'system'
      });
      return;
    }

    const text = parentId ? nestedReplyText : newCommentText;
    if (!text.trim()) return;

    setPublishLoading(true);
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          contentMd: text,
          parentId
        })
      });

      if (!res.ok) throw new Error('Failure creating comment.');
      const newComment = await res.json();
      
      // Update local comment list and post stats
      setComments(prev => [...prev, newComment]);
      if (post) setPost({ ...post, commentsCount: post.commentsCount + 1 });

      onAddNotification({
        title: 'Comment Submitted 💬',
        text: 'Your post reply has been broadcast successfully.',
        kind: 'reply'
      });

      // Clear states
      if (parentId) {
        setActiveReplyId(null);
        setNestedReplyText('');
      } else {
        setNewCommentText('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPublishLoading(false);
    }
  };

  // Delete Post
  const handleDeletePost = async () => {
    if (!window.confirm('Are you strictly sure you want to remove this discussion thread? This action is irreversible.')) {
      return;
    }

    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (res.ok) {
        onAddNotification({
          title: 'Discussion Removed',
          text: 'The thread has been successfully cleaned from the archives.',
          kind: 'system'
        });
        onBack();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete post.');
      }
    } catch (err) {
      console.error('Delete post error:', err);
    }
  };

  // Build threaded nested layout hierarchy
  const rootComments = comments.filter(c => !c.parentId);
  const getRepliesFor = (id: string) => comments.filter(c => c.parentId === id);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2.5">
        <div className="w-7 h-7 animate-spin rounded-full border-2 border-indigo-550 border-t-transparent" />
        <p className="text-xs font-semibold">Reading Thread Data...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="bg-slate-50 border border-slate-200 text-center py-12 px-4 rounded-xl space-y-3">
        <p className="text-sm font-bold text-slate-700">The requested discussion does not exist or has been removed.</p>
        <button onClick={onBack} className="inline-flex items-center gap-1.5 text-xs text-indigo-600 font-bold bg-white px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Forums
        </button>
      </div>
    );
  }

  return (
    <div id="discussion-details-view" className="space-y-6">
      {/* Back button and Meta panel */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <button
          id="btn-back-forum"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Boards</span>
        </button>

        {currentUser && (currentUser.id === post.authorId || currentUser.role === 'ADMIN' || currentUser.role === 'MOD') && (
          <button
            id="btn-delete-post"
            onClick={handleDeletePost}
            className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-650 rounded-lg transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Close Discussion</span>
          </button>
        )}
      </div>

      {/* Main Discussion Thread card */}
      <div id="main-discussion-card" className="p-6 bg-white border border-slate-200 rounded-2xl relative space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold px-3 py-1 bg-indigo-50 border border-indigo-150 text-indigo-700 rounded-full">
            {post.categoryName}
          </span>
          <span className="flex items-center text-xs text-slate-400 gap-1 font-medium">
            <Clock className="w-3.5 h-3.5" /> {new Date(post.createdAt).toLocaleTimeString()} • {new Date(post.createdAt).toLocaleDateString()}
          </span>
        </div>

        <h2 className="text-xl font-extrabold text-slate-900 leading-snug">
          {post.title}
        </h2>

        {/* User Author bar */}
        <div className="flex items-center gap-2.5 p-3 bg-slate-50 border border-slate-100 rounded-xl">
          <img 
            src={post.authorAvatar} 
            alt={post.authorName} 
            className="w-10 h-10 rounded-full bg-slate-200" 
            referrerPolicy="no-referrer"
          />
          <div className="text-xs">
            <div className="font-bold text-slate-800">{post.authorName}</div>
            <div className="text-slate-500 mt-0.5">Contributor Member</div>
          </div>
        </div>

        {/* Main Content Area */}
        <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
          {post.contentMd}
        </p>

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex gap-1.5 flex-wrap pt-2">
            {post.tags.map(t => (
              <span key={t} className="text-xs text-indigo-600 bg-indigo-50/50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                #{t}
              </span>
            ))}
          </div>
        )}

        {/* Dynamic Gemini Spark Dev Assist Workspace */}
        <div className="mt-4 pt-4 border-t border-slate-100 space-y-3.5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-black text-indigo-600 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 animate-pulse text-indigo-500" />
              <span>Gemini AI Thread Mentor</span>
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleTriggerThreadAssist('SUMMARIZE')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                  activeAssistTab === 'SUMMARIZE'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
                }`}
              >
                Summarize
              </button>
              <button
                type="button"
                onClick={() => handleTriggerThreadAssist('CODEREVIEW')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                  activeAssistTab === 'CODEREVIEW'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
                }`}
              >
                Security Audit
              </button>
              <button
                type="button"
                onClick={() => handleTriggerThreadAssist('QUICKREPLIES')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                  activeAssistTab === 'QUICKREPLIES'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
                }`}
              >
                Suggest Replies
              </button>
            </div>
          </div>

          {activeAssistTab && (
            <div className="p-4 rounded-xl bg-indigo-50/40 border border-indigo-100 text-xs text-slate-700 space-y-3 transition-all">
              {assistLoading ? (
                <div className="flex items-center gap-2 py-1.5 text-indigo-600 font-semibold animate-pulse">
                  <div className="w-4 h-4 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
                  <span>Generating AI Insight...</span>
                </div>
              ) : (
                <>
                  {activeAssistTab === 'QUICKREPLIES' ? (
                    <div className="space-y-2">
                      <p className="font-semibold text-indigo-800">Select a suggested reply to populate the response field below:</p>
                      <div className="flex flex-col gap-1.5">
                        {assistReplies.map((reply, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => {
                              setNewCommentText(reply);
                              onAddNotification({
                                title: 'Quick Reply Active ⚡',
                                text: 'Suggested template set in response field.',
                                kind: 'system'
                              });
                            }}
                            className="w-full text-left p-2.5 bg-white hover:bg-indigo-50 border border-indigo-100/55 hover:border-indigo-200 rounded-lg text-slate-700 hover:text-indigo-950 font-medium transition-all cursor-pointer"
                          >
                            💬 "{reply}"
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap leading-relaxed text-slate-700 font-sans">
                      {assistResult}
                    </div>
                  )}
                  <div className="flex justify-between items-center text-[10px] text-slate-400 border-t border-indigo-100/30 pt-2 shrink-0">
                    <span>⚡ Real-Time Context Engine</span>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveAssistTab(null);
                        setAssistResult('');
                        setAssistReplies([]);
                      }}
                      className="text-indigo-600 hover:underline font-semibold cursor-pointer"
                    >
                      Dismiss Panel
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Replies header */}
      <div className="flex items-center justify-between border-b border-slate-150 pb-2">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wide">
          <MessageSquare className="w-4 h-4 text-indigo-500" />
          <span>Cohort Responses ({post.commentsCount})</span>
        </h3>
      </div>

      {/* Replies Loop (Hierarchical replies) */}
      <div id="comments-timeline" className="space-y-4">
        {rootComments.length === 0 ? (
          <div className="text-center py-8 bg-slate-50 border border-slate-150 rounded-xl text-slate-400 text-xs">
            No response posted to this thread yet. Type below to spark the discussion!
          </div>
        ) : (
          rootComments.map(comment => (
            <div key={comment.id} className="space-y-3.5" id={`comment-node-${comment.id}`}>
              {/* Parent Comment block */}
              <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2.5 relative">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <img 
                      src={comment.authorAvatar} 
                      alt={comment.authorName} 
                      className="w-6 h-6 rounded-full bg-slate-100 shrink-0" 
                      referrerPolicy="no-referrer"
                    />
                    <span className="text-xs font-bold text-slate-800">{comment.authorName}</span>
                    {comment.authorRole !== 'MEMBER' && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.2 bg-indigo-600 text-white rounded">
                        <ShieldCheck className="w-3 h-3" />
                        {comment.authorRole}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {new Date(comment.createdAt).toLocaleDateString()} at {new Date(comment.createdAt).toLocaleTimeString()}
                  </span>
                </div>

                <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {comment.contentMd}
                </p>

                {/* Inline Action for nested trigger */}
                {token && (
                  <div className="flex justify-end pt-1">
                    <button
                      id={`reply-btn-${comment.id}`}
                      onClick={() => {
                        setActiveReplyId(activeReplyId === comment.id ? null : comment.id);
                        setNestedReplyText('');
                      }}
                      className="text-[10px] hover:underline text-indigo-600 font-bold"
                    >
                      {activeReplyId === comment.id ? 'Cancel Reply' : 'Reply Inline'}
                    </button>
                  </div>
                )}
              </div>

              {/* Nested Reply form */}
              {activeReplyId === comment.id && (
                <div className="pl-6 flex gap-2" id={`nested-form-box-${comment.id}`}>
                  <CornerDownRight className="w-4 h-4 text-slate-400 shrink-0 mt-2" />
                  <form onSubmit={(e) => handleCommentSubmit(e, comment.id)} className="flex-1 flex gap-2">
                    <input
                      id={`reply-input-${comment.id}`}
                      type="text"
                      required
                      placeholder={`Reply to ${comment.authorName}...`}
                      value={nestedReplyText}
                      onChange={(e) => setNestedReplyText(e.target.value)}
                      className="flex-1 px-3 py-1.5 border border-slate-250 bg-white rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <button
                      id={`reply-submit-${comment.id}`}
                      type="submit"
                      disabled={publishLoading}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shrink-0 disabled:opacity-55"
                    >
                      Reply
                    </button>
                  </form>
                </div>
              )}

              {/* Sub-Replies Loop (Renders one level deeply representing nested threads) */}
              {getRepliesFor(comment.id).map(reply => (
                <div key={reply.id} className="pl-6 flex gap-2.5" id={`subcomment-node-${reply.id}`}>
                  <CornerDownRight className="w-4.5 h-4.5 text-slate-300 shrink-0 mt-3" />
                  <div className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-1.5">
                        <img 
                          src={reply.authorAvatar} 
                          alt={reply.authorName} 
                          className="w-5 h-5 rounded-full bg-slate-100 shrink-0" 
                          referrerPolicy="no-referrer"
                        />
                        <span className="text-[11px] font-bold text-slate-800">{reply.authorName}</span>
                        {reply.authorRole !== 'MEMBER' && (
                          <span className="text-[9px] bg-slate-900 text-white px-1.5 rounded py-0.1 font-bold uppercase">{reply.authorRole}</span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {new Date(reply.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                      {reply.contentMd}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      {/* Main Bottom Comment Creation panel */}
      {token ? (
        <form onSubmit={(e) => handleCommentSubmit(e, null)} id="new-root-comment-form" className="space-y-1.5 border-t border-slate-150 pt-4">
          <label className="text-xs font-bold text-slate-700 block uppercase tracking-wide">Write Response</label>
          <div className="flex gap-2">
            <textarea
              id="comment-text-box"
              required
              rows={3}
              placeholder="Provide constructive insight, reference code snippets, ask questions..."
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              className="flex-1 p-3 border border-slate-250 bg-white rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
          </div>
          <div className="flex justify-end pt-1">
            <button
              id="submit-comment-btn"
              type="submit"
              disabled={publishLoading}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{publishLoading ? 'Publishing Reply...' : 'Post Reply'}</span>
            </button>
          </div>
        </form>
      ) : (
        <div className="p-4 bg-slate-100 border border-slate-200 text-center text-xs text-slate-500 rounded-xl">
          Please sign in/register to reply to this forum topic thread.
        </div>
      )}
    </div>
  );
}
