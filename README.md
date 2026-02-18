<div align="center">

```
    _   __                _____                      
   / | / /__  ____ ______/ ___/___  ______   _____   
  /  |/ / _ \/ __ `/ ___/\__ \/ _ \/ ___/ | / / _ \  
 / /|  /  __/ /_/ / /   ___/ /  __/ /   | |/ /  __/  
/_/ |_/\___/\__,_/_/   /____/\___/_/    |___/\___/   
```

### On-demand Local Services Marketplace

<br/>

[![Next.js](https://img.shields.io/badge/Next.js-15.5-000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-235a97?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-11-dd2c00?style=for-the-badge&logo=firebase&logoColor=white)](https://firebase.google.com/)
[![Firestore](https://img.shields.io/badge/Firestore-NoSQL-dd2c00?style=for-the-badge&logo=firebase&logoColor=white)](https://firebase.google.com/firestore)

<br/>

**[Features](#features)** · **[Architecture](#architecture)** · **[Quick Start](#quick-start)** · **[API Docs](#api-reference)** · **[Contributing](#contributing)**

</div>

<br/>

---

<br/>

## Overview

NearServe is a production-ready platform that connects customers with local service providers in real-time. Designed for the Indian market, it enables quick hiring of skilled workers — plumbers, electricians, carpenters, painters, and more.

<table>
<tr>
<td width="60%">

**Key Highlights**

- Real-time job matching with geolocation
- Secure payments via Razorpay
- Push notifications for instant alerts
- AI-powered chatbot for user assistance
- Professional worker portfolios with reviews

</td>
<td width="40%">

**Project Origin**

This project is a complete rewrite of *Rozgaarsetu*, originally developed as a college mini project. Rebuilt from the ground up with modern technologies and production-grade architecture.

</td>
</tr>
</table>

<br/>

---

<br/>

## Features

<table>
<thead>
<tr>
<th width="33%">For Customers</th>
<th width="33%">For Workers</th>
<th width="33%">Platform</th>
</tr>
</thead>
<tbody>
<tr>
<td>

- Search workers by skill
- Location-based discovery
- Easy booking system
- Secure online payments
- Rating & review system
- Real-time notifications

</td>
<td>

- Professional profile
- Portfolio showcase
- Job management
- Earnings dashboard
- Instant job alerts
- Performance analytics

</td>
<td>

- Multi-provider auth
- Dark & light themes
- Mobile-first design
- AI chatbot assistant
- Real-time sync
- Analytics dashboard

</td>
</tr>
</tbody>
</table>

<br/>

---

<br/>

## Tech Stack

<table>
<tr>
<td><strong>Category</strong></td>
<td><strong>Technologies</strong></td>
</tr>
<tr>
<td>Frontend</td>
<td>

`Next.js 15` `React 19` `TypeScript` `Tailwind CSS 4` `Framer Motion`

</td>
</tr>
<tr>
<td>Backend</td>
<td>

`Next.js API Routes` `Firebase Firestore`

</td>
</tr>
<tr>
<td>Authentication</td>
<td>

`Firebase-auth`

</td>
</tr>
<tr>
<td>Real-time</td>
<td>

`Firebase Firestore` — Live data sync  
`Firebase Cloud Messaging` — Push notifications

</td>
</tr>
<tr>
<td>Payments</td>
<td>

`Razorpay` — UPI, Cards, NetBanking, Wallets

</td>
</tr>
<tr>
<td>Storage</td>
<td>

`Cloudinary` — Image optimization & CDN

</td>
</tr>
<tr>
<td>AI</td>
<td>

`Google Gemini` — Conversational chatbot

</td>
</tr>
</table>

<br/>

---

<br/>

## Architecture

```
                                 ┌──────────────────────────────────┐
                                 │           CLIENT LAYER           │
                                 │    Next.js 15  ·  React 19       │
                                 │    Tailwind CSS  ·  PWA          │
                                 └────────────────┬─────────────────┘
                                                  │
                                                  ▼
                                 ┌──────────────────────────────────┐
                                 │         AUTHENTICATION           │
                                 │          Firebase-auth           │
                                 │    OAuth  ·  Email  ·  Phone     │
                                 └────────────────┬─────────────────┘
                                                  │
                    ┌─────────────────────────────┼─────────────────────────────┐
                    │                             │                             │
                    ▼                             ▼                             ▼
     ┌──────────────────────────┐  ┌──────────────────────────┐  ┌──────────────────────────┐
     │       API LAYER          │  │      FIREBASE            │  │      EXTERNAL            │
     │                          │  │                          │  │                          │
     │  Jobs API                │  │  Firestore (Real-time)   │  │  Razorpay (Payments)     │
     │  Workers API             │  │  FCM (Push)              │  │  Cloudinary (Images)     │
     │  Customers API           │  │  Auth                    │  │  Gemini (AI)             │
     │  Notifications API       │  │                          │  │                          │
     └──────────────────────────┘  └──────────────────────────┘  └──────────────────────────┘
