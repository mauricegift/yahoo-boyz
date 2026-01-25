# Yahoo-Boyz - Financial Community Platform

A comprehensive financial community platform (Chama application) for managing daily contributions, savings, and loans with M-Pesa integration.

## Features

- User registration with OTP verification (SMS & Email)
- Daily contributions tracking (Ksh 20/day) with advance payment support
- Savings management with deposit/withdrawal functionality
- Loan applications with 2 guarantor requirement
- Admin dashboard for user and loan management
- M-Pesa payment integration
- Role-based access control (User, Admin, Super Admin)
- Responsive design with professional animations

## Tech Stack

- **Frontend**: React 18, Vite, TailwindCSS, Radix UI, React Query
- **Backend**: Express.js, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT-based with OTP verification

## Prerequisites

- Node.js 18+ 
- PostgreSQL database
- SMS API service (for OTP delivery)
- Email API service (for OTP delivery)
- M-Pesa API credentials (for payments)

## Environment Setup

Create a `.env` file in the root directory with the following configuration:

### Required Secrets

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string. Get a free database from [neon.tech](https://console.neon.tech) |
| `JWT_SECRET` | Secret key for JWT token signing (min 32 characters recommended) |
| `SESSION_SECRET` | Secret key for Express session (min 32 characters recommended) |
| `SMS_API_TOKEN` | API token for SMS service provider |

### Optional Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 5000 | Server port |
| `NODE_ENV` | development | Environment mode (development/production) |
| `MPESA_API_URL` | - | M-Pesa API endpoint |
| `SMS_API_URL` | - | SMS service endpoint |
| `EMAIL_API_URL` | - | Email service endpoint |

### Example .env file

```env
# Database - Get free PostgreSQL from https://console.neon.tech
DATABASE_URL=postgresql://user:password@host:5432/database

# Authentication Secrets (use strong random strings)
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
SESSION_SECRET=your-session-secret-key-minimum-32-characters

# SMS Service - Contact https://api.giftedtech.co.ke/contact for bulk SMS solutions
SMS_API_TOKEN=your-sms-api-token
SMS_API_URL=https://your-sms-provider.com/api

# Email Service
EMAIL_API_URL=https://your-email-provider.com/api

# M-Pesa Integration - Contact https://api.giftedtech.co.ke/contact for M-Pesa integration
MPESA_API_URL=https://mpesapi.giftedtech.co.ke

# Server Configuration
PORT=5000
NODE_ENV=development
```

## Installation

1. Clone the repository:
```bash
git clone https://github.com/mauricegift/yahoo-boyz.git
cd yahoo-boyz
```

2. Install dependencies:
```bash
npm install
# or
bun install
# or
pnpm install
# or
yarn install
```

3. Set up environment variables:
```bash
cp example.env .env
# Edit .env with your configuration
```

4. Push database schema:
```bash
npm run db:push
```

5. Start development server:
```bash
npm run dev
```

6. Access the application at `http://localhost:5000`

## Running on Replit

1. Fork or import this repository to Replit
2. The PostgreSQL database will be automatically provisioned
3. Add the required secrets in the "Secrets" tab:
   - `JWT_SECRET`
   - `SESSION_SECRET`
   - `SMS_API_TOKEN`
4. Click "Run" to start the application
5. Access the app via the provided Replit URL on **port 5000**

## Super Admin Setup

**IMPORTANT:** The **first user to register** on the platform automatically becomes the **Super Admin** with full platform control:

- Manage all users (enable/disable accounts)
- Promote users to Admin or demote Admins
- Approve/reject loan applications
- View all platform statistics and reports
- Access all admin dashboard features
- Protected from modifications by other admins

Subsequent users register as regular members with standard permissions.

## Role System

| Role | Permissions |
|------|-------------|
| **User** | Make contributions, manage savings, apply for loans, be a guarantor |
| **Admin** | All user permissions + manage users, approve loans, view reports |
| **Super Admin** | All admin permissions + disable users, promote/demote admins, full platform control |

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload on port 5000 |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run db:push` | Push schema changes to database |

## Project Structure

```
yahoo-boyz/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── lib/            # Utilities and hooks
│   │   └── index.css       # Global styles
│   └── public/             # Static assets
├── server/                 # Express backend
│   ├── index.ts            # Server entry point
│   ├── routes.ts           # API routes
│   ├── db.ts               # Database connection
│   └── vite.ts             # Vite dev middleware
├── shared/                 # Shared code
│   └── schema.ts           # Drizzle database schema
├── script/                 # Build scripts
└── dist/                   # Production build output
```

## Deployment

### Production Build

1. Build the application:
```bash
npm run build
```

2. Set environment variables for production:
```bash
NODE_ENV=production
PORT=5000
# ... other required variables
```

3. Start the production server:
```bash
npm run start
```

The production server runs on **port 5000** by default.

### Deploy on Replit

1. Go to the Deployments tab in your Replit project
2. Configure deployment settings:
   - Build command: `npm run build`
   - Run command: `npm run start`
3. Click "Deploy" to publish your application
4. Your app will be available at your Replit deployment URL

### Deploy on VPS/Server

1. Clone the repository on your server
2. Install Node.js 18+
3. Set up PostgreSQL database
4. Configure environment variables
5. Build and start:
```bash
npm install
npm run build
npm run start
```

6. (Optional) Set up a reverse proxy (Nginx/Caddy) to point to port 5000
7. (Optional) Use PM2 for process management:
```bash
npm install -g pm2
pm2 start npm --name "yahoo-boyz" -- start
```

## Database Schema

Main tables:
- `users` - User accounts with roles and verification status
- `contributions` - Daily contribution records (Ksh 20/day)
- `savings` - User savings transactions
- `loans` - Loan applications with status tracking (15% interest rate)
- `loan_repayments` - Loan payment records
- `otp_codes` - OTP verification codes
- `contact_messages` - User support messages

## API Endpoints

All endpoints return JSON. Protected routes require `Authorization: Bearer <token>` header.

### Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/auth/signup` | Register new user. First user becomes superadmin. | No |
| `POST` | `/api/auth/login` | Login with phone/email and password | No |
| `POST` | `/api/auth/verify` | Verify OTP code for registration/login | No |
| `POST` | `/api/auth/resend-code` | Resend OTP to user's phone/email | No |
| `POST` | `/api/auth/forgot-password` | Request password reset OTP | No |
| `POST` | `/api/auth/reset-password` | Reset password with OTP | No |

**Register Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "0712345678",
  "password": "SecurePass123!"
}
```

**Login Request:**
```json
{
  "identifier": "0712345678",
  "password": "SecurePass123!"
}
```

### User Profile

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/user/me` | Get current user profile with financial totals | Yes |
| `PATCH` | `/api/user/profile` | Update profile (name, email, phone, profile picture) | Yes |
| `PATCH` | `/api/user/password` | Change password | Yes |

