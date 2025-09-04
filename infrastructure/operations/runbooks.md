# Sanvi Machinery - Operational Runbooks

## Table of Contents

1. [System Overview](#system-overview)
2. [Common Operational Tasks](#common-operational-tasks)
3. [Incident Response](#incident-response)
4. [Deployment Procedures](#deployment-procedures)
5. [Backup and Disaster Recovery](#backup-and-disaster-recovery)
6. [Monitoring and Alerting](#monitoring-and-alerting)
7. [Security Procedures](#security-procedures)

## System Overview

The Sanvi Machinery system consists of the following key components:

- **Frontend**: Next.js application deployed to AWS infrastructure
- **Backend**: NestJS REST API with PostgreSQL database
- **Infrastructure**: AWS-based cloud infrastructure managed via Terraform
- **CI/CD**: GitHub Actions for automated testing, building, and deployment
- **Monitoring**: Prometheus, Grafana, and Alertmanager for metrics and alerting
- **Logging**: Loki and Promtail for centralized logging

## Common Operational Tasks

### System Startup

1. **Start Database**:
   ```bash
   systemctl start postgresql
   ```

2. **Start Backend**:
   ```bash
   cd /opt/sanvi/backend
   npm run start:prod
   ```

3. **Start Frontend**:
   ```bash
   cd /opt/sanvi/frontend
   npm run start
   ```

### System Shutdown

1. **Stop Frontend**:
   ```bash
   cd /opt/sanvi/frontend
   pm2 stop sanvi-frontend
   ```

2. **Stop Backend**:
   ```bash
   cd /opt/sanvi/backend
   pm2 stop sanvi-backend
   ```

3. **Stop Database** (if necessary):
   ```bash
   systemctl stop postgresql
   ```

### Health Checks

1. **Database Health**:
   ```bash
   PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USERNAME -d sanvi -c "SELECT 1"
   ```

2. **Backend Health**:
   ```bash
   curl -f http://localhost:3000/health
   ```

3. **Frontend Health**:
   ```bash
   curl -f http://localhost:3001
   ```

### Logs Access

1. **View Backend Logs**:
   ```bash
   journalctl -u sanvi-backend -f
   ```
   
   Or via Docker:
   ```bash
   docker logs -f sanvi-backend
   ```

2. **View Frontend Logs**:
   ```bash
   journalctl -u sanvi-frontend -f
   ```
   
   Or via Docker:
   ```bash
   docker logs -f sanvi-frontend
   ```

3. **View Centralized Logs in Grafana**:
   - Access Grafana at `http://<grafana-host>:3000`
   - Navigate to the "Explore" section
   - Select "Loki" as the data source
   - Query logs with labels: `{job="sanvi-backend"}` or `{job="sanvi-frontend"}`

## Incident Response

### High Severity Incidents

For P1 incidents (service down, data breach):

1. **Alert**: Incident commander acknowledges alert in PagerDuty/Slack
2. **Assess**: Determine impact and scope
3. **Communicate**: Post initial status in #incidents channel
4. **Mitigate**: Apply immediate fixes to restore service
5. **Resolve**: Implement permanent fix
6. **Review**: Conduct post-mortem within 24 hours

### Database Issues

#### Connection Problems

1. Check database status:
   ```bash
   systemctl status postgresql
   ```

2. Verify network connectivity:
   ```bash
   nc -zv $DB_HOST 5432
   ```

3. Check for connection limits:
   ```bash
   PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USERNAME -d sanvi -c "SELECT count(*) FROM pg_stat_activity"
   ```

4. Restart database if needed:
   ```bash
   systemctl restart postgresql
   ```

#### High Database Load

1. Identify expensive queries:
   ```bash
   PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USERNAME -d sanvi -c "SELECT query, calls, total_time, mean_time FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10"
   ```

2. Check for table bloat:
   ```bash
   PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USERNAME -d sanvi -c "SELECT schemaname, relname, n_dead_tup, n_live_tup FROM pg_stat_user_tables ORDER BY n_dead_tup DESC"
   ```

3. Run vacuum if needed:
   ```bash
   PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USERNAME -d sanvi -c "VACUUM ANALYZE"
   ```

### API Errors

1. Check backend service status:
   ```bash
   systemctl status sanvi-backend
   ```

2. Verify logs for errors:
   ```bash
   journalctl -u sanvi-backend -n 100 --no-pager | grep ERROR
   ```

3. Restart backend if needed:
   ```bash
   systemctl restart sanvi-backend
   ```

4. Verify health endpoint after restart:
   ```bash
   curl -f http://localhost:3000/health
   ```

### Memory Issues

1. Check memory usage:
   ```bash
   free -h
   ```

2. Identify processes consuming memory:
   ```bash
   ps aux --sort=-%mem | head -n 10
   ```

3. Check for memory leaks in Node.js:
   ```bash
   node --inspect <service-file>
   ```
   Then connect using Chrome DevTools for heap analysis

## Deployment Procedures

### Standard Deployment

1. CI/CD pipeline automatically runs when code is merged to main branch
2. GitHub Actions workflow runs tests, builds Docker images, and deploys to the active environment
3. Monitor deployment in GitHub Actions interface

### Manual Deployment

1. Trigger manual deployment through GitHub Actions:
   - Go to GitHub repository
   - Click on "Actions" tab
   - Select "CD" workflow
   - Click "Run workflow"
   - Select branch to deploy and target environment

2. Monitor deployment status in GitHub Actions

### Rollback Procedure

1. Identify the last good deployment in GitHub Actions
2. Trigger rollback via GitHub Actions:
   - Go to GitHub repository
   - Click on "Actions" tab
   - Select "CD" workflow
   - Click "Run workflow"
   - Select "rollback" option and specify the last good deployment tag

3. Verify system functionality after rollback

## Backup and Disaster Recovery

### Running Manual Backup

1. Execute backup script:
   ```bash
   cd /opt/sanvi/infrastructure/backup
   ./backup.sh all
   ```

2. Verify backup success:
   ```bash
   tail -f /var/log/sanvi/backup-*.log
   ```

3. Check backup in S3:
   ```bash
   aws s3 ls s3://sanvi-backups-${ENVIRONMENT}/backups/database/ --recursive | sort | tail -n 5
   ```

### Restore from Backup

1. Execute disaster recovery script:
   ```bash
   cd /opt/sanvi/infrastructure/backup
   ./disaster-recovery.sh test
   ```

2. If test successful, perform actual restore:
   ```bash
   cd /opt/sanvi/infrastructure/backup
   ./disaster-recovery.sh full
   ```

3. Verify system functionality after restore

### Disaster Recovery Testing

1. Schedule monthly DR test:
   ```bash
   cd /opt/sanvi/infrastructure/backup
   ./disaster-recovery.sh test
   ```

2. Document test results and any issues identified
3. Update DR procedures based on test findings

## Monitoring and Alerting

### Key Metrics to Monitor

- **System**: CPU, memory, disk usage, network traffic
- **Application**: Request rate, error rate, latency
- **Database**: Connection count, query performance, table sizes, replication lag
- **Business**: User activity, quotation creation rate, conversion rate

### Alert Response

| Severity | Response Time | Escalation Path |
|----------|--------------|-----------------|
| Critical | 15 minutes   | On-call → Team Lead → CTO |
| Warning  | 4 hours      | On-call → Team |
| Info     | Next business day | Team |

### Adding New Dashboards

1. Access Grafana at `http://<grafana-host>:3000`
2. Navigate to "Create" → "Dashboard"
3. Add panels for relevant metrics
4. Save dashboard with descriptive name
5. Export dashboard JSON and store in version control under `monitoring/grafana/dashboards/`

## Security Procedures

### Security Incident Response

1. Isolate affected systems
2. Preserve evidence
3. Determine scope of breach
4. Contain and eradicate threat
5. Recover systems securely
6. Conduct post-incident review

### Security Scanning

1. Run on-demand security scan:
   ```bash
   cd /opt/sanvi
   ./security-scan.sh
   ```

2. Review scan results in generated report

### Access Management

1. **Add User**:
   ```bash
   cd /opt/sanvi/scripts
   ./add_user.sh <username> <role>
   ```

2. **Revoke Access**:
   ```bash
   cd /opt/sanvi/scripts
   ./revoke_access.sh <username>
   ```

3. **Audit Access**:
   ```bash
   cd /opt/sanvi/scripts
   ./audit_access.sh
   ```

### Certificate Management

1. **Check Certificate Expiry**:
   ```bash
   openssl x509 -enddate -noout -in /etc/ssl/certs/sanvi.crt
   ```

2. **Renew Certificate**:
   ```bash
   certbot renew
   ```

3. **Deploy New Certificate**:
   ```bash
   cd /opt/sanvi/scripts
   ./deploy_certificate.sh
   ```
