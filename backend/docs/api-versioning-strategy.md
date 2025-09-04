# API Versioning Strategy

## Overview

This document outlines the API versioning strategy for the Sanvi Machinery B2B Platform API to ensure backward compatibility and smooth evolution of the API over time.

## Versioning Approach

### 1. URL Path Versioning

We use URL path versioning as the primary versioning strategy:

```
https://api.sanvi-machinery.com/v1/quotations
https://api.sanvi-machinery.com/v2/quotations
```

### 2. Version Format

- **Major Version**: Incremented for breaking changes (v1, v2, v3)
- **Minor Version**: Incremented for backward-compatible additions (documented in headers)
- **Patch Version**: Incremented for bug fixes (not exposed in URL)

### 3. Current Version

- **Current Version**: v1.0.0
- **Supported Versions**: v1.x
- **Deprecated Versions**: None (initial release)

## Backward Compatibility Rules

### Breaking Changes (Major Version Bump)

The following changes require a major version increment:

1. **Removing endpoints or fields**
2. **Changing field types or formats**
3. **Changing HTTP status codes for existing scenarios**
4. **Modifying authentication/authorization requirements**
5. **Changing request/response structure significantly**
6. **Removing or changing query parameters**

### Non-Breaking Changes (Minor Version)

The following changes are considered backward-compatible:

1. **Adding new endpoints**
2. **Adding new optional fields to responses**
3. **Adding new optional query parameters**
4. **Adding new HTTP headers**
5. **Improving error messages**
6. **Performance improvements**

### Patch Changes

1. **Bug fixes that don't change API behavior**
2. **Documentation updates**
3. **Internal code improvements**

## Version Lifecycle

### 1. Version Support Timeline

- **Active Support**: 24 months from release
- **Security Support**: 12 months after active support ends
- **End of Life**: 36 months from release

### 2. Deprecation Process

1. **Announcement**: 6 months before deprecation
2. **Warning Headers**: Added to deprecated endpoints
3. **Documentation**: Updated with migration guides
4. **Support**: Continued during deprecation period

### 3. Migration Support

- **Migration Guides**: Detailed documentation for each version upgrade
- **Dual Support**: New and old versions supported during transition
- **Developer Tools**: Scripts and utilities to assist migration

## Implementation Details

### 1. Version Detection

```typescript
// Version middleware
@Injectable()
export class VersionMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const version = this.extractVersion(req.path);
    req.apiVersion = version;
    
    // Add version headers to response
    res.setHeader('API-Version', version);
    res.setHeader('API-Supported-Versions', 'v1');
    
    next();
  }
  
  private extractVersion(path: string): string {
    const match = path.match(/^\/api\/v(\d+)/);
    return match ? `v${match[1]}` : 'v1';
  }
}
```

### 2. Version-Specific Controllers

```typescript
// V1 Controller
@Controller({ path: 'quotations', version: '1' })
export class QuotationsV1Controller {
  // V1 implementation
}

// V2 Controller (future)
@Controller({ path: 'quotations', version: '2' })
export class QuotationsV2Controller {
  // V2 implementation with breaking changes
}
```

### 3. Deprecation Headers

```typescript
// Deprecation decorator
export const ApiDeprecated = (version: string, sunset?: string) => {
  return applyDecorators(
    ApiHeader({
      name: 'Deprecation',
      description: 'Indicates the endpoint is deprecated',
      required: false,
    }),
    ApiHeader({
      name: 'Sunset',
      description: 'Date when the endpoint will be removed',
      required: false,
    })
  );
};
```

## Version-Specific Features

### V1.0 Features

- **Authentication**: JWT-based authentication
- **Quotations**: Full CRUD operations
- **Customers**: Customer management
- **Products**: Product catalog
- **Orders**: Order processing
- **Email**: Email automation
- **Analytics**: Basic reporting

### Future Versions (Planned)

#### V1.1 (Minor Update)
- Enhanced analytics endpoints
- Additional filter options
- Webhook support
- Bulk operations

#### V2.0 (Major Update - Future)
- GraphQL support
- Real-time subscriptions
- Enhanced security features
- Microservices architecture

## Client Integration Guidelines

### 1. Version Specification

Clients should always specify the API version:

```javascript
// Recommended: Explicit version in URL
fetch('https://api.sanvi-machinery.com/v1/quotations')

// Alternative: Version header (if supported)
fetch('https://api.sanvi-machinery.com/quotations', {
  headers: {
    'API-Version': 'v1'
  }
})
```

### 2. Error Handling

Handle version-related errors gracefully:

```javascript
// Check for version compatibility
if (response.headers.get('API-Version') !== expectedVersion) {
  console.warn('API version mismatch');
}

// Handle deprecation warnings
if (response.headers.get('Deprecation')) {
  console.warn('Using deprecated API endpoint');
}
```

### 3. Migration Strategy

1. **Test with new version** in development environment
2. **Update client code** to handle new response format
3. **Deploy with backward compatibility** checks
4. **Monitor** for any issues
5. **Complete migration** before old version sunset

## Documentation Standards

### 1. Version Documentation

Each version maintains separate documentation:

- `/docs/v1/` - Version 1 documentation
- `/docs/v2/` - Version 2 documentation (future)

### 2. Migration Guides

Detailed migration guides for each version upgrade:

```markdown
# Migration Guide: v1 to v2

## Breaking Changes

### 1. Quotation Response Format
**Before (v1):**
```json
{
  "id": "123",
  "total": 1000
}
```

**After (v2):**
```json
{
  "id": "123",
  "totalAmount": 1000,
  "currency": "INR"
}
```

### 2. Required Changes
- Update field name from `total` to `totalAmount`
- Handle new `currency` field
```

## Monitoring and Analytics

### 1. Version Usage Tracking

Track API version usage to plan deprecation:

```typescript
@Injectable()
export class VersionAnalyticsService {
  trackVersionUsage(version: string, endpoint: string) {
    // Log version usage for analytics
    this.analytics.track('api_version_usage', {
      version,
      endpoint,
      timestamp: new Date(),
    });
  }
}
```

### 2. Deprecation Metrics

Monitor deprecated endpoint usage:

- Usage trends over time
- Client adoption of new versions
- Error rates by version

## Testing Strategy

### 1. Cross-Version Testing

```typescript
describe('API Versioning', () => {
  it('should maintain backward compatibility', async () => {
    // Test v1 endpoint
    const v1Response = await request(app)
      .get('/api/v1/quotations')
      .expect(200);
    
    // Verify v1 response format
    expect(v1Response.body).toMatchV1Schema();
  });
  
  it('should handle version negotiation', async () => {
    // Test version header handling
    const response = await request(app)
      .get('/api/quotations')
      .set('API-Version', 'v1')
      .expect(200);
    
    expect(response.headers['api-version']).toBe('v1');
  });
});
```

### 2. Migration Testing

- Automated tests for each version
- Contract testing between versions
- Performance comparison between versions

## Security Considerations

### 1. Version-Specific Security

- Security patches applied to all supported versions
- Version-specific rate limiting if needed
- Authentication requirements may vary by version

### 2. Vulnerability Management

- Security advisories include affected versions
- Coordinated disclosure for version-specific issues
- Automated security scanning for all versions

## Conclusion

This versioning strategy ensures:

- **Stability** for existing clients
- **Flexibility** for future enhancements
- **Clear migration path** for developers
- **Maintainable codebase** for the development team

Regular review and updates of this strategy ensure it continues to meet the needs of both the platform and its users.