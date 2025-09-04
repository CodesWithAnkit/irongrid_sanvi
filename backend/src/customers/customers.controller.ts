import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards, UsePipes, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { 
  ApiTags, 
  ApiOperation, 
  ApiParam, 
  ApiQuery, 
  ApiBody,
  ApiBearerAuth,
  ApiExtraModels,
} from '@nestjs/swagger';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CustomerFiltersDto } from './dto/customer-filters.dto';
import { CustomerResponseDto, PaginatedCustomersResponseDto, CustomerSpecificAnalyticsDto } from './dto/customer-response.dto';
import { CustomersService } from './customers.service';
import { 
  ApiStandardResponse, 
  ApiPaginatedResponse, 
  ApiAuthenticatedOperation,
  ApiPaginationQuery,
  ApiSearchQuery,
  ApiDateRangeQuery,
} from '../common/decorators/api-response.decorator';
import { ValidationSchemas } from '../common/validation/schemas';
import { JoiValidation } from 'src/common/pipes/joi-validation.pipe';
import { Request } from 'express';
import { CreateInteractionDto } from './dto/customer-actions.dto';

@ApiTags('Customers')
@ApiBearerAuth('JWT-auth')
@ApiExtraModels(CustomerResponseDto, PaginatedCustomersResponseDto, CreateCustomerDto, UpdateCustomerDto, CustomerSpecificAnalyticsDto)
@Controller('customers')
@UseGuards(AuthGuard('jwt'))
export class CustomersController {
  constructor(private readonly customers: CustomersService) {}

  @Post()
  @ApiAuthenticatedOperation(
    'Create New Customer',
    'Create a new B2B customer with comprehensive business information. Validates company details, contact information, and credit settings.'
  )
  @ApiBody({
    type: CreateCustomerDto,
    description: 'Customer creation data with business and contact information',
    examples: {
      basic: {
        summary: 'Basic customer example',
        value: {
          companyName: 'Acme Industries Ltd.',
          contactPerson: 'John Smith',
          email: 'john.smith@acme.com',
          phone: '+91-9876543210',
          address: '123 Industrial Area, Sector 5',
          city: 'Mumbai',
          state: 'Maharashtra',
          country: 'India',
          postalCode: '400001',
          customerType: 'LARGE_ENTERPRISE',
          creditLimit: 500000,
          paymentTerms: 'NET_30',
          gstNumber: '27ABCDE1234F1Z5',
          notes: 'Key customer for industrial machinery'
        }
      },
      minimal: {
        summary: 'Minimal required fields',
        value: {
          companyName: 'Small Manufacturing Co.',
          contactPerson: 'Jane Doe',
          email: 'jane@smallmfg.com'
        }
      }
    }
  })
  @ApiStandardResponse(CustomerResponseDto, 'Customer created successfully')
  @UsePipes(JoiValidation(ValidationSchemas.CreateCustomer))
  create(@Body() dto: CreateCustomerDto) {
    return this.customers.create(dto);
  }

  @Get()
  @ApiAuthenticatedOperation(
    'List Customers',
    'Retrieve paginated list of B2B customers with advanced filtering, sorting, and search capabilities. Supports filtering by customer type, location, credit limits, and activity status.'
  )
  @ApiPaginationQuery()
  @ApiSearchQuery()
  @ApiDateRangeQuery()
  @ApiQuery({
    name: 'customerType',
    required: false,
    enum: ['SMALL_BUSINESS', 'MEDIUM_ENTERPRISE', 'LARGE_ENTERPRISE', 'GOVERNMENT', 'DISTRIBUTOR'],
    description: 'Filter by customer business type',
    example: 'LARGE_ENTERPRISE'
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    type: Boolean,
    description: 'Filter by customer active status',
    example: true
  })
  @ApiQuery({
    name: 'city',
    required: false,
    type: String,
    description: 'Filter by customer city',
    example: 'Mumbai'
  })
  @ApiQuery({
    name: 'state',
    required: false,
    type: String,
    description: 'Filter by customer state/province',
    example: 'Maharashtra'
  })
  @ApiQuery({
    name: 'minCreditLimit',
    required: false,
    type: Number,
    description: 'Filter customers with credit limit greater than or equal to this value',
    example: 100000
  })
  @ApiQuery({
    name: 'maxCreditLimit',
    required: false,
    type: Number,
    description: 'Filter customers with credit limit less than or equal to this value',
    example: 1000000
  })
  @ApiPaginatedResponse(CustomerResponseDto, 'Customers retrieved successfully')
  list(@Query() filters: CustomerFiltersDto) {
    return this.customers.findAll(filters);
  }

