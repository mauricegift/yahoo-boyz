# Yahoo-Boyz

A financial community platform for managing contributions, savings, and loans (Chama application).

## Overview

This is a full-stack TypeScript application built with:
- **Frontend**: React 18 with Vite, TailwindCSS, Radix UI components
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT-based authentication with OTP verification

## Project Structure

```
├── client/           # React frontend
│   ├── src/          # React source code
│   └── public/       # Static assets
├── server/           # Express backend
│   ├── index.ts      # Server entry point
│   ├── routes.ts     # API routes
│   ├── db.ts         # Database connection
│   └── vite.ts       # Vite dev middleware
├── shared/           # Shared code (schema, types)
│   └── schema.ts     # Drizzle database schema
├── script/           # Build scripts
└── dist/             # Production build output
```

## Key Features

- User registration with OTP verification (SMS/Email)
- Daily contributions tracking with advance payment support (Ksh 20/day)
- Savings management
- Loan applications with 2 guarantor requirement
- Admin dashboard for user and loan management
- M-Pesa payment integration
- Super admin role (first user) with full platform control

## Role System

- **user**: Regular member with contribution, savings, and loan access
- **admin**: Can manage users, approve loans, view reports
- **superadmin**: Full platform control, can disable users, promote/demote admins

## Recent Updates

- Added comprehensive scroll-based animations (fade, zoom, slide) to Home, About, and Contact pages using Intersection Observer
- ScrollAnimation component created with multiple animation types (fade-up, fade-down, fade-left, fade-right, zoom-in, zoom-out)
- Added contribution tracking with days ahead/behind calculation
- Loan guarantor system requiring 2 guarantors with combined savings >= loan amount
- Admin user management with edit capabilities (verification, role, disable)
- Disabled users are automatically logged out and denied access
- Navigation links (My Contributions, My Savings, My Loans) in header
- Improved payment flow with loading states and auto-closing dialogs
- Circular image cropping for profile pictures using react-image-crop
- Admin Dashboard shows "Contribution Status" column with days behind/ahead per user
- Auto-logout on token expiration (401) and disabled user access (403)
- Missed contributions enforcement with partial payment support
- Loan guarantor validation: users cannot use their own phone/email as guarantor (client + server)
- Prominent "Pay Missed Contributions" button on Contributions page when days are outstanding
- Updated loan interest rate from 10% to 15%
- Admin user editing permissions: admins can edit all users except superadmin accounts
- Account Status column in Users table showing Active/Inactive status (Active for enabled, Inactive for disabled)
- Superadmin accounts protected from modifications (show "Protected" label)
- Admin retry payment buttons now use proper M-Pesa STK push with payment confirmation
- Query invalidation ensures updates reflect immediately on all dashboards
- Group and user totals now calculated from user records (admin edits update totals correctly)
- Admin loans tab shows full applicant details (name, email, phone) instead of just user ID
- Admin loans tab shows full guarantor details (name, email, phone, savings) for each loan
- Admin contact messages tab shows sender details (name, email, phone) instead of just user ID
- Admin contact messages shows admin name who replied
- User contact page shows admin name who replied to their messages
- URL hash navigation in admin dashboard (#overview, #users, #loans, #contributions, #messages) with persistence on reload
- Overview tab shows sub-tabs for Recent Contributions and Recent Savings (first 5 each)
- Retry buttons for both "pending" and "failed" status on contributions and savings
- Admin dashboard pagination (20 items per page) for Users, Loans (all), Transactions (contributions/savings), and Messages tabs
- User pages pagination updated to 20 items per page (Contributions, Savings)
- Fixed data consistency: Contributions and Savings stats endpoints now use authoritative user.totalContributions/totalSavings from user record (same as Dashboard)
- All pages (Dashboard, Contributions, Savings) now display consistent totals and missed days calculations
- OTP verification codes now sent to BOTH email AND phone simultaneously for better delivery
- Removed OTP preference selection from signup - all users receive codes via both channels
- Updated auth pages messaging to "Check your phone/email for the code"
- Desktop header dropdown menu simplified to show only Profile and Logout (no duplicate links)
- About Us and Contact pages now visible in header for both authenticated and non-authenticated users
- Mobile sidebar updated with full navigation including About Us and Contact for logged-in users
- Fixed password reveal/hide button positioning on all auth pages
- Added Header and Footer to all auth pages (Login, Signup, ForgotPassword, ResetPassword, Verify)
- Logged-in users visiting auth pages are redirected to dashboard with "Already logged in" toast
- Non-admin users visiting /admin page are redirected with "Unauthorized access" toast
- Strong password validation (8+ chars, uppercase, lowercase, number, special character) on signup, reset, and profile pages
- PasswordStrength component shows real-time password strength with color-coded indicator and requirement checklist
- PageTransition component adds smooth fade-in/slide-up animations to page transitions
- TabsContent now animates on tab switch with fade and slide effects
- Skeleton component enhanced with shimmer animation effect
- Added SkeletonCard and SkeletonList components for loading states
- AnimatedCard component with staggered animations and hover effects
- Extensive CSS animation utilities (fadeInUp, scaleIn, shimmer, stagger delays)

## Development

The app runs on port 5000 in development mode with Vite HMR.

```bash
npm run dev      # Start development server
npm run db:push  # Push schema changes to database
npm run build    # Build for production
npm run start    # Start production server
```

## Environment Variables

Required secrets:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing secret
- `SESSION_SECRET` - Express session secret
- `SMS_API_TOKEN` - SMS service API token

Configuration:
- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment mode
- `MPESA_API_URL` - M-Pesa API endpoint
- `SMS_API_URL` - SMS service endpoint
- `EMAIL_API_URL` - Email service endpoint

## Database Schema

Main tables:
- `users` - User accounts with roles
- `contributions` - Daily contribution records
- `savings` - User savings
- `loans` - Loan applications
- `loan_repayments` - Loan payment records
- `otp_codes` - OTP verification codes
- `contact_messages` - User support messages
