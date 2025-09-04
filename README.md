# IronGrid - Sanvi Machinery B2B Quotation & CRM Platform

## Project Overview
This repository contains the Sanvi Machinery B2B Quotation & CRM Platform, a comprehensive solution for managing business quotations, customer relationships, and machinery orders.

## Repository Structure
```
irongrid/
├── sanvi-backend/         # NestJS backend with Prisma ORM and PostgreSQL
├── sanvi-frontend/        # Next.js 14 frontend with TypeScript
├── .plan/                 # Project planning documentation
├── infrastructure/        # Infrastructure as code and deployment scripts
└── monitoring/            # Monitoring and logging configuration
```

## Current Status
The platform has a strong foundation with core authentication, customer management, and quotation creation features implemented. Next phases include PDF generation, email integration, and order management systems.

## Setup Instructions
### Prerequisites
- Node.js 18+
- PostgreSQL
- Git

### Backend Setup
```bash
cd sanvi-backend
npm install
cp .env.example .env  # Configure your environment variables
npm run start:dev
```

### Frontend Setup
```bash
cd sanvi-frontend
npm install
cp .env.local.example .env.local  # Configure your environment variables
npm run dev
```

## Development Guidelines
- Follow the implementation plan outlined in IMPLEMENTATION_PLAN.md
- Refer to sanvi_complete_roadmap_v2.md for the complete project vision
- Sprint planning details are available in sanvi_development_plan_sprint_v1.md

## License
Proprietary - All Rights Reserved
