# Sanvi Machinery API Security Documentation

This document outlines the comprehensive security hardening and compliance features implemented in the Sanvi Machinery API.

## Table of Contents
1. [Input Validation and Sanitization](#input-validation-and-sanitization)
2. [API Security Measures](#api-security-measures)
   - [HTTP Security Headers](#http-security-headers)
   - [Rate Limiting](#rate-limiting)
   - [CORS Protection](#cors-protection)
   - [CSRF Protection](#csrf-protection)
3. [Data Encryption](#data-encryption)
4. [Audit Logging](#audit-logging)
5. [Security Monitoring](#security-monitoring)
6. [GDPR Compliance](#gdpr-compliance)
7. [Backup and Recovery](#backup-and-recovery)
8. [Security Configuration](#security-configuration)
9. [Security Best Practices](#security-best-practices)

## Input Validation and Sanitization

The API implements comprehensive input validation and sanitization using a global validation pipe:

- **Class-Validator Integration**: Uses `class-validator` decorators for schema validation
- **XSS Protection**: Sanitizes all string inputs using `sanitize-html` to remove dangerous HTML/JavaScript
- **Recursive Sanitization**: Handles nested objects and arrays
- **Strong Type Checking**: Validates data types and constraints

Implementation: `src/common/pipes/validation.pipe.ts`

## API Security Measures

### HTTP Security Headers

The API implements secure HTTP headers via `SecurityMiddleware`:

- **Strict Content-Security-Policy (CSP)**: Restricts sources of executable scripts
- **X-Content-Type-Options**: Prevents MIME-sniffing
- **X-Frame-Options**: Prevents clickjacking
- **X-XSS-Protection**: Additional browser XSS filter
- **Referrer-Policy**: Controls information sent in the Referer header
- **Permissions-Policy**: Restricts API access to browser features

Implementation: `src/common/middleware/security.middleware.ts`

### Rate Limiting

Rate limiting protects against brute force attacks and DoS attempts:

- **IP-based Rate Limiting**: Tracks requests per IP address
- **Configurable Windows**: Adjustable time windows for rate counting
- **Customizable Limits**: Different limits for different endpoints
- **Automatic Blocking**: Option to auto-block IPs that exceed thresholds

Implementation: `src/common/middleware/rate-limit.middleware.ts`

### CORS Protection

Cross-Origin Resource Sharing (CORS) protection:

- **Configurable Allowed Origins**: Whitelist of allowed domains
- **Credentials Handling**: Control for allowing credentials
- **Methods and Headers**: Configurable allowed methods and headers
- **Preflight Handling**: Proper OPTIONS request handling

Implementation: `src/common/middleware/cors.middleware.ts`

### CSRF Protection

Cross-Site Request Forgery (CSRF) protection:

- **Token-based Protection**: HMAC-based tokens with expiration
- **Automatic Token Generation**: Tokens created on safe methods (GET)
- **Token Validation**: Required for unsafe methods (POST/PUT/DELETE)
- **Same-Site Cookies**: Secure cookie settings
- **Path Exemptions**: Configurable paths exempt from CSRF checks

Implementation: `src/common/middleware/csrf.middleware.ts`

## Data Encryption

The API implements robust encryption for sensitive data:

- **AES-256-GCM Encryption**: Strong authenticated encryption
- **Secure Key Management**: Environment-based key configuration
- **PBKDF2 Hashing**: Secure password hashing with salt
- **Encrypted Data Storage**: Protection for PII and sensitive data

Implementation: `src/common/services/encryption.service.ts`

## Audit Logging

Comprehensive audit logging captures all security-relevant events:

- **Multi-level Logging**: Different log levels (INFO, WARNING, ERROR, SECURITY)
- **User Activity Tracking**: All user actions are recorded
- **Sensitive Action Logging**: Special handling for security-critical operations
- **Database Storage**: Persistent storage of audit logs
- **Log Filtering**: Retrieval by date, user, action, or resource

Implementation: `src/common/services/audit-logger.service.ts`

## Security Monitoring

Real-time security monitoring with intrusion detection:

- **Event-based Detection**: Listens to security-relevant events
- **Pattern Recognition**: Identifies suspicious patterns
- **Alert Generation**: Creates security alerts with severity levels
- **Automatic Response**: Can automatically block suspicious IPs
- **Alert Management**: Workflow for handling and resolving alerts

Implementation: `src/common/services/security-monitor.service.ts`

## GDPR Compliance

GDPR compliance features support data protection requirements:

- **Data Subject Requests**: Handling for access, deletion, and correction requests
- **Data Minimization**: Only necessary data is collected and stored
- **Consent Management**: Tracking user consent for data processing
- **Data Portability**: Export of user data in portable formats
- **Compliance Reporting**: Generation of GDPR compliance reports
- **Data Retention**: Enforcement of retention policies

Implementation: `src/common/services/gdpr-compliance.service.ts`

## Backup and Recovery

Robust backup and recovery procedures:

- **Scheduled Backups**: Automatic backups on configurable schedule
- **Multiple Backup Types**: Database, files, configuration
- **Secure Storage**: Compression and optional encryption
- **Cloud Integration**: Optional S3 storage
- **Disaster Recovery**: Clear recovery procedures
- **Backup Rotation**: Automated cleanup of old backups

Implementation: `src/common/services/backup-recovery.service.ts`

## Security Configuration

Security features are configurable via environment variables:

```
# Encryption
ENCRYPTION_SECRET_KEY=<32-byte-key-in-hex>

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CSRF Protection
CSRF_SECRET=<secret-key>
CSRF_TOKEN_EXPIRY=3600

# CORS Configuration
CORS_ALLOWED_ORIGINS=https://app.example.com,https://admin.example.com
CORS_ALLOW_CREDENTIALS=true

# Audit Logging
AUDIT_CONSOLE_OUTPUT=true
AUDIT_DB_STORAGE=true

# Security Monitoring
SECURITY_MONITORING_ENABLED=true
SECURITY_AUTO_BLOCK_ENABLED=true
SECURITY_ALERT_NOTIFICATIONS=true

# Backup Configuration
BACKUP_ENABLED=true
BACKUP_SCHEDULE=0 0 * * *
BACKUP_RETENTION_DAYS=30
BACKUP_STORAGE_LOCATION=./backups
BACKUP_COMPRESS=true
BACKUP_S3_BUCKET=
BACKUP_TYPES=database,files,configs
```

## Security Best Practices

The following best practices are implemented throughout the API:

1. **Defense in Depth**: Multiple security layers
2. **Least Privilege**: Minimal access rights
3. **Secure Defaults**: Secure configuration by default
4. **Input Validation**: All inputs validated and sanitized
5. **Secure Communications**: TLS for all connections
6. **Audit Logging**: Comprehensive audit trail
7. **Regular Testing**: Unit and integration tests for security features
8. **Error Handling**: Secure error messages (no sensitive info)
9. **Dependency Management**: Regular updates of dependencies
10. **Security Monitoring**: Continuous monitoring for threats