  @Get(':id')
  @ApiAuthenticatedOperation(
    'Get Customer Details',
    'Retrieve detailed information for a specific customer including contact details, credit information, interaction history, and recent quotations.'
  )
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Unique customer identifier',
    example: 'cm1cust123abc456def789'
  })
  @ApiStandardResponse(CustomerResponseDto, 'Customer details retrieved successfully')
  get(@Param('id') id: string) {
    return this.customers.findOne(id);
  }

  @Patch(':id')
  @ApiAuthenticatedOperation(
    'Update Customer',
    'Update customer information including business details, contact information, and credit settings. Maintains audit trail of changes.'
  )
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Unique customer identifier',
    example: 'cm1cust123abc456def789'
  })
  @ApiBody({
    type: UpdateCustomerDto,
    description: 'Customer update data',
    examples: {
      contactUpdate: {
        summary: 'Update contact information',
        value: {
          contactPerson: 'Jane Smith',
          phone: '+91-9876543211',
          email: 'jane.smith@acme.com'
        }
      },
      creditUpdate: {
        summary: 'Update credit limit',
        value: {
          creditLimit: 750000,
          paymentTerms: 'NET_45',
          notes: 'Credit limit increased due to good payment history'
        }
      }
    }
  })
  @ApiStandardResponse(CustomerResponseDto, 'Customer updated successfully')
  @UsePipes(JoiValidation(ValidationSchemas.UpdateCustomer))
  update(@Param('id') id: string, @Body() dto: UpdateCustomerDto) {
    return this.customers.update(id, dto);
  }

  @Delete(':id')
  @ApiAuthenticatedOperation(
    'Delete Customer',
    'Soft delete a customer. Customer data is retained for audit purposes but marked as inactive. Cannot delete customers with active quotations or orders.'
  )
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Unique customer identifier',
    example: 'cm1cust123abc456def789'
  })
  @ApiStandardResponse(Object, 'Customer deleted successfully')
  remove(@Param('id') id: string) {
    return this.customers.remove(id);
  }

  @Get(':id/quotations')
  @ApiAuthenticatedOperation(
    'Get Customer Quotations',
    'Retrieve all quotations for a specific customer with filtering and pagination. Includes quotation status, amounts, and dates.'
  )
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Unique customer identifier',
    example: 'cm1cust123abc456def789'
  })
  @ApiPaginationQuery()
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['DRAFT', 'SENT', 'APPROVED', 'REJECTED', 'EXPIRED'],
    description: 'Filter by quotation status'
  })
  @ApiStandardResponse(Object, 'Customer quotations retrieved successfully')
  async getCustomerQuotations(@Param('id') id: string, @Query() filters: any) {
    console.log(`Controller: Fetching quotations for ID ${id} with filters`, filters);
    return this.customers.getCustomerQuotations(id, filters);
  }

  @Get(':id/analytics')
  @ApiAuthenticatedOperation(
    'Get Customer Analytics',
    'Retrieve analytics and performance metrics for a specific customer including lifetime value, purchase history, and interaction patterns.'
  )
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Unique customer identifier',
    example: 'cm1cust123abc456def789'
  })
  @ApiDateRangeQuery()
  @ApiStandardResponse(CustomerSpecificAnalyticsDto, 'Customer analytics retrieved successfully')
  getCustomerAnalytics(@Param('id') id: string, @Query() filters: any) {
    return this.customers.getCustomerAnalytics(id, filters);
  }

  @Post(':id/interactions')
  @ApiAuthenticatedOperation(
    'Log Customer Interaction',
    'Record a new interaction with the customer such as phone calls, meetings, or email communications for CRM tracking.'
  )
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Unique customer identifier',
    example: 'cm1cust123abc456def789'
  })
  @ApiBody({
    description: 'Interaction details',
    examples: {
      phoneCall: {
        summary: 'Phone call interaction',
        value: {
          type: 'PHONE_CALL',
          subject: 'Discussed new machinery requirements',
          notes: 'Customer interested in expanding production line. Requested quotation for 3 new machines.',
          duration: 1800,
          outcome: 'FOLLOW_UP_REQUIRED'
        }
      },
      meeting: {
        summary: 'In-person meeting',
        value: {
          type: 'MEETING',
          subject: 'Site visit and requirements assessment',
          notes: 'Visited customer facility. Assessed current setup and discussed upgrade options.',
          attendees: ['John Smith', 'Jane Doe'],
          outcome: 'QUOTATION_REQUESTED'
        }
      }
    }
  })
  @ApiStandardResponse(Object, 'Interaction logged successfully')
  logInteraction(@Param('id') id: string, @Body() body: CreateInteractionDto, @Req() req: Request) {
    const interactionDto: CreateInteractionDto = { ...body, customerId: id };
    return this.customers.createInteraction(interactionDto, (req.user as any).id);
  }

  @Post('import')
  @ApiAuthenticatedOperation(
    'Import Customers',
    'Bulk import customers from CSV file with data validation and duplicate detection. Supports field mapping and error reporting.'
  )
  @ApiBody({
    description: 'CSV file upload with customer data',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'CSV file containing customer data'
        },
        skipDuplicates: {
          type: 'boolean',
          description: 'Skip duplicate entries based on email or company name',
          default: true
        },
        validateOnly: {
          type: 'boolean',
          description: 'Only validate data without importing',
          default: false
        }
      }
    }
  })
  @ApiStandardResponse(Object, 'Customers imported successfully')
  importCustomers(@Body() importData: any) {
    return this.customers.importCustomers(importData);
  }
}
