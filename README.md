# GAEL HOMS
### Healthcare Operations Management System

**Healthcare operations, simplified.**

GAEL HOMS is a full-stack healthcare operations management system designed to organize patient records, insurance policies, eligibility verification, claims processing, and prior authorization workflows in one centralized application.

The project demonstrates the development of a role-based healthcare operations platform using modern web technologies, PostgreSQL database design, Supabase authentication, and Row Level Security (RLS).

> **Project type:** Full-stack portfolio project
> **Status:** Development complete — portfolio demonstration
> **Data:** Fictional and dummy records only

---

## Overview

Healthcare operations involve multiple interconnected processes, including patient information management, insurance verification, claims handling, and prior authorization.

GAEL HOMS brings these workflows together through a centralized interface with role-based access controls and database-level business rules.

The application was designed to demonstrate how healthcare operations concepts can be translated into a structured, secure, and maintainable software solution.

## Core Features

### Dashboard
- Overview of patient records and operational activities.
- Claims and authorization status summaries.
- Eligibility and operational metrics.
- Recent activity monitoring.

### Patient Management
- Create, view, update, and archive patient records.
- Search and manage patient information.
- Automatically generated patient identification numbers.
- Patient activity history.

### Insurance Management
- Maintain patient insurance policies.
- Track insurance providers and policy information.
- Manage effective and expiration dates.
- Monitor policy status.

### Eligibility Verification
- Create insurance eligibility checks.
- Associate verification records with patients and insurance policies.
- Track verification status and response details.
- Maintain verification history.

### Claims Management
- Create and manage healthcare claims.
- Track claim amounts, service dates, and submission dates.
- Monitor claim processing statuses.
- Record decision dates and rejection reasons.
- Enforce valid claim status transitions at the database level.

### Prior Authorization
- Create and manage authorization requests.
- Associate requests with patients and insurance policies.
- Track requested services and authorization decisions.
- Record denial reasons and decision dates.
- Enforce authorization workflow rules at the database level.

### Activity Logs
- Automatically record important operational activities.
- Track record creation, updates, and status changes.
- Maintain an activity history associated with user accounts.

### Reports and Analytics
- Summarize operational data.
- Display claims, eligibility, and authorization breakdowns.
- Present financial and activity-related metrics.

---

## User Roles and Permissions

GAEL HOMS implements role-based access control using Supabase authentication, user profiles, application-level authorization checks, and PostgreSQL Row Level Security.

| Feature | Admin | Healthcare Staff | Claims Staff | Authorization Staff |
|---|---|---|---|---|
| View patients | ✓ | ✓ | ✓ | ✓ |
| Create/update patients | ✓ | ✓ | — | — |
| View insurance policies | ✓ | ✓ | ✓ | ✓ |
| Create/update insurance policies | ✓ | ✓ | — | — |
| View eligibility checks | ✓ | ✓ | ✓ | ✓ |
| Create eligibility checks | ✓ | ✓ | — | — |
| View claims | ✓ | ✓ | ✓ | ✓ |
| Create/update claims | ✓ | ✓ | ✓ | — |
| View authorizations | ✓ | ✓ | ✓ | ✓ |
| Create/update authorizations | ✓ | ✓ | — | ✓ |
| View activity logs | ✓ | ✓ | ✓ | ✓ |

New user profiles receive the `healthcare_staff` role by default.

*Permissions reflect the inspected database RLS policies. Application-level route and action checks may impose additional restrictions.*

---

## Technology Stack

| Category | Technology |
|---|---|
| Framework | Next.js 16 |
| Language | TypeScript |
| UI Library | React 19 |
| Styling | Tailwind CSS 4 |
| Icons | Lucide React |
| Backend / Database | Supabase |
| Database | PostgreSQL |
| Authentication | Supabase Auth |
| OAuth | Google OAuth |
| Database Security | PostgreSQL Row Level Security |
| Deployment | Vercel |
| Version Control | Git and GitHub |

---

## System Architecture

GAEL HOMS uses a full-stack architecture built around Next.js and Supabase.

**Frontend**
- Next.js App Router
- React components
- TypeScript
- Tailwind CSS

**Application Layer**
- Server Components and Client Components
- Server-side data access
- Form handling and server actions
- Authentication and role-based authorization
- Protected routes through the Next.js proxy

**Backend and Database**
- Supabase Auth for user authentication
- PostgreSQL for relational data storage
- Row Level Security for database access control
- PostgreSQL functions and triggers for workflow enforcement and activity logging

### Authentication Flow

1. Users register using email/password or Google OAuth.
2. Supabase Auth creates the authenticated user.
3. A database trigger executes `handle_new_user()`.
4. The function automatically creates a corresponding profile.
5. The profile receives the default `healthcare_staff` role.
6. Protected application routes and database policies validate authenticated access.

---

## Database Design

The application uses seven primary tables in the PostgreSQL `public` schema.

