/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Role = 'ADMIN' | 'MOD' | 'MEMBER';
export type VoteType = 'UP' | 'DOWN';
export type MsgType = 'TEXT' | 'IMAGE' | 'FILE';
export type RoomType = 'CHANNEL' | 'DM';

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string;
  role: Role;
  createdAt: string;
  bio?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  desc: string;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
}

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  categoryId: string;
  categoryName: string;
  title: string;
  contentMd: string;
  createdAt: string;
  updatedAt: string;
  score: number;
  userVote?: 'UP' | 'DOWN' | null;
  commentsCount: number;
  tags: string[];
  isFlagged: boolean;
  flagReason?: string;
  moderationStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  authorRole: Role;
  contentMd: string;
  parentId?: string | null;  // For nested replies
  createdAt: string;
}

export interface Vote {
  id: string;
  userId: string;
  postId?: string | null;
  commentId?: string | null;
  type: VoteType;
  createdAt: string;
}

export interface Room {
  id: string;
  kind: RoomType;
  name: string | null;
  slug: string | null;
  desc?: string;
  members: string[]; // User IDs
}

export interface Message {
  id: string;
  roomId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  authorRole: Role;
  type: MsgType;
  text?: string;
  fileUrl?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  kind: 'mention' | 'reply' | 'dm' | 'system' | 'moderation';
  title: string;
  text: string;
  payload: any;
  seen: boolean;
  createdAt: string;
}

export interface Flag {
  id: string;
  targetPostId?: string | null;
  targetCommentId?: string | null;
  targetTitle?: string;
  reason: string;
  reporterId: string;
  reporterName: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}
