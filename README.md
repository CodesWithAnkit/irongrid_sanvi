# IronGrid - Sanvi Machinery B2B Quotation & CRM Platform

## Project Overview
This repository contains the Sanvi Machinery B2B Quotation & CRM Platform, a comprehensive solution for managing business quotations, customer relationships, and machinery orders.

## Repository Structure

### Project Repositories
This project is split into multiple repositories for better code organization and management:

- **Main Repository (Planning & Documentation)**: [CodesWithAnkit/irongrid_sanvi](https://github.com/CodesWithAnkit/irongrid_sanvi)
- **Backend Repository**: [CodesWithAnkit/irongrid_backend](https://github.com/CodesWithAnkit/irongrid_backend)
- **Frontend Repository**: [CodesWithAnkit/irongrid_frontend](https://github.com/CodesWithAnkit/irongrid_frontend)

### Main Repository Structure
```
irongrid_sanvi/
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

### Clone Repositories
```bash
# Clone backend repository
git clone https://github.com/CodesWithAnkit/irongrid_backend.git

# Clone frontend repository
git clone https://github.com/CodesWithAnkit/irongrid_frontend.git
```

### Backend Setup
```bash
cd irongrid_backend
npm install
cp .env.example .env  # Configure your environment variables
npm run start:dev
```

### Frontend Setup
```bash
cd irongrid_frontend
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