### Contributions (Daily Ksh 20)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/contributions` | Get user's contribution history | Yes |
| `POST` | `/api/contributions` | Initiate M-Pesa contribution (Ksh 20). Limited to once per 24 hours. | Yes |
| `POST` | `/api/contributions/callback` | M-Pesa payment callback (internal) | No |

**Contribution Response includes:**
- `nextContributionTime`: ISO timestamp when user can contribute again (strict 24-hour limit)
- `canContribute`: Boolean flag - true if 24 hours have passed since last contribution
- `daysCovered`: Number of days fully paid
- `daysBehind`: Number of missed days (no "days ahead" concept - contributions are strictly daily)
- `missedAmount`: Amount owed for missed days (daysBehind × 20)

**24-Hour Contribution Limit:**
- Users can only contribute once every 24 hours (strictly enforced by backend)
- Attempting to contribute before 24 hours returns error: "You can only contribute once every 24 hours"
- Frontend shows countdown timer when contribution is not available

### Savings

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/savings` | Get savings transaction history | Yes |
| `POST` | `/api/savings/deposit` | Initiate M-Pesa savings deposit | Yes |
| `POST` | `/api/savings/withdraw` | Request savings withdrawal (requires active loan status) | Yes |

**Deposit Request:**
```json
{
  "amount": 500
}
```

### Loans (15% Interest Rate)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/loans` | Get user's loan applications | Yes |
| `POST` | `/api/loans` | Apply for loan with guarantors | Yes |
| `GET` | `/api/loans/:id` | Get specific loan details | Yes |
| `POST` | `/api/loans/:id/repay` | Make loan repayment via M-Pesa | Yes |
| `GET` | `/api/loans/available-guarantors` | List eligible guarantors (users with savings) | Yes |