| Table | Responsibility |
|---|---|
| `profiles` | User information and assigned roles |
| `patients` | Patient records |
| `insurance_policies` | Insurance policy information |
| `eligibility_checks` | Insurance eligibility verification records |
| `claims` | Healthcare claims and processing information |
| `authorizations` | Prior authorization requests and decisions |
| `activity_logs` | Operational activity history |

### Database Relationships

- A patient can have multiple insurance policies.
- Insurance policies belong to individual patients.
- Eligibility checks reference both a patient and an insurance policy.
- Claims reference both a patient and an insurance policy.
- Authorizations reference both a patient and an insurance policy.
- User profiles are linked to Supabase Auth users.
- Activity logs reference the associated user profile.

### Database-Level Business Logic

GAEL HOMS uses PostgreSQL functions and triggers to enforce important business rules independently of the frontend.

**Automatic Number Generation**

- Patient numbers: `PT-YYYY-00001`
- Claim numbers: `CLM-YYYY-00001`
- Authorization numbers: `AUTH-YYYY-00001`

**Workflow Enforcement**

Claims and authorizations follow controlled status transitions:

`Draft → Submitted → Pending → Approved / Denied`

The database validates required dates, denial reasons, protected original record information, and finalized record restrictions.

**Referential Integrity**

Composite foreign keys ensure that claims, eligibility checks, and authorization requests reference an insurance policy belonging to the selected patient.

**Activity Logging**

Database triggers automatically record important create and update operations, including status changes and patient archival.

**Automatic Timestamps**

Database triggers maintain `updated_at` values when supported records are modified.

---

## Security Implementation

Security is implemented at both the application and database levels.

- Supabase Auth manages user authentication.
- Google OAuth provides an alternative sign-in method.
- User profiles store application roles.
- Protected routes redirect unauthenticated users.
- Application-level checks restrict access to authorized operations.
- PostgreSQL Row Level Security is enabled on all seven public tables.
- RLS policies validate authenticated users and their assigned roles.
- Creation policies validate the associated user ID for claims, authorizations, and eligibility checks.
- Foreign-key constraints maintain relational integrity.
- Database functions enforce claim and authorization workflow rules.

**Security note:** This project demonstrates application-level and database-level security practices. It has not undergone an independent security audit and is not represented as a production-certified healthcare system.

---

## Getting Started

### Prerequisites

- Node.js
- npm
- Git
- A Supabase project
- A Google Cloud OAuth application if Google sign-in is enabled

### 1. Clone the Repository

```bash
git clone https://github.com/gaelcaldeo/health-operation-management-system.git

cd health-operation-management-system
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env.local` file in the project root.

Use `.env.example` as your reference:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

Replace the placeholders with the corresponding values from your Supabase project.

Never commit `.env.local` or expose private credentials.

### 4. Configure Supabase

Create and configure a Supabase project with:

- The seven application tables.
- Required foreign keys and database constraints.
- Row Level Security policies.
- Database functions and triggers.
- Authentication providers.

Google OAuth also requires the appropriate provider credentials and redirect URL configuration in Supabase and Google Cloud.

**Note:** The repository currently documents the deployed database design. A reproducible database migration or SQL setup script should be added separately if you want other developers to recreate the schema from scratch.

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Production Build

```bash
npm run build
```

### 7. Run Linting

```bash
npm run lint
```

---

## Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key |

The `.env.example` file contains placeholder values for local configuration.

---

## Project Structure

```text
healthcare-operations-system/
├── src/
│   ├── app/
│   │   ├── activity/
│   │   ├── authorizations/
│   │   ├── claims/
│   │   ├── eligibility/
│   │   ├── insurance/
│   │   ├── login/
│   │   ├── logout/
│   │   ├── patients/
│   │   ├── reports/
│   │   ├── signup/
│   │   ├── auth/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   ├── lib/
│   └── proxy.ts
├── public/
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## Deployment

The application is designed for deployment on Vercel.

Deployment overview:

1. Import the GitHub repository into Vercel.
2. Configure the required Supabase environment variables.
3. Configure Supabase authentication redirect URLs for the deployed domain.
4. Deploy the application.
5. Verify authentication, role permissions, database access, and application workflows.

---

## Limitations and Future Improvements

Potential future enhancements include:

- Reproducible SQL migrations and database setup scripts.
- Automated unit and integration tests.
- Expanded reporting and analytics.
- More comprehensive audit logging.
- Additional validation and security testing.
- Improved operational notifications.
- Production-grade monitoring and error reporting.

---

## Disclaimer

GAEL HOMS is an independent portfolio project created for educational and demonstration purposes.

All patient and operational information used in demonstrations should be fictional or dummy data.

This application is not intended for actual clinical use, real patient data processing, or production healthcare operations. It is not HIPAA-certified or independently security-audited.

---

## Author

**GAEL HOMS**
Full-stack Healthcare Operations Management System

Built to demonstrate the intersection of healthcare operations knowledge, full-stack development, relational database design, and application security.

**Repository:** [GitHub – GAEL HOMS](https://github.com/gaelcaldeo/health-operation-management-system)