# Sanvi Machinery Operations Guide

## Introduction

This operations guide provides comprehensive documentation for managing the Sanvi Machinery application in production. It covers standard operating procedures, maintenance tasks, troubleshooting guidelines, and best practices for ensuring system reliability and performance.

## System Architecture

### Component Overview

The Sanvi Machinery system follows a modern microservices architecture:

- **Frontend**: Next.js 14 application with TypeScript
- **Backend API**: NestJS application with TypeScript
- **Database**: PostgreSQL for persistent storage
- **Cache**: Redis for session management and caching
- **Authentication**: JWT-based authentication system
- **Storage**: S3 for file storage and backups
- **Infrastructure**: AWS cloud infrastructure (ECS, RDS, Elasticache)

### Infrastructure Layout

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    Frontend     │     │     Backend     │     │    Database     │
│    (ECS/EC2)    │────▶│    (ECS/EC2)    │────▶│      (RDS)      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                      │                       │
         │                      │                       │
         ▼                      ▼                       ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Monitoring    │     │     Cache       │     │   File Storage  │
│  (Prometheus)   │     │    (Redis)      │     │      (S3)       │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Network Architecture

- **VPC**: Isolated network environment with public and private subnets
- **Load Balancer**: Application Load Balancer for traffic distribution
- **Security Groups**: Firewall rules limiting access between components
- **NAT Gateway**: Allows private subnets to access internet for updates

## Regular Maintenance Tasks

### Daily Tasks

| Task | Description | Responsible | Time |
|------|-------------|------------|------|
| System Health Check | Verify all components are functioning properly | DevOps | 9:00 AM |
| Log Review | Check for critical errors or unusual patterns | DevOps | 9:30 AM |
| Backup Verification | Ensure nightly backups completed successfully | DevOps | 10:00 AM |

### Weekly Tasks

| Task | Description | Responsible | Day |
|------|-------------|------------|------|
| Security Patch Review | Review available security patches | Security | Monday |
| Performance Analysis | Review system performance metrics | DevOps | Tuesday |
| Database Maintenance | Run VACUUM ANALYZE on PostgreSQL | DBA | Wednesday |
| Disk Space Check | Verify sufficient disk space on all systems | DevOps | Thursday |
| Backup Testing | Test restore of a sample backup | DevOps | Friday |

### Monthly Tasks

| Task | Description | Responsible | Week |
|------|-------------|------------|------|
| DR Testing | Test disaster recovery procedures | DevOps & DBA | 1st |
| Security Scan | Run comprehensive security scan | Security | 2nd |
| Capacity Planning | Review and plan for capacity needs | DevOps & Product | 3rd |
| Dependency Updates | Update non-critical dependencies | Development | 4th |

### Quarterly Tasks

| Task | Description | Responsible |
|------|-------------|------------|
| Penetration Testing | Conduct security penetration testing | Security |
| Architecture Review | Review and optimize system architecture | Architecture Team |
| Cost Optimization | Review and optimize cloud resource costs | Finance & DevOps |
| Compliance Audit | Review system for regulatory compliance | Legal & Security |

## Deployment Windows

| Environment | Regular Window | Emergency Window | Approval |
|------------|----------------|-----------------|----------|
| Development | Anytime | Anytime | Tech Lead |
| Staging | Mon-Thu 10:00-16:00 | Anytime | Tech Lead |
| Production | Tue & Thu 22:00-02:00 | With approval | Product Owner & CTO |

## Service Level Objectives (SLOs)

| Metric | Target | Measurement |
|--------|--------|-------------|
| Availability | 99.9% | Uptime monitoring |
| Response Time | < 300ms (p95) | Application metrics |
| Error Rate | < 0.1% | Application metrics |
| Recovery Time | < 1 hour | Incident metrics |

## On-Call Rotation

The on-call schedule rotates weekly among the DevOps and Development teams:

1. Primary on-call engineer is responsible for initial response to all alerts
2. Secondary on-call engineer provides backup if primary is unavailable
3. Escalation path: On-Call → Team Lead → CTO

### Escalation Criteria

