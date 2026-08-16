# Native - Fleet Control Plane & SaaS

A high-performance control plane and management dashboard for autonomous Minecraft bot fleets, built with Next.js, Node.js, and Tailwind CSS.

## 🚀 Features

- **Fleet Orchestration**: Spawn, monitor, and manage bot instances in isolated sandbox processes.
- **Proxy Network**: SOCKS5 proxy pool management with latency/health telemetry and auto-assignment.
- **Visual Scripting & Modules**: Real-time hot-reloading behavior scripts, cron schedules, and fleet-wide commands.
- **Real-Time Streaming**: Server-Sent Events (SSE) pushing console logs, inventory, and status live.
- **Stripe Billing & Tier Management**: Preset packages and custom dynamic fleet capacity builder.
- **Multi-Tenant Workspaces**: Role-based access control, workspace isolation, and user management.

## 🛠️ Tech Stack

- **Frontend**: Next.js 16 (Turbopack), React, Tailwind CSS, Lucide Icons
- **Backend / Engine**: Node.js, SSE, Mineflayer / Minecraft protocol libraries
- **Database / Auth**: Supabase / Local Workspace & System Data Store
- **Payments**: Stripe Checkout & Webhooks

## 📦 Getting Started

### Prerequisites
- Node.js 18+ 
- npm / yarn / pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/navidu-sathsara/native.git

# Install dependencies
npm install

# Build Next.js application
npm run build:web

# Start application
npm start
```

## 📄 License
MIT
