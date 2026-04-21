# Digital Development Institute Website

This is the main website and student portal for **Digital Development Institute**. I built it as a modern React-based web application to handle program discovery, account creation, protected checkout flows, student dashboard access, payment tracking, and admin-side progression management.

The site is more than a marketing page. It is designed as a working platform for students and families to browse programs, create accounts, enroll, view payment history, track status, and move through a structured progression system.

---

## What This Project Is

Digital Development Institute is a structured software and game development education platform. This website is the frontend and portal layer for that system.

Through this project, I built a site that supports:

- public-facing program and contact pages
- account registration and login
- protected routes for enrollment and portal access
- program gating based on progression rules
- checkout flows for e-Transfer and Stripe
- payment confirmation flow
- student dashboard and portal summaries
- admin tools for managing progression and placement access
- Supabase-backed profile, payment, and program status data

This project is meant to function as both:
- a polished public-facing website
- a lightweight internal portal for managing student enrollment and progression

---

## Tech Stack

This project is built with:

- **React**
- **Vite**
- **React Router**
- **Supabase**
- **Tailwind / custom styling system**
- **Cloudflare Functions / Wrangler**
- **Stripe**
- **Lucide React**

---

## Core Features

## Public Website

The public side of the site includes:
- a landing page
- program listings
- individual program detail pages
- a contact page
- account access

I designed the public-facing flow so that visitors can quickly understand:
- what Digital Development Institute is
- who the programs are for
- how the level system works
- what each program costs
- how progression and placement work

The site uses a shared UI system so the pages feel consistent and reusable rather than hardcoded page by page.

---

## Program System

I structured the site around three program levels:

- **Level 1**
- **Level 2**
- **Level 3**

Each level includes:
- pricing
- age / grade guidance
- program timeline
- summary
- skill breakdown
- progression rules

The program flow is not just informational. I built access rules directly into the app so the site can determine whether a user can:
- view a level as open
- go to checkout
- continue a paid program
- return to their dashboard
- see a level as locked until they complete prerequisites or receive placement access

This makes the site behave more like a real enrollment portal than a simple brochure site.

---

## Authentication and User Profiles

I integrated **Supabase Auth** to support:
- account creation
- login
- logout
- session restoration
- protected route handling

User profile data is loaded from Supabase and used to control application behavior, including:
- username
- current level
- completed levels
- paid levels
- placement access
- admin access

Once logged in, users get a different navigation flow than public visitors. Instead of being treated like anonymous traffic, they are routed into the student portal side of the application.

---

## Protected Enrollment Flow

I built protected checkout routes so users must be signed in before enrolling.

The checkout flow includes:
- buyer information collection
- payment method selection
- agreement confirmation
- captcha checkbox
- calculated totals
- program eligibility validation

Before allowing checkout, the site checks progression rules so users cannot enroll in levels they do not yet qualify for.

This means enrollment is tied directly to:
- account state
- profile progression
- placement access
- prior completion

---

## Payment Flow

The project currently supports two payment paths:

### 1. e-Transfer
For e-Transfer, I built a flow that:
- creates a payment record
- generates a reference code
- generates a confirmation code
- gives the user exact transfer instructions
- lets the user confirm their payment afterward

After confirmation, the site updates:
- payment status
- paid program access
- profile level data
- program status records

### 2. Stripe
I also added a Stripe checkout session flow through a server-side function.

This allows the site to:
- create a Stripe checkout session
- redirect the user to Stripe
- preserve program-specific checkout behavior
- support card payments separately from the e-Transfer flow

---

## Student Dashboard

I built a dashboard so logged-in users can see their portal state in one place.

The dashboard includes:
- active program summary
- current level
- recommended action
- next unlock target
- progress information
- payment history
- program status awareness

Instead of treating the site as a static enrollment page, I wanted the portal to feel like a student-facing system with continuity between payment, access, and progression.

---

## Admin Tools

I added an admin route and admin page so profiles can be managed without directly editing data manually in the database every time.

The admin panel allows me to:
- load a user profile by email
- mark levels complete
- remove completed levels
- grant placement access
- revoke placement access
- update progression state
- keep profile data and program status data in sync

This gives the site a lightweight internal operations layer, which is important for managing a real program structure.

---

## UI System

One of the main things I focused on in this project was building a reusable design system rather than styling each page independently.

I created shared UI building blocks such as:
- page containers
- section cards
- program cards
- summary cards
- buttons
- text inputs
- route guards
- timeline items

I also centralized visual configuration through a shared `visualAid` setup so I could control:
- colors
- text styles
- spacing
- layout patterns
- button styles
- icon usage
- reusable panel styling

That makes the project easier to scale and keeps the visual language consistent across the site.

---

## Application Structure

The application is organized around a few main areas:

### Routing
The app uses React Router to define:
- public pages
- protected checkout routes
- protected dashboard routes
- admin-only routes

### Context
Authentication state is handled through a shared auth context so session and profile information can be reused across the application.

### Pages
The main pages include:
- Home
- Programs
- Program Details
- Checkout
- e-Transfer
- Payment Confirmation
- Account
- Dashboard
- Contact
- Admin

### Data / Logic
Shared helper modules handle things like:
- pricing and totals
- payment code generation
- profile progression
- program access logic
- program display state
- dashboard summaries
- recommended user actions

This separation helps keep the app cleaner and avoids putting too much logic directly inside page components.

---

## Project Goals

With this project, I wanted to build something that felt practical and usable, not just visually presentable.

My goals with the site were to create a platform that:
- clearly communicates the Digital Development Institute offering
- supports real user accounts and enrollment
- enforces progression rules through the UI
- tracks payment and program state
- gives students a portal experience after signup
- gives me a manageable admin interface
- can continue growing into a larger education platform

---

## Running the Project

## Install dependencies
npm install
Start development server
npm run dev
Build for production
npm run build
Preview with Wrangler
npm run preview
Deploy
npm run deploy
