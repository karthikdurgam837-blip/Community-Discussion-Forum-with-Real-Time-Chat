/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User, FileText, Globe, Calendar, Key, CheckCircle, Smartphone } from 'lucide-react';
import { User as UserType } from '../types';

interface ProfileTabProps {
  token: string | null;
  currentUser: UserType | null;
  onUpdateUser: (updated: UserType) => void;
  onAddNotification: (notif: { title: string; text: string; kind: string }) => void;
}

export default function ProfileTab({ token, currentUser, onUpdateUser, onAddNotification }: ProfileTabProps) {
  const [name, setName] = useState<string>(currentUser?.name || '');
  const [bio, setBio] = useState<string>(currentUser?.bio || '');
  const [saveLoading, setSaveLoading] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!currentUser) {
    return (
      <div className="bg-slate-50 border border-slate-250 p-10 rounded-2xl text-center text-slate-500">
        <p className="text-sm font-semibold">Please authenticate to manage your student cohort profile parameters.</p>
      </div>
    );
  }

  const handleUpdateProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/users/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          bio,
          avatarUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(name)}`
        })
      });

      if (!res.ok) throw new Error('Error updating user registry.');
      const updatedUser = await res.json();
      
      onUpdateUser(updatedUser);
      setSuccessMsg('Your developer profile was saved and synchronised.');
      onAddNotification({
        title: 'Profile Synchronized 📁',
        text: 'Your student forum profile card has been modified.',
        kind: 'system'
      });
    } catch (err) {
      console.error(err);
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div id="profile-pane-layout" className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="bg-slate-50 border-b border-slate-150 p-6 flex items-center gap-4">
        <img 
          src={currentUser.avatarUrl} 
          alt={currentUser.name} 
          className="w-16 h-16 rounded-xl border border-slate-200 shadow-sm bg-white shrink-0" 
          referrerPolicy="no-referrer"
        />
        <div className="space-y-1 overflow-hidden">
          <h3 className="text-base font-black text-slate-900 truncate">{currentUser.name}</h3>
          <div className="flex gap-2 items-center flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-600 text-white px-2 py-0.5 rounded">
              {currentUser.role}
            </span>
            <span className="text-slate-400 text-xs flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Registered: {new Date(currentUser.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleUpdateProfileSubmit} className="p-6 space-y-4">
        {successMsg && (
          <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-xs font-semibold flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-600">Visual Display Name</label>
          <div className="relative">
            <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              id="profile-name-textbox"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-slate-250 bg-slate-50/50 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-600">Profile Bio / Status description</label>
          <div className="relative">
            <FileText className="absolute left-3 top-2.2 w-4 h-4 text-slate-400" />
            <textarea
              id="profile-bio-textbox"
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-slate-250 bg-slate-50/50 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 flex justify-between items-center flex-wrap gap-2">
          <div className="text-[10px] text-slate-400 font-mono">
            ID Reference: <code className="bg-slate-100 p-1 rounded">{currentUser.id}</code>
          </div>
          <button
            id="profile-save-btn"
            type="submit"
            disabled={saveLoading}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
          >
            {saveLoading ? 'Saving Profile...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