```

<br/>

---

<br/>

## Quick Start

### Prerequisites

| Requirement | Version |
|:------------|:--------|
| Node.js | 18.x or higher |
| npm / pnpm | Latest |

You will also need accounts for: **Firebase-auth**, **Firebase**, and optionally **Razorpay**, **Cloudinary**.

<br/>

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/nearserve.git
cd nearserve

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Start development server
npm run dev
```

The application will be available at `http://localhost:3000`

<br/>

### Environment Configuration

Create `.env.local` with the following variables:

```ini
# Database
# Firebase config is already set up in .env.local

# Firebase-auth Authentication
NEXT_PUBLIC_Firebase-auth_PUBLISHABLE_KEY=pk_test_...
Firebase-auth_SECRET_KEY=sk_test_...

# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}

# Optional: Payments, Storage, AI
RAZORPAY_KEY_ID=rzp_test_...
CLOUDINARY_CLOUD_NAME=...
GOOGLE_GENERATIVE_AI_API_KEY=...
```

See [.env.example](.env.example) for the complete list.

<br/>

---

<br/>

## Project Structure

```
nearserve/
│
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Authentication pages
│   │   ├── sign-in/
│   │   └── sign-up/
│   ├── (main)/                   # Application routes
│   │   ├── customer/             # Customer dashboard & pages
│   │   ├── worker/               # Worker dashboard & pages
│   │   ├── onboarding/           # User onboarding flow
│   │   └── workers/              # Public worker profiles
│   └── api/                      # REST API endpoints
│       ├── auth/
│       ├── customer/
│       ├── worker/
│       ├── jobs/
│       └── notifications/
│
├── components/                   # React components
│   ├── ui/                       # Base UI components
│   ├── customer/                 # Customer-specific
│   └── worker/                   # Worker-specific
│
├── lib/                          # Utilities & services

│   ├── firebase-admin.ts         # Firebase Admin SDK
│   ├── firebase-client.ts        # Firebase Client SDK
│   └── razorpay-service.ts       # Payment service
│
├── hooks/                        # Custom React hooks
├── contexts/                     # React context providers
├── types/                        # TypeScript definitions
│

```

<br/>

---

<br/>

## API Reference

### Authentication

| Endpoint | Method | Description |
|:---------|:------:|:------------|
| `/api/auth/session` | `GET` | Retrieve current session |
| `/api/auth/callback` | `GET` | OAuth callback handler |
| `/api/auth-check` | `GET` | Verify authentication status |

### Jobs

| Endpoint | Method | Description |
|:---------|:------:|:------------|
| `/api/jobs` | `GET` | List all jobs with filters |
| `/api/jobs` | `POST` | Create a new job |
| `/api/jobs/[id]` | `GET` | Get job by ID |
| `/api/jobs/[id]` | `PATCH` | Update job status |

### Workers

| Endpoint | Method | Description |
|:---------|:------:|:------------|
| `/api/workers` | `GET` | Search workers |
| `/api/worker/profile` | `GET` | Get worker profile |
| `/api/worker/profile` | `PUT` | Update worker profile |
| `/api/worker/jobs` | `GET` | Get assigned jobs |
| `/api/worker/earnings` | `GET` | Get earnings summary |

### Customers

| Endpoint | Method | Description |
|:---------|:------:|:------------|
| `/api/customer/profile` | `GET` | Get customer profile |
| `/api/customer/profile` | `PUT` | Update customer profile |
| `/api/customer/jobs` | `GET` | Get customer bookings |
| `/api/customer/dashboard-stats` | `GET` | Dashboard statistics |

### Notifications

| Endpoint | Method | Description |
|:---------|:------:|:------------|
| `/api/fcm/subscribe` | `POST` | Subscribe to push notifications |
| `/api/notifications/send` | `POST` | Send notification |
| `/api/notifications/mark-read` | `POST` | Mark as read |

<br/>

---

<br/>

## Available Scripts

| Command | Description |
|:--------|:------------|
| `npm run dev` | Start development server with Turbopack |
| `npm run build` | Create production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |


<br/>

---

<br/>

## Contributing

Contributions are welcome. Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes and commit: `git commit -m 'Add your feature'`
4. Push to your fork: `git push origin feature/your-feature`
5. Submit a Pull Request

Please ensure your code follows the existing style and passes linting.

<br/>

---

<br/>

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

<br/>

---

<br/>

<div align="center">

**NearServe** — Built for the Indian blue-collar workforce

<br/>

[Report Bug](https://github.com/yourusername/nearserve/issues) · [Request Feature](https://github.com/yourusername/nearserve/issues)

</div>
