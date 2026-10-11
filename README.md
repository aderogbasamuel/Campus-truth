# CampusTruth 🎓

**Know what's happening. Know what's true.**

CampusTruth is a student-focused campus information platform designed to help students access reliable school updates, connect with their campus community, ask questions, and find important information in one place.

Starting with the University of Lagos (UNILAG), CampusTruth aims to make campus information easier to discover, understand, and trust.

## ✨ Features

* **Campus Feed** — Discover campus updates, announcements, and student discussions.
* **AI Campus Assistant** — Ask questions about campus life and get helpful answers.
* **Student Q&A** — Ask questions, share knowledge, and learn from other students.
* **Campus Communities** — Connect with students across faculties, departments, and academic levels.
* **Verified Announcements** — Access important school information from trusted sources.
* **Student Profiles** — Personalize your campus identity and connect with the community.
* **Notifications** — Stay informed about relevant activity and updates.
* **Saved Items** — Keep useful posts and information for later.
* **Credit-Based AI Usage** — Manage credits used for AI-powered assistance.
* **Moderation and Reporting** — Support a safer, more trustworthy campus community.

## 🛠️ Tech Stack

* **Frontend:** React, TypeScript, Vite
* **Styling:** Tailwind CSS
* **Backend and Database:** Supabase
* **Authentication:** Supabase Auth
* **File Storage:** Supabase Storage
* **Database Security:** PostgreSQL Row Level Security (RLS)
* **Icons:** Lucide React

## 🏗️ Architecture

CampusTruth uses Supabase as its backend platform.

* PostgreSQL stores users, posts, comments, questions, answers, communities, announcements, and other application data.
* Supabase Auth manages user authentication.
* Supabase Storage handles uploaded media.
* Row Level Security policies control access to database records.
* Database functions and triggers support credit management, profile creation, timestamps, and notifications.

The React frontend communicates with Supabase for supported application operations. Privileged actions and AI-related operations should be handled through secure server-side functions.

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed:

* Node.js
* npm
* A Supabase account

### 1. Clone the repository

```bash
git clone https://github.com/aderogbasamuel/Campus-truth
cd Campus-truth
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env.local` file in the project root:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

Replace the placeholder values with the URL and publishable key from your Supabase project.

**Security:** Never expose your Supabase service-role key or other secret credentials in frontend code or commit them to Git.

### 4. Start the development server

```bash
npm run dev
```

Open the local URL printed in your terminal to view the application.

## 🗄️ Database Setup

CampusTruth uses PostgreSQL through Supabase.

The database schema includes entities for:

* Schools, faculties, and departments
* Profiles and user roles
* Credits and credit transactions
* Posts, comments, and reactions
* Questions and answers
* Announcements and knowledge sources
* Communities and community memberships
* Conversations and messages
* Notifications and saved items
* User reports

The schema also defines database functions, triggers, indexes, Row Level Security policies, storage buckets, and initial UNILAG data.

To set up a fresh database, apply the project's SQL migration using the Supabase SQL Editor or Supabase CLI, as appropriate.

## 🔐 Authentication

CampusTruth is designed to support email-and-password authentication, with Google OAuth available once the provider is configured.

To enable Google sign-in:

1. Configure Google OAuth credentials in Google Cloud.
2. Enable the Google provider in Supabase Authentication settings.
3. Configure the authorized redirect URLs in Supabase.
4. Add the relevant application URLs to Supabase's redirect allowlist.

## 🗺️ Roadmap

* [ ] Complete authentication and onboarding
* [ ] Build the personalized campus feed
* [ ] Implement posts, comments, and reactions
* [ ] Complete student Q&A
* [ ] Integrate the AI Campus Assistant
* [ ] Enforce secure AI credit usage
* [ ] Complete community membership and discovery
* [ ] Implement notifications
* [ ] Build moderation and reporting workflows
* [ ] Improve mobile responsiveness and accessibility
* [ ] Launch the initial UNILAG experience
* [ ] Expand to other campuses

## 🎨 Brand Identity

CampusTruth uses a simple visual identity built around trust, clarity, and student-centered design.

* **Lime:** `#F2FD7D`
* **Dark Green:** `#28443F`

## 🌍 Vision

CampusTruth aims to become a trusted information layer for campus communities, helping students spend less time searching through scattered sources and more time making informed decisions.

Starting with UNILAG, the long-term goal is to make reliable campus information accessible across universities.

## 🤝 Contributing

Contributions, suggestions, and bug reports are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Make your changes.
4. Test your changes.
5. Open a pull request with a clear description.

## 📄 License

A license has not yet been specified. Until one is added to the repository, all rights remain with the copyright holder.

---

**CampusTruth — Know what's happening. Know what's true.**
