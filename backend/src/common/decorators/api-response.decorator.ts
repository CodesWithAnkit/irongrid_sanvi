import { applyDecorators, Type } from '@nestjs/common';
import {
  ApiResponse,
  ApiOperation,
  ApiBearerAuth,
  ApiTags,
  ApiQuery,
  ApiParam,
  ApiBody,
  getSchemaPath,
} from '@nestjs/swagger';

// Standard API Response wrapper
export class ApiResponseDto<T> {
  success: boolean;
  data?: T;
  message?: string;
  timestamp: string;
}

// Paginated response wrapper
export class PaginatedResponseDto<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  timestamp: string;
}

// Error response format
export class ErrorResponseDto {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
    requestId?: string;
  };
}

// Decorator for standard API responses
export const ApiStandardResponse = <TModel extends Type<any>>(
  model: TModel,
  description: string = 'Success'
) => {
  return applyDecorators(
    ApiResponse({
      status: 200,
      description,
      schema: {
        allOf: [
          {
            properties: {
              success: { type: 'boolean', example: true },
              data: { $ref: getSchemaPath(model) },
              message: { type: 'string', example: 'Operation successful' },
              timestamp: { type: 'string', format: 'date-time' },
            },
          },
        ],
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Bad Request - Validation Error',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'VALIDATION_ERROR' },
              message: { type: 'string', example: 'Validation failed' },
              details: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    field: { type: 'string' },
                    message: { type: 'string' },
                    value: { type: 'any' },
                  },
                },
              },
              timestamp: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Authentication Required',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'AUTHENTICATION_ERROR' },
              message: { type: 'string', example: 'Authentication required' },
              timestamp: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - Insufficient Permissions',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'AUTHORIZATION_ERROR' },
              message: { type: 'string', example: 'Insufficient permissions' },
              timestamp: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'Not Found - Resource Not Found',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'RESOURCE_NOT_FOUND' },
              message: { type: 'string', example: 'Resource not found' },
              timestamp: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 500,
      description: 'Internal Server Error',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'INTERNAL_SERVER_ERROR' },
              message: { type: 'string', example: 'Internal server error' },
              timestamp: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    })
  );
};

// Decorator for paginated responses
export const ApiPaginatedResponse = <TModel extends Type<any>>(
  model: TModel,
  description: string = 'Paginated results'
) => {
  return applyDecorators(
    ApiResponse({
      status: 200,
      description,
      schema: {
        allOf: [
          {
            properties: {
              success: { type: 'boolean', example: true },
              data: {
                type: 'array',
                items: { $ref: getSchemaPath(model) },
              },
              pagination: {
                type: 'object',
                properties: {
                  page: { type: 'number', example: 1 },
                  limit: { type: 'number', example: 20 },
                  total: { type: 'number', example: 100 },
                  totalPages: { type: 'number', example: 5 },
                  hasNext: { type: 'boolean', example: true },
                  hasPrev: { type: 'boolean', example: false },
                },
              },
              timestamp: { type: 'string', format: 'date-time' },
            },
          },
        ],
      },
    })
  );
};

// Decorator for operations requiring authentication
export const ApiAuthenticatedOperation = (summary: string, description?: string) => {
  return applyDecorators(
    ApiOperation({ summary, description }),
    ApiBearerAuth('JWT-auth'),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing JWT token',
    })
  );
};

// Decorator for CRUD operations
export const ApiCrudOperation = (
  operation: 'create' | 'read' | 'update' | 'delete',
  resource: string,
  description?: string
) => {
  const operations = {
    create: `Create a new ${resource}`,
    read: `Retrieve ${resource} information`,
    update: `Update ${resource} information`,
    delete: `Delete ${resource}`,
  };

  return ApiOperation({
    summary: operations[operation],
    description: description || `${operations[operation]} with comprehensive validation and error handling`,
  });
};

// Decorator for pagination query parameters
export const ApiPaginationQuery = () => {
  return applyDecorators(
    ApiQuery({
      name: 'page',
      required: false,
      type: Number,
      description: 'Page number (1-based)',
      example: 1,
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      type: Number,
      description: 'Number of items per page (max 100)',
      example: 20,
    }),
    ApiQuery({
      name: 'sortBy',
      required: false,
      type: String,
      description: 'Field to sort by',
      example: 'createdAt',
    }),
    ApiQuery({
      name: 'sortOrder',
      required: false,
      enum: ['asc', 'desc'],
      description: 'Sort order',
      example: 'desc',
    })
  );
};

// Decorator for search query parameters
export const ApiSearchQuery = () => {
  return applyDecorators(
    ApiQuery({
      name: 'search',
      required: false,
      type: String,
      description: 'Search term for full-text search across relevant fields',
      example: 'industrial machinery',
    })
  );
};

// Decorator for date range filters
export const ApiDateRangeQuery = () => {
  return applyDecorators(
    ApiQuery({
      name: 'createdAfter',
      required: false,
      schema: { type: 'string', format: 'date-time' },
      description: 'Filter records created after this date',
      example: '2024-01-01T00:00:00Z',
    }),
    ApiQuery({
      name: 'createdBefore',
      required: false,
      schema: { type: 'string', format: 'date-time' },
      description: 'Filter records created before this date',
      example: '2024-12-31T23:59:59Z',
    })
  );
};