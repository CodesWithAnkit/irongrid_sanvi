# Sanvi Machinery API Integration Guide

## Overview

This guide provides comprehensive information for integrating with the Sanvi Machinery B2B Platform API. The API follows REST principles and uses JSON for data exchange.

## Base URLs

- **Development**: `http://localhost:3001/api`
- **Production**: `https://api.sanvi-machinery.com/api`

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. All protected endpoints require a valid JWT token in the Authorization header.

### Getting Started

1. **Login to get JWT token**:
```bash
curl -X POST https://api.sanvi-machinery.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@company.com",
    "password": "your-password"
  }'
```

2. **Use the token in subsequent requests**:
```bash
curl -X GET https://api.sanvi-machinery.com/api/customers \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Token Management

- **Access tokens** expire after 1 hour
- **Refresh tokens** expire after 7 days
- Use the `/auth/refresh` endpoint to get new tokens
- Store tokens securely (never in localStorage for production)

## API Versioning

The API uses URL versioning with the format `/api/v{version}`. Currently supported versions:

- **v1** (current): `/api/v1/` - Stable version with full feature set

### Version Compatibility

- **Backward Compatibility**: Minor updates maintain backward compatibility
- **Breaking Changes**: Major version changes may introduce breaking changes
- **Deprecation**: Old versions are deprecated with 6-month notice

## Request/Response Format

### Request Headers

```http
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN
X-Request-ID: unique-request-identifier (optional)
```

### Success Response Format

```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Operation successful",
  "timestamp": "2024-01-20T10:30:00Z"
}
```

### Paginated Response Format

```json
{
  "success": true,
  "data": [
    // Array of items
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  },
  "timestamp": "2024-01-20T10:30:00Z"
}
```

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format",
        "value": "invalid-email"
      }
    ],
    "timestamp": "2024-01-20T10:30:00Z",
    "requestId": "req-123456"
  }
}
```

## Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `AUTHENTICATION_ERROR` | 401 | Invalid or missing authentication |
| `AUTHORIZATION_ERROR` | 403 | Insufficient permissions |
| `RESOURCE_NOT_FOUND` | 404 | Requested resource not found |
| `BUSINESS_LOGIC_ERROR` | 422 | Business rule violation |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_SERVER_ERROR` | 500 | Server error |

## Rate Limiting

The API implements rate limiting to ensure fair usage:

- **Authenticated users**: 1000 requests per hour
- **Unauthenticated users**: 100 requests per hour
- **Burst limit**: 50 requests per minute

### Rate Limit Headers

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1642694400
```

## Pagination

List endpoints support pagination with the following parameters:

- `page`: Page number (1-based, default: 1)
- `limit`: Items per page (max: 100, default: 20)
- `sortBy`: Field to sort by (default: createdAt)
- `sortOrder`: Sort direction (asc/desc, default: desc)

### Example

```bash
curl "https://api.sanvi-machinery.com/api/customers?page=2&limit=50&sortBy=companyName&sortOrder=asc" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Filtering and Search

Most list endpoints support filtering and search:

### Common Filter Parameters

- `search`: Full-text search across relevant fields
- `createdAfter`: Filter by creation date (ISO 8601)
- `createdBefore`: Filter by creation date (ISO 8601)
- `isActive`: Filter by active status (boolean)

### Entity-Specific Filters

#### Customers
- `customerType`: Filter by business type
- `city`, `state`: Filter by location
- `minCreditLimit`, `maxCreditLimit`: Filter by credit range

#### Products
- `categoryId`: Filter by category
- `minPrice`, `maxPrice`: Filter by price range
- `inStock`: Filter by inventory availability

#### Quotations
- `status`: Filter by quotation status
- `customerId`: Filter by customer
- `minAmount`, `maxAmount`: Filter by quotation value

## Integration Examples

### JavaScript/Node.js

```javascript
const axios = require('axios');