**Loan Application Request:**
```json
{
  "amount": 1000,
  "purpose": "Business investment",
  "guarantorIds": [2, 5]
}
```

**Loan Requirements:**
- Minimum 2 guarantors required
- Each guarantor must have sufficient savings to cover their guarantee portion
- Maximum loan amount: 3x user's total contributions
- Interest rate: 15% flat
- Repayment period: 30 days

### Loan Guarantors

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/guarantor/requests` | Get pending guarantor requests for current user | Yes |
| `POST` | `/api/guarantor/respond` | Accept or reject guarantor request | Yes |

**Respond to Guarantor Request:**
```json
{
  "loanGuarantorId": 123,
  "action": "approve"
}
```

### Contact Messages

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/contact/messages` | Get user's sent messages with replies | Yes |
| `POST` | `/api/contact/messages` | Send message to admin | Yes |

**Send Message Request:**
```json
{
  "subject": "Help with contribution",
  "message": "I need assistance with my daily contribution..."
}
```

### Admin Routes (Admin/Superadmin Only)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/admin/stats` | Platform statistics (members, totals, pending items) | Admin |
| `GET` | `/api/admin/users` | List all users with contribution tracking | Admin |
| `PATCH` | `/api/admin/users/:id` | Update user details (name, email, phone, totals) | Admin |
| `PATCH` | `/api/admin/users/:id/role` | Change user role (user/admin) | Superadmin |
| `DELETE` | `/api/admin/users/:id` | Delete user account | Superadmin |
| `GET` | `/api/admin/loans` | List all loans with guarantor details | Admin |
| `GET` | `/api/admin/loans/pending` | List pending loan applications | Admin |
| `PATCH` | `/api/admin/loans/:id` | Approve/reject loan application | Admin |
| `GET` | `/api/admin/contact/messages` | List all contact messages | Admin |
| `POST` | `/api/admin/contact/messages/:id/reply` | Reply to contact message | Admin |

**Update User (Admin):**
```json
{
  "name": "Updated Name",
  "email": "newemail@example.com",
  "phone": "0722222222",
  "totalContributions": "500",
  "totalSavings": "1000",
  "totalLoans": "0",
  "isVerified": true,
  "isDisabled": false
}
```

**Approve Loan (Admin):**
```json
{
  "status": "approved"
}
```

### Superadmin Permissions

- Superadmins can edit their own profile (name, email, phone, financial totals) but cannot change their role
- Superadmins cannot be modified or deleted by other admins
- Only superadmins can disable users or change user roles
- First registered user automatically becomes superadmin

### Error Responses

All error responses follow this format:
```json
{
  "message": "Error description here"
}
```

Common HTTP status codes:
- `400` - Bad Request (validation error, invalid data)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `429` - Too Many Requests (rate limited, e.g., daily contribution limit)

## Security Features

- JWT-based authentication with secure token handling
- Strong password requirements (8+ chars, uppercase, lowercase, number, special character)
- OTP verification via both SMS and Email
- Role-based access control
- Protected admin routes
- Auto-logout on token expiration
- Disabled user access prevention

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## Support

For M-Pesa integration and bulk SMS solutions, contact: [https://api.giftedtech.co.ke/contact](https://api.giftedtech.co.ke/contact)

For issues or questions, use the Contact page in the application or open a GitHub issue.

## License

MIT License - see LICENSE file for details