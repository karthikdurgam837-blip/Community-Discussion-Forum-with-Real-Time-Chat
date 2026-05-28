/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AlertOctagon, Check, X, ShieldAlert, Sparkles, RefreshCw } from 'lucide-react';
import { Flag } from '../types';

interface ModQueueProps {
  token: string | null;
  currentUser: any;
  onAddNotification: (notif: { title: string; text: string; kind: string }) => void;
}

export default function ModQueue({ token, currentUser, onAddNotification }: ModQueueProps) {
  const [flags, setFlags] = useState<Flag[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchQueue = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/moderation/queue', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.ok ? await res.json() : [];
        setFlags(data);
      }
    } catch (err) {
      console.error('Error fetching moderation queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [token]);

  const handleDecision = async (flagId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      const res = await fetch(`/api/moderation/resolve/${flagId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      if (res.ok) {
        setFlags(prev => prev.filter(f => f.id !== flagId));
        onAddNotification({
          title: status === 'APPROVED' ? 'Content Approved ✅' : 'Content Rejected 🚫',
          text: `Your moderation verdict was dispatched successfully.`,
          kind: 'moderation'
        });
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to process verdict.');
      }
    } catch (err) {
      console.error('Moderation action failed:', err);
    }
  };

  if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'MOD')) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-650 p-6 rounded-xl text-center space-y-2">
        <ShieldAlert className="w-8 h-8 text-red-500 mx-auto" />
        <h4 className="text-sm font-bold uppercase tracking-wider">Access Restricted</h4>
        <p className="text-xs">Only authorized community staff can access the moderation reporting hub.</p>
      </div>
    );
  }

  return (
    <div id="mod-queue-layout" className="space-y-4">
      <div className="flex justify-between items-center bg-slate-50 border border-slate-150 p-4 rounded-xl">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-indigo-600 animate-pulse" />
          <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Moderation Review Hub</h3>
        </div>
        <button
          onClick={fetchQueue}
          title="Reload Queue"
          className="p-1 px-2.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-xs font-semibold flex items-center gap-1.5 text-slate-650"
        >
          <RefreshCw className="w-3 px-0.1 animate-spin-hover" />
          <span>Sync</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400 text-xs flex flex-col items-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Synchronizing Flags...</span>
        </div>
      ) : flags.length === 0 ? (
        <div id="empty-queue" className="py-14 text-center bg-white border border-slate-200 rounded-2xl p-6 text-slate-500 space-y-1">
          <p className="text-sm font-bold text-slate-700">Moderation Queue Clean 🌿</p>
          <p className="text-xs text-slate-400">All forum posts cleared automated scanning safely.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-slate-500">The following forum posts triggered safety watchdogs and require manual student staff review:</p>
          {flags.map(flag => (
            <div key={flag.id} className="p-5 border border-amber-250 bg-amber-50/20 rounded-xl space-y-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-amber-700">
                  <AlertOctagon className="w-4 h-4 shrink-0" />
                  <span className="text-xs font-extrabold uppercase">Toxicity Warning</span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 leading-snug">
                  Target: {flag.targetTitle || 'Thread Post'}
                </h4>
                <div className="text-xs text-slate-600">
                  <b>Reason:</b> {flag.reason}
                </div>
                <div className="text-[10px] text-slate-400">
                  Flagged by: <b>{flag.reporterName}</b> on {new Date(flag.createdAt).toLocaleString()}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 shrink-0">
                <button
                  id={`btn-reject-flag-${flag.id}`}
                  onClick={() => handleDecision(flag.id, 'REJECTED')}
                  className="inline-flex items-center gap-1 hover:bg-red-100 p-2 border border-red-200 hover:border-red-300 text-red-650 rounded-xl text-xs font-bold transition-all"
                  title="Confirm Violation (Hide Post)"
                >
                  <X className="w-4 h-4" />
                  <span>Reject</span>
                </button>
                <button
                  id={`btn-approve-flag-${flag.id}`}
                  onClick={() => handleDecision(flag.id, 'APPROVED')}
                  className="inline-flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white p-2 px-3 rounded-xl text-xs font-bold transition-all shadow-xs"
                  title="Approve Post (Make Public)"
                >
                  <Check className="w-4 h-4" />
                  <span>Approve</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
