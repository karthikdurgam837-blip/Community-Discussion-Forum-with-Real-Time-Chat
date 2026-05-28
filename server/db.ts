/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { User, Category, Post, Comment, Vote, Room, Message, Notification, Flag } from '../src/types';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + 'community-forum-salt-987').digest('hex');
}

export interface DbSchema {
  users: User[];
  passwords: Record<string, string>; // userId -> hashedPassword
  categories: Category[];
  posts: Post[];
  comments: Comment[];
  votes: Vote[];
  rooms: Room[];
  messages: Message[];
  notifications: Notification[];
  flags: Flag[];
}

const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'cat-general',
    name: 'General & Announcements',
    slug: 'general-announcements',
    desc: 'Important team announcements, guidelines, and community-wide updates.',
  },
  {
    id: 'cat-tech',
    name: 'Tech Development & Code',
    slug: 'tech-dev-code',
    desc: 'Share code snippets, debug issues, discuss web frameworks, and learn together.',
  },
  {
    id: 'cat-ideas',
    name: 'Ideas, Feedback & Showcases',
    slug: 'ideas-feedback-showcases',
    desc: 'Have a cool project or design? Pitch your ideas here and gather community feedback.',
  },
  {
    id: 'cat-ai',
    name: 'AI & Machine Learning',
    slug: 'ai-ml',
    desc: 'Discuss Gemini, prompt engineering, agentic workflows, and the future of LLMs.',
  },
];

const DEFAULT_ROOMS: Room[] = [
  {
    id: 'room-announcements',
    kind: 'CHANNEL',
    name: '📢 announcements',
    slug: 'announcements',
    desc: 'Broadcast channel for community announcements.',
    members: [],
  },
  {
    id: 'room-general',
    kind: 'CHANNEL',
    name: '💬 general-chat',
    slug: 'general-chat',
    desc: 'Hang out, say hello, and chat about anything and everything.',
    members: [],
  },
  {
    id: 'room-tech',
    kind: 'CHANNEL',
    name: '💻 tech-dev',
    slug: 'tech-dev',
    desc: 'Real-time coding help, tool recommendations, and software talk.',
    members: [],
  },
  {
    id: 'room-ai-assistant',
    kind: 'CHANNEL',
    name: '🤖 ai-assistant',
    slug: 'ai-assistant',
    desc: 'Chat directly with Gemini-powered helper in real time!',
    members: [],
  },
];

class DatabaseManager {
  private data!: DbSchema;

  constructor() {
    this.load();
  }

