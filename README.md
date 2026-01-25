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

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/verify-otp` - Verify OTP code
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### User
- `GET /api/user/me` - Get current user profile
- `PUT /api/user/profile` - Update profile
- `PUT /api/user/password` - Change password

### Contributions & Savings
- `GET /api/contributions` - Get user contributions
- `POST /api/contributions` - Make contribution
- `GET /api/savings` - Get user savings
- `POST /api/savings/deposit` - Make deposit
- `POST /api/savings/withdraw` - Request withdrawal

### Loans
- `GET /api/loans` - Get user loans
- `POST /api/loans` - Apply for loan
- `GET /api/loans/:id` - Get loan details

### Admin
- `GET /api/admin/users` - List all users
- `PUT /api/admin/users/:id` - Update user
- `GET /api/admin/loans` - List all loans
- `PUT /api/admin/loans/:id` - Update loan status

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