| Severity | Description | Response Time | Escalate After |
|----------|-------------|--------------|----------------|
| Critical | Service down or data integrity issue | 15 minutes | 30 minutes |
| High | Major feature unavailable | 30 minutes | 2 hours |
| Medium | Non-critical feature unavailable | 4 hours | 8 hours |
| Low | Cosmetic or minor issue | 24 hours | 48 hours |

## Monitoring and Alerting

### Key Metrics

1. **Infrastructure Metrics**
   - CPU, Memory, Disk utilization
   - Network throughput and errors
   - System load and process counts

2. **Application Metrics**
   - Request rate and latency
   - Error rate by endpoint
   - Active users and sessions
   - Business transaction rates

3. **Database Metrics**
   - Query performance
   - Connection pool utilization
   - Table sizes and growth rates
   - Index efficiency

### Alert Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| CPU | > 70% for 15m | > 90% for 5m |
| Memory | > 80% for 15m | > 90% for 5m |
| Disk | > 80% used | > 90% used |
| Error Rate | > 1% for 5m | > 5% for 1m |
| Latency | p95 > 500ms | p95 > 1s |
| DB Connections | > 80% of max | > 90% of max |

## Capacity Management

### Scaling Guidelines

1. **Frontend Scaling**
   - Scale up when CPU > 70% for 10 minutes
   - Scale up when response time p95 > 400ms
   - Min instances: 2, Max instances: 10

2. **Backend Scaling**
   - Scale up when CPU > 70% for 10 minutes
   - Scale up when request queue > 100 for 5 minutes
   - Min instances: 2, Max instances: 10

3. **Database Scaling**
   - Vertical scaling when CPU > 70% sustained
   - Consider read replicas when read/write ratio > 4:1
   - Monitor connection counts and query performance

### Resource Planning

1. **Short-term Planning** (1-3 months)
   - Weekly review of utilization trends
   - Adjust auto-scaling parameters as needed
   - Plan for known traffic events (e.g., marketing campaigns)

2. **Long-term Planning** (6-12 months)
   - Quarterly architecture review
   - Capacity planning based on business growth projections
   - Technology refresh cycles

## Security Management

### Access Control

1. **Principle of Least Privilege**
   - Each role has minimum permissions needed
   - Regular access reviews (quarterly)
   - Automated access provisioning/de-provisioning

2. **Authentication**
   - Multi-factor authentication for all admin access
   - Regular credential rotation (90 days)
   - Session timeout after 12 hours of inactivity

3. **Authorization**
   - Role-based access control (RBAC)
   - Attribute-based access control for sensitive data
   - Regular entitlement reviews

### Data Protection

1. **Data Classification**
   - Public: Can be freely shared
   - Internal: For company use only
   - Confidential: Limited access, business impact if disclosed
   - Restricted: Highly sensitive, regulatory or compliance impact

2. **Encryption Requirements**
   - Data in transit: TLS 1.2+ with strong ciphers
   - Data at rest: AES-256 encryption
   - Database: Transparent data encryption
   - Backup encryption with separate key management

## Backup and Recovery

### Backup Schedule

| Data | Frequency | Retention | Storage |
|------|-----------|-----------|---------|
| Database | Daily full, hourly incremental | 30 days | S3 + Glacier |
| File Storage | Daily | 30 days | S3 + Glacier |
| Configuration | After changes | 90 days | S3 + Version Control |
| System Images | Weekly | 30 days | AMI Storage |

### Recovery Testing

1. Database recovery testing monthly
2. Full system recovery testing quarterly
3. DR site activation testing semi-annually
4. Document recovery time for each test

## Change Management

### Change Types

1. **Standard Change**
   - Pre-approved, well-documented changes
   - Follows established procedure
   - Minimal risk, routine operations

2. **Normal Change**
   - Requires approval
   - Follows standard change process
   - Moderate risk or impact

3. **Emergency Change**
   - Abbreviated process for urgent fixes
   - Post-implementation review required
   - High risk or impact, time-sensitive

### Change Process

1. **Request** - Document change details and purpose
2. **Assess** - Evaluate impact, risk, and resources required
3. **Approve** - Obtain necessary approvals based on risk
4. **Schedule** - Plan implementation within change window
5. **Implement** - Execute change with rollback plan ready
6. **Verify** - Confirm change was successful
7. **Document** - Update documentation and close change record