  private load() {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(fileContent);
      } catch (err) {
        console.error('Error parsing database file, resetting...', err);
        this.initializeWithSeedData();
      }
    } else {
      this.initializeWithSeedData();
    }
  }

  public save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error writing to database file:', err);
    }
  }

  private initializeWithSeedData() {
    console.log('Seeding initial community discussion database...');
    
    const adminId = 'user-admin';
    const expertId = 'user-expert';
    const memberId = 'user-member';
    const aiId = 'user-ai';

    const seedUsers: User[] = [
      {
        id: adminId,
        email: 'admin@forum.com',
        name: 'Sarah (Admin)',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
        role: 'ADMIN',
        createdAt: new Date().toISOString(),
        bio: 'Community Administrator. Loving frontend architecture and full-stack software development.',
      },
      {
        id: expertId,
        email: 'expert@forum.com',
        name: 'Alex Rivera (Staff)',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        role: 'MOD',
        createdAt: new Date().toISOString(),
        bio: 'Technical Moderator. Node.js enthusiast, Socket.io wizard, and database designer.',
      },
      {
        id: memberId,
        email: 'member@forum.com',
        name: 'David Cho',
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
        role: 'MEMBER',
        createdAt: new Date().toISOString(),
        bio: 'Computer Science student learning the MERN Stack and looking for proof of work!',
      },
      {
        id: aiId,
        email: 'gemini-bot@forum.com',
        name: 'Gemini Agent',
        avatarUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150', // Abstract AI wave
        role: 'MOD',
        createdAt: new Date().toISOString(),
        bio: 'In-house AI Moderator and Technical Assistant powered by Gemini 3.5 Flash.',
      },
    ];

    const seedPasswords: Record<string, string> = {
      [adminId]: hashPassword('admin123'),
      [expertId]: hashPassword('expert123'),
      [memberId]: hashPassword('member123'),
      [aiId]: hashPassword('gemini-bot-secret-99'),
    };

    const seedPosts: Post[] = [
      {
        id: 'post-1',
        authorId: adminId,
        authorName: 'Sarah (Admin)',
        authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
        categoryId: 'cat-general',
        categoryName: 'General & Announcements',
        title: 'Welcome to the Community Discussion Forum + Real-Time Chat!',
        contentMd: `Hello Everyone! 👋\n\nWelcome to our newly launched platform. This software has been built as a **full-stack model project** showcasing the integration of modular APIs, database persistence, and bi-directional websocket communication inside a single cohesive application.\n\n### Core Platform Capabilities:\n1. **Asynchronous Forums**: Create structured threads, vote on topics, filter tags, and leave hierarchical comments.\n2. **Synchronous Chat**: Enter active chat channels or prompt the **Gemini AI chatbot** directly in real time.\n3. **AI Guardrails**: All new threads are scanned in the background for toxicity by our AI moderation agent.\n\nTake a look around, create a discussion topic of your own, or test out the chat channels! Custom user registration is fully active.`,
        createdAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
        score: 15,
        commentsCount: 2,
        tags: ['welcome', 'announcements', 'full-stack'],
        isFlagged: false,
        moderationStatus: 'APPROVED',
      },
      {
        id: 'post-2',
        authorId: memberId,
        authorName: 'David Cho',
        authorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
        categoryId: 'cat-tech',
        categoryName: 'Tech Development & Code',
        title: 'How do you handle JWT verification in socket.io handshakes?',
        contentMd: `I am currently building my graduation fullstack project and adding real-time chat. For HTTP routes, I use standard Express middlewares to verify headers, but how do I secure the Socket.io side?\n\nShould I check the token during the handshake connection phase, or should I listen for an 'auth' event from the client?\n\nHere is how I try to verify during handshake:\n\`\`\`javascript\nio.use((socket, next) => {\n  const token = socket.handshake.auth.token;\n  // verification logic here\n  next();\n});\n\`\`\`\n\nIs there a possibility that the connection hangs on invalid tokens? What is the best practice for robust production systems?`,
        createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
        score: 6,
        commentsCount: 1,
        tags: ['socket-io', 'web-sockets', 'node-js', 'jwt'],
        isFlagged: false,
        moderationStatus: 'APPROVED',
      },
      {
        id: 'post-3',
        authorId: expertId,
        authorName: 'Alex Rivera (Staff)',
        authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        categoryId: 'cat-ideas',
        categoryName: 'Ideas, Feedback & Showcases',
        title: 'Showcase: My Portfolio Powered by React + Tailwind + Motion',
        contentMd: `Just published my new developer portfolio! I wanted a minimalist look with very clean spacing and some sleek micro-animations for card transitions. I ended up styling everything with Tailwind utility classes and managing entrance animations using the \`motion\` package.\n\nCheck out the layout choices:\n- Generous, high-contrast typography using Inter.\n- Beautiful staggered cards for projects.\n- Dark mode support using tailwind dark theme selectors.\n\nWould love some feedback on loading speed and layout balance. What do you think?`,
        createdAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
        score: 12,
        commentsCount: 1,
        tags: ['react', 'tailwind', 'portfolio', 'motion'],
        isFlagged: false,
        moderationStatus: 'APPROVED',
      },
    ];

    const seedComments: Comment[] = [
      {
        id: 'comment-1',
        postId: 'post-1',
        authorId: memberId,
        authorName: 'David Cho',
        authorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
        authorRole: 'MEMBER',
        contentMd: 'This forum feels extremely responsive! Love the dual layout. Testing comments out.',
        parentId: null,
        createdAt: new Date(Date.now() - 3.5 * 3600 * 1000).toISOString(),
      },
      {
        id: 'comment-2',
        postId: 'post-1',
        authorId: adminId,
        authorName: 'Sarah (Admin)',
        authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
        authorRole: 'ADMIN',
        contentMd: 'Thanks David! Feel free to ask the AI bot in the `#ai-assistant` room or create threads of your own.',
        parentId: 'comment-1', // Nested reply
        createdAt: new Date(Date.now() - 3.3 * 3600 * 1000).toISOString(),
      },
      {
        id: 'comment-3',
        postId: 'post-2',
        authorId: expertId,
        authorName: 'Alex Rivera (Staff)',
        authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        authorRole: 'MOD',
        contentMd: `Hey David. Yes, executing authorization in the \`io.use\` middleware is the correct industry practice.\n\nIf the token is invalid or missing, you should throw an error inside the middleware: \`next(new Error("Authentication error"))\`.\n\nThis prevents unauthorized handshakes from establishing a persistent connection and protects your server from file descriptors leakage. On the client-side, the socket emits a \`connect_error\` event which you can intercept to prompt re-login!`,
        parentId: null,
        createdAt: new Date(Date.now() - 1.8 * 3600 * 1000).toISOString(),
      },
      {
        id: 'comment-4',
        postId: 'post-3',
        authorId: adminId,
        authorName: 'Sarah (Admin)',
        authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
        authorRole: 'ADMIN',
        contentMd: 'The layouts are extremely elegant Alex! The margins are perfect. Maybe slightly more contrast on the descriptive text would improve accessibility on mobile browsers.',
        parentId: null,
        createdAt: new Date(Date.now() - 0.5 * 3600 * 1000).toISOString(),
      },
    ];

    const seedMessages: Message[] = [
      {
        id: 'msg-1',
        roomId: 'room-general',
        authorId: expertId,
        authorName: 'Alex Rivera (Staff)',
        authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        authorRole: 'MOD',
        type: 'TEXT',
        text: 'Hey everyone! Welcome to the general-chat channel. This chat works in real-time using Socket.io.',
        createdAt: new Date(Date.now() - 1000 * 120).toISOString(),
      },
      {
        id: 'msg-2',
        roomId: 'room-general',
        authorId: memberId,
        authorName: 'David Cho',
        authorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
        authorRole: 'MEMBER',
        type: 'TEXT',
        text: 'Hello Alex! This is incredible. The message delivered instantly without any flickering or full-page updates.',
        createdAt: new Date(Date.now() - 1000 * 60).toISOString(),
      },
      {
        id: 'msg-3',
        roomId: 'room-ai-assistant',
        authorId: aiId,
        authorName: 'Gemini Agent',
        authorAvatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150',
        authorRole: 'MOD',
        type: 'TEXT',
        text: 'Welcome to your AI workspace assistant! Ask me any coding, architectural, or design questions and I will help you solve them in real time.',
        createdAt: new Date(Date.now() - 1000 * 300).toISOString(),
      },
    ];

    const seedNotifications: Notification[] = [
      {
        id: 'notif-1',
        userId: memberId,
        kind: 'reply',
        title: 'New Reply in Thread',
        text: 'Alex Rivera (Staff) replied to your post: How do you handle JWT verification...',
        payload: { postId: 'post-2' },
        seen: false,
        createdAt: new Date(Date.now() - 1.8 * 3600 * 1000).toISOString(),
      },
    ];

    this.data = {
      users: seedUsers,
      passwords: seedPasswords,
      categories: DEFAULT_CATEGORIES,
      posts: seedPosts,
      comments: seedComments,
      votes: [],
      rooms: DEFAULT_ROOMS,
      messages: seedMessages,
      notifications: seedNotifications,
      flags: [],
    };

    this.save();
  }

  // Active getters/setters
  public getUsers() { return this.data.users; }
  public getPasswords() { return this.data.passwords; }
  public getCategories() { return this.data.categories; }
  public getPosts() { return this.data.posts; }
  public getComments() { return this.data.comments; }
  public getVotes() { return this.data.votes; }
  public getRooms() { return this.data.rooms; }
  public getMessages() { return this.data.messages; }
  public getNotifications() { return this.data.notifications; }
  public getFlags() { return this.data.flags; }
}

export const db = new DatabaseManager();
