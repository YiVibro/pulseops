Here is a clean, professional, and comprehensive **`README.md`** tailored for your **PulseOps** repository. It balances high-level architecture with deep technical installation steps so recruiters, engineers, and open-source contributors can immediately understand and run the project.

---

```markdown
# ⚡ PulseOps — Infrastructure Telemetry & Observer Platform

![PulseOps Terminal Dashboard](https://raw.githubusercontent.com/your-username/pulseops/main/docs/dashboard-preview.png)

**PulseOps** is a low-latency, real-time infrastructure monitoring platform designed to aggregate, store, and display system telemetry across dynamic server clusters. Built with a terminal-inspired TUI aesthetic, it seamlessly handles high-throughput time-series data while providing secure multi-tenant user isolation.

---

## 🏗️ Architecture & Stack Overview

PulseOps uses a decoupled hybrid architecture: a global Edge-deployed React frontend, a containerized Node.js ingestion backend, InfluxDB for time-series persistence, and Supabase for user authentication and access control.


```

┌──────────────────────────────────────────────┐
│          Frontend (Vercel / Edge)            │
│  - React 18 + TypeScript + Vite              │
│  - Terminal Dashboard UI (Lucide Icons)      │
│  - Supabase JS SDK (JWT Auth & RLS)          │
└──────────────────────┬───────────────────────┘
│
HTTPS / WebSockets (Socket.IO)
│
▼
┌──────────────────────────────────────────────┐
│           Backend Cluster (AWS EC2)          │
│  - Express.js API Gateway                    │
│  - Socket.IO Live Telemetry Broadcaster       │
│  - Redis Stream Telemetry Buffer             │
│  - InfluxDB 3.0 Engine (Time-Series Metrics) │
└──────────────────────────────────────────────┘
▲
│ HTTP/JSON Telemetry Stream
│
┌──────────────────────────────────────────────┐
│          Remote Node Collector Agents        │
│  - Light Bash Script (collector.sh)          │
│  - Reads /proc/stat, free, df, ip netlink    │
└──────────────────────────────────────────────┘

```

---

## ✨ Key Features

* 💻 **Vortex-TUI Dashboard:** Retro-futuristic, high-contrast terminal UI with live ASCII progress bars for CPU, Memory, Disk, and Network performance.
* ⚡ **Sub-Second Telemetry Ingestion:** Uses Redis Streams and InfluxDB 3.0 to ingest system metrics with negligible latency.
* 🔐 **Multi-Tenant Server Isolation:** Powered by **Supabase Row-Level Security (RLS)**. Operators only view and manage telemetry streams from servers bound to their account.
* 🛠️ **Dynamic Node Onboarding:** One-click single-use provisioning tokens for seamless agent deployment on Ubuntu/Debian Linux nodes via a single `curl | bash` command.
* 📊 **Deep System Telemetry:** Measures individual CPU core loads, exact RAM and Swap usage in GiB, mounted storage partition capacity, and real-time network link speeds.

---

## 🛠️ Tech Stack

### **Frontend**
* **Framework:** React 18 (Vite, TypeScript)
* **Styling:** Tailwind CSS, Lucide React
* **Authentication:** Supabase Auth SDK
* **Real-time Engine:** Socket.IO Client

### **Backend & Storage**
* **Runtime:** Node.js, Express.js
* **Time-Series Database:** InfluxDB 3.0 (SQL engine)
* **Auth & Relations Database:** Supabase (PostgreSQL with RLS)
* **Cache & Buffering:** Redis Pub/Sub Streams
* **Containerization:** Docker & Docker Compose

---

## 📂 Project Structure

This repository contains the standalone **PulseOps Frontend**.

```text
pulseops-frontend/
├── public/                  # Static assets
├── src/
│   ├── components/          # AddServerModal, Auth, ProtectedRoute, etc.
│   ├── hooks/               # Custom hooks (useSocket, useServers)
│   ├── lib/                 # Supabase and Socket.IO client instances
│   ├── pages/               # Login, TerminalDashboard, ServerDetail
│   ├── App.tsx              # React Router v6 setup
│   └── main.tsx             # Application entrypoint
├── vercel.json              # SPA client-side rewrite configurations
├── vite.config.ts           # Vite build settings
└── package.json

```

---

## 🚀 Quickstart & Local Setup

### **Prerequisites**

* **Node.js**: `v18.x` or higher
* **npm** or **yarn**
* Active **Supabase** project instance
* Running **PulseOps Backend API** (EC2 / Local Docker)

---

### **1. Clone the Repository**

```bash
git clone [https://github.com/your-username/pulseops-frontend.git](https://github.com/your-username/pulseops-frontend.git)
cd pulseops-frontend

```

### **2. Install Dependencies**

```bash
npm install

```

### **3. Configure Environment Variables**

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
VITE_SUPABASE_URL=[https://your-project-id.supabase.co](https://your-project-id.supabase.co)
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# PulseOps Ingestion & Telemetry Backend
VITE_API_URL=[http://18.138.103.202:5000](http://18.138.103.202:5000)

```

### **4. Start the Development Server**

```bash
npm run dev

```

Visit `http://localhost:5173` in your browser.

---

## 🔐 Database & Auth Configuration (Supabase Setup)

To allow multi-tenant isolation so users can only view their own registered servers, execute the following script in your **Supabase SQL Editor**:

```sql
-- 1. Create Servers Table linked to auth.users
CREATE TABLE public.servers (
  id VARCHAR(64) PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable Row-Level Security (RLS)
ALTER TABLE public.servers ENABLE ROW LEVEL SECURITY;

-- 3. Define RLS Access Policies
CREATE POLICY "Users can select their own servers"
  ON public.servers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own servers"
  ON public.servers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own servers"
  ON public.servers FOR DELETE
  USING (auth.uid() = user_id);

```

---

## 🌐 Deploying to Vercel

PulseOps is optimized for single-command production deployment on **Vercel**:

1. Push your repository to GitHub.
2. Import the project into **[Vercel](https://vercel.com)**.
3. Configure Environment Variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_URL`).
4. Click **Deploy**.

> **Note:** The included `vercel.json` ensures smooth single-page navigation without `404 Not Found` errors when directly visiting protected routes like `/terminal` or `/login`.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://www.google.com/search?q=https://github.com/your-username/pulseops/issues).

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.

```

```