## Incident Management

### Incident Response Process

1. **Detect** - Identify incident through monitoring or reports
2. **Respond** - Acknowledge and begin investigation
3. **Mitigate** - Apply temporary fixes to restore service
4. **Resolve** - Implement permanent solution
5. **Review** - Conduct post-mortem analysis
6. **Improve** - Implement preventive measures

### Incident Severity Levels

| Level | Description | Example | Communication |
|-------|-------------|---------|---------------|
| P1 | Critical business impact | Service down | Every 30 min |
| P2 | Significant impact | Major feature unavailable | Every 2 hours |
| P3 | Moderate impact | Performance degraded | Daily |
| P4 | Minor impact | Cosmetic issue | Weekly summary |

### Communication Templates

1. **Initial Notification**
   ```
   [INCIDENT] #ID - Severity: P# - Service: X
   Issue: Brief description of the issue
   Impact: Systems/users affected
   Status: Investigation in progress
   Next update: HH:MM
   ```

2. **Update**
   ```
   [UPDATE] #ID - Severity: P# - Service: X
   Status: Current status of investigation/resolution
   Actions: Steps taken since last update
   Impact: Any changes to impact assessment
   Next update: HH:MM
   ```

3. **Resolution**
   ```
   [RESOLVED] #ID - Severity: P# - Service: X
   Resolution: How the issue was resolved
   Root cause: Preliminary root cause
   Impact: Final impact assessment
   Follow-up: Post-mortem scheduled for DD/MM/YYYY
   ```

## Compliance and Auditing

### Audit Requirements

1. **System Access**
   - User provisioning/de-provisioning
   - Privilege changes
   - Authentication attempts
   - Retention: 1 year

2. **Data Access**
   - Customer data access
   - Financial data access
   - Export/import operations
   - Retention: 3 years

3. **Changes**
   - System configuration changes
   - Database schema changes
   - Production deployments
   - Retention: 3 years

### Compliance Reviews

1. Quarterly internal compliance reviews
2. Annual external security assessment
3. Bi-annual disaster recovery plan testing
4. Annual business continuity testing

## Vendor Management

### Critical Vendors

1. **Cloud Provider** (AWS)
   - SLA: 99.95% uptime
   - Support: Enterprise-level
   - Contact: Account Manager + Technical Account Manager

2. **Authentication Provider**
   - SLA: 99.9% uptime
   - Support: 24/7 with 1-hour response time
   - Contact: Technical Support Manager

### Vendor Assessment

1. Annual security assessment of critical vendors
2. Quarterly review of SLA performance
3. Annual contract and pricing review

## Appendices

### A. Contact Information

| Role | Name | Email | Phone | Escalation Order |
|------|------|-------|-------|------------------|
| DevOps Lead | [Name] | devops-lead@sanvi.com | +1-555-0100 | 1 |
| Backend Lead | [Name] | backend-lead@sanvi.com | +1-555-0101 | 2 |
| Frontend Lead | [Name] | frontend-lead@sanvi.com | +1-555-0102 | 3 |
| CTO | [Name] | cto@sanvi.com | +1-555-0103 | 4 |

### B. Environment Information

| Environment | Purpose | Access URL | Access Method |
|-------------|---------|------------|--------------|
| Production | Customer-facing system | https://app.sanvi-machinery.com | VPN + SSO |
| Staging | Pre-production testing | https://staging.sanvi-machinery.com | VPN + SSO |
| Development | Development and testing | https://dev.sanvi-machinery.com | VPN + SSO |
| DR Site | Disaster recovery | https://dr.sanvi-machinery.com | VPN + Emergency Access |

### C. Reference Documents

1. [AWS Best Practices](https://aws.amazon.com/architecture/well-architected/)
2. [NestJS Documentation](https://docs.nestjs.com/)
3. [Next.js Documentation](https://nextjs.org/docs)
4. [PostgreSQL Administration](https://www.postgresql.org/docs/)
5. [OWASP Security Guidelines](https://owasp.org/www-project-web-security-testing-guide/)