class SanviMachineryAPI {
  constructor(baseURL, token) {
    this.client = axios.create({
      baseURL,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  }

  async createCustomer(customerData) {
    try {
      const response = await this.client.post('/customers', customerData);
      return response.data;
    } catch (error) {
      throw new Error(`API Error: ${error.response.data.error.message}`);
    }
  }

  async getQuotations(filters = {}) {
    const params = new URLSearchParams(filters);
    const response = await this.client.get(`/quotations?${params}`);
    return response.data;
  }

  async createQuotation(quotationData) {
    const response = await this.client.post('/quotations', quotationData);
    return response.data;
  }
}

// Usage
const api = new SanviMachineryAPI('https://api.sanvi-machinery.com/api', 'your-jwt-token');

// Create a customer
const customer = await api.createCustomer({
  companyName: 'Acme Industries',
  contactPerson: 'John Smith',
  email: 'john@acme.com'
});

// Create a quotation
const quotation = await api.createQuotation({
  customerId: customer.data.id,
  items: [{
    productId: 'product-id',
    quantity: 2,
    unitPrice: 50000
  }]
});
```

### Python

```python
import requests
from typing import Dict, Any, Optional

class SanviMachineryAPI:
    def __init__(self, base_url: str, token: str):
        self.base_url = base_url
        self.headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
    
    def _request(self, method: str, endpoint: str, data: Optional[Dict] = None) -> Dict[str, Any]:
        url = f"{self.base_url}{endpoint}"
        response = requests.request(method, url, json=data, headers=self.headers)
        
        if not response.ok:
            error_data = response.json()
            raise Exception(f"API Error: {error_data['error']['message']}")
        
        return response.json()
    
    def create_customer(self, customer_data: Dict[str, Any]) -> Dict[str, Any]:
        return self._request('POST', '/customers', customer_data)
    
    def get_quotations(self, filters: Optional[Dict] = None) -> Dict[str, Any]:
        endpoint = '/quotations'
        if filters:
            params = '&'.join([f"{k}={v}" for k, v in filters.items()])
            endpoint += f"?{params}"
        return self._request('GET', endpoint)
    
    def create_quotation(self, quotation_data: Dict[str, Any]) -> Dict[str, Any]:
        return self._request('POST', '/quotations', quotation_data)

# Usage
api = SanviMachineryAPI('https://api.sanvi-machinery.com/api', 'your-jwt-token')

# Create customer
customer = api.create_customer({
    'companyName': 'Acme Industries',
    'contactPerson': 'John Smith',
    'email': 'john@acme.com'
})

# Get quotations with filters
quotations = api.get_quotations({
    'status': 'SENT',
    'page': 1,
    'limit': 10
})
```

### PHP

```php
<?php

class SanviMachineryAPI {
    private $baseUrl;
    private $token;
    
    public function __construct($baseUrl, $token) {
        $this->baseUrl = $baseUrl;
        $this->token = $token;
    }
    
    private function request($method, $endpoint, $data = null) {
        $url = $this->baseUrl . $endpoint;
        
        $options = [
            'http' => [
                'method' => $method,
                'header' => [
                    'Authorization: Bearer ' . $this->token,
                    'Content-Type: application/json'
                ],
                'content' => $data ? json_encode($data) : null
            ]
        ];
        
        $context = stream_context_create($options);
        $response = file_get_contents($url, false, $context);
        
        if ($response === false) {
            throw new Exception('API request failed');
        }
        
        return json_decode($response, true);
    }
    
    public function createCustomer($customerData) {
        return $this->request('POST', '/customers', $customerData);
    }
    
    public function getQuotations($filters = []) {
        $endpoint = '/quotations';
        if (!empty($filters)) {
            $endpoint .= '?' . http_build_query($filters);
        }
        return $this->request('GET', $endpoint);
    }
}

// Usage
$api = new SanviMachineryAPI('https://api.sanvi-machinery.com/api', 'your-jwt-token');

$customer = $api->createCustomer([
    'companyName' => 'Acme Industries',
    'contactPerson' => 'John Smith',
    'email' => 'john@acme.com'
]);
?>
```

## Webhooks (Future Feature)

Webhooks will be available for real-time notifications:

- Quotation status changes
- Order updates
- Payment confirmations
- Customer interactions

## Best Practices

### Security
- Always use HTTPS in production
- Store JWT tokens securely
- Implement token refresh logic
- Validate all input data
- Use API keys for server-to-server communication

### Performance
- Implement request caching where appropriate
- Use pagination for large datasets
- Batch operations when possible
- Monitor rate limits
- Implement exponential backoff for retries

### Error Handling
- Always check the `success` field in responses
- Implement proper error handling for all error codes
- Log API errors for debugging
- Provide meaningful error messages to users
- Implement circuit breaker pattern for resilience

### Data Validation
- Validate data before sending to API
- Use the provided JSON schemas for validation
- Handle validation errors gracefully
- Sanitize user input

## Testing

### Test Environment
- Base URL: `http://localhost:3001/api`
- Test credentials available upon request
- Sandbox data is reset daily

### Postman Collection
Import our Postman collection for easy testing:
- Collection: `sanvi-backend/postman/Sanvi-Machinery-API.postman_collection.json`
- Environment: `sanvi-backend/postman/environments/Development.postman_environment.json`

## Support

### Documentation
- API Documentation: `/api/docs` (Swagger UI)
- Integration Guide: This document
- Code Examples: Available in multiple languages

### Contact
- Technical Support: `api-support@sanvi-machinery.com`
- Business Inquiries: `sales@sanvi-machinery.com`
- Documentation Issues: `docs@sanvi-machinery.com`

### SLA
- **Uptime**: 99.9% availability
- **Response Time**: < 200ms average
- **Support Response**: < 24 hours for technical issues

## Changelog

### v1.0.0 (Current)
- Initial API release
- Customer management endpoints
- Product catalog endpoints
- Quotation management endpoints
- Authentication and authorization
- File upload and management
- Analytics and reporting endpoints

### Upcoming Features
- Order management endpoints
- Payment integration
- Email automation endpoints
- Advanced analytics
- Webhook notifications
- GraphQL endpoint (experimental)