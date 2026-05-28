# Cohort.io — Community Discussion Forum with Real-Time Chat

A modern, highly responsive, full-stack hybrid platform that pairs asynchronous threaded discussion boards (similar to Reddit/Discourse) with real-time cohort chat channels (similar to Slack/Discord). 

This repository represents a fully functional industry-grade software project designed for portfolios and graduation showcases, implementing secure JWT authorization, web socket room handshakes, database state persistence, and automatic background content moderation powered by Google Gemini AI.

---

## 🎨 Design Concept: "Slate Academic"
Cohort.io is built around a clean, high-contrast, professional "Slate Academic" layout utilizing responsive spacing, micro-animations, and soft off-white gradients paired with deep indigo accents:
- **Dual-Pane Feed**: Asynchronous nested replies, vote metrics, and custom category drawers on the left; system alerts and online student directory on the right.
- **Bi-Directional Sockets**: Multiplexed channels supporting real-time broadcast and typing indicators without screen flickering.
- **AI-Powered Mentor Inside**: A server-side Gemini 3.5 Flash chatbot lives in `#ai-assistant` to solve code syntax and system architecture questions instantly.

---

## 🏗️ System Architecture

```text
 ┌────────────────────────────────────────────────────────┐
 │                   React client SPA                     │
 └───────┬───────────────────┬───────────────────▲────────┘
         │                   │                   │
  HTTP /api REST Requests    │ Handshake authorization
         │                   │                   │
         ▼                   ▼                   │
 ┌───────────────┐   ┌───────────────┐   ┌───────┴────────┐
 │   Express     │   │   Socket.IO   │   │   Socket.IO    │
 │  Controller   │   │  Room Gateway │   │ Broadcast Node │
 └───────┬───────┘   └───────┬───────┘   └───────▲────────┘
         │                   │                   │
         └─────────────┐     │                   │
                       ▼     ▼                   │
             ┌────────────────────────┐          │
             │ SQLite / JSON DB State │──────────┘
             └──────────┬─────────────┘
                        │
             Trigger Auto-Moderation & Chatbot Response
                        │
                        ▼
                 ┌─────────────┐
                 │ Google AI   │
                 │ Gemini API  │
                 └─────────────┘
```

---

## 🛠️ Tech Stack & Capabilities

- **Frontend**: React 19 (Hooks), Tailwind CSS, Lucide icons, Motion Core.
- **Backend**: Node.js, Express.js (REST Routing), TSX, Esbuild (Bundler).
- **Real-Time Integration**: Socket.IO client-server handshakes, online directories, typing indicators.
- **Database Storage**: Self-contained schema records (Users, Categories, Posts, Comments, Messages, Flags) written to local disk paths.
- **AI Capabilities**: Google `@google/genai` (Gemini 3.5 Flash) for automated toxicity scanning and real-time chat mentoring.

---

## ⚙️ Core API Endpoints

### 🔑 Authentication & Profiles
- `POST /api/auth/register`: Create student account with random Dicebear identicon avatars and default biographies.
- `POST /api/auth/login`: Authenticate emails and passwords, returning client-side JWT authorization tokens.
- `GET /api/users/me`: Return profile attributes for authenticated headers.
- `PUT /api/users/me`: Modify user names, biographies, and descriptions.

### 📝 Threaded Discussions & Votes
- `GET /api/categories`: Return categories list.
- `GET /api/posts`: List discussions with query parameters for `categoryId`, `tag`, `search`, and `page`.
- `POST /api/posts`: Build a new post (scanned in background by Gemini AI moderator).
- `POST /api/posts/:id/vote`: Cast upward or downward scores.
- `DELETE /api/posts/:id`: Close thread (staff or author permission required).

### 💬 Responses & Chat Logs
- `GET /api/posts/:postId/comments`: Load threaded comment trees.
- `POST /api/posts/:postId/comments`: Add nested replies.
- `GET /api/messages/:roomId`: Recover historical logs for real-time room chats.
- `GET /api/notifications`: View unread counters and staff warnings.

---

## ⚡ Socket.IO Event Guide

- `auth:socket` (Client Send): Establish authenticated handshakes with JWT verification.
- `auth:success` (Server Broadcast): Re-broadcast authenticated student user state.
- `presence:list` (Server Emission): Active online student records lists sync.
- `room:join` / `room:leave` (Client Send): Move clients across channels seamlessly.
- `typing:start` / `typing:stop` (Client Send): Broadcast live writing state indicators.
- `message:send` / `message:new` (Bi-Directional): Real-time chat distribution nodes.

---

## 🚀 Local Installation Guide

### Prerequisite Environment
- **Node.js**: Version 18.x or above installed.
- **Gemini API Key** (Optional): Grab an API Key to lock-in the AI moderation.

### Setup Steps
1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/cohort-io.git
   cd cohort-io
   ```
2. **Install core packages**:
   ```bash
   npm install
   ```
3. **Set up Environment Variables**:
   Create a `.env` file in the root:
   ```env
   GEMINI_API_KEY="your_gemini_api_key"
   JWT_SECRET="make-up-some-secret-string-here"
   ```
4. **Boot Development Full-Stack Mode**:
   ```bash
   npm run dev
   ```
   This compiles your React assets dynamically and starts the Express + Socket.IO server on:
   - **Endpoint**: `http://localhost:3000`

5. **Build and Start Standalone Production**:
   ```bash
   npm run build
   ```
   Compiles frontend files completely into `dist/` and compiles TypeScript servers into ES standalone CommonJS, then:
   ```bash
   npm run start
   ```

---

## 🎓 Portfolio Simulation Checklist

To capture professional outputs for your GitHub graduation profile, follow these steps:
1. **Authentication**: Register a new student or log into `admin@forum.com` / `admin123`.
2. **Launch Thread**: Publish a discussion thread in the "Tech Development & Code" category, utilizing markdown blocks.
3. **AI Moderation (Toxicity Check)**: Try publishing a post containing commercial terms or profanity (e.g. including keywords like `"advertise-fake"`). Review how the applet marks it as `Pending moderation review` and generates alerts on staff screens.
4. **Interactive AI Mentoring**: Head to the `#ai-assistant` room in Real-time Channels, type a question (e.g. `"How do you secure handshakes with JWT?"`), and watch Gemini respond in real time.
5. **Multi-Tab Interactions**: Open the app in two browser tabs. Log in as Alex Staff on one and David on the other. Witness real-time messages and typing indicators syncing instantly without refreshing!
