import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  Query, 
  UseGuards,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderFiltersDto } from './dto/order-filters.dto';
import { OrderResponseDto, PaginatedOrdersResponseDto, OrderAnalyticsDto } from './dto/order-response.dto';
import { ConvertQuotationToOrderDto, UpdateOrderStatusDto, UpdatePaymentStatusDto, ModifyOrderDto } from './dto/order-actions.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';

@ApiTags('Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ 
    summary: 'Create a new order',
    description: 'Creates a new order with the provided details. Validates customer, products, and calculates totals automatically.'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Order created successfully',
    type: OrderResponseDto
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 404, description: 'Customer or product not found' })
  async create(
    @Body() createOrderDto: CreateOrderDto,
    @GetUser('id') userId: string
  ): Promise<OrderResponseDto> {
    return this.ordersService.create(createOrderDto, userId);
  }

  @Post('convert-quotation/:quotationId')
  @ApiOperation({ 
    summary: 'Convert quotation to order',
    description: 'Converts an approved quotation into an order with optional additional details.'
  })
  @ApiParam({ name: 'quotationId', description: 'Quotation ID to convert' })
  @ApiResponse({ 
    status: 201, 
    description: 'Order created from quotation successfully',
    type: OrderResponseDto
  })
  @ApiResponse({ status: 400, description: 'Quotation not approved or order already exists' })
  @ApiResponse({ status: 404, description: 'Quotation not found' })
  async convertFromQuotation(
    @Param('quotationId') quotationId: string,
    @Body() convertDto: ConvertQuotationToOrderDto,
    @GetUser('id') userId: string
  ): Promise<OrderResponseDto> {
    return this.ordersService.convertFromQuotation(quotationId, convertDto, userId);
  }

  @Get()
  @ApiOperation({ 
    summary: 'Get all orders with filtering',
    description: 'Retrieves a paginated list of orders with optional filtering and sorting capabilities.'
  })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by order status' })
  @ApiQuery({ name: 'customerId', required: false, description: 'Filter by customer ID' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of records per page (1-100)', example: 20 })
  @ApiQuery({ name: 'offset', required: false, description: 'Number of records to skip', example: 0 })
  @ApiResponse({ 
    status: 200, 
    description: 'Orders retrieved successfully',
    type: PaginatedOrdersResponseDto
  })
  async findAll(@Query() filters: OrderFiltersDto): Promise<PaginatedOrdersResponseDto> {
    return this.ordersService.findAll(filters);
  }

  @Get('analytics')
  @ApiOperation({ 
    summary: 'Get order analytics',
    description: 'Retrieves comprehensive analytics data for orders including trends, status breakdown, and performance metrics.'
  })
  @ApiQuery({ name: 'createdAfter', required: false, description: 'Filter analytics from this date' })
  @ApiQuery({ name: 'createdBefore', required: false, description: 'Filter analytics until this date' })
  @ApiResponse({ 
    status: 200, 
    description: 'Analytics retrieved successfully',
    type: OrderAnalyticsDto
  })
  async getAnalytics(@Query() filters: Partial<OrderFiltersDto>): Promise<OrderAnalyticsDto> {
    return this.ordersService.getAnalytics(filters);
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Get order by ID',
    description: 'Retrieves detailed information about a specific order including customer, items, and related data.'
  })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Order retrieved successfully',
    type: OrderResponseDto
  })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async findOne(@Param('id') id: string): Promise<OrderResponseDto> {
    return this.ordersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ 
    summary: 'Update order',
    description: 'Updates order details with validation for status transitions and business rules.'
  })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Order updated successfully',
    type: OrderResponseDto
  })
  @ApiResponse({ status: 400, description: 'Invalid status transition or input data' })
  @ApiResponse({ status: 403, description: 'Update not allowed for current order status' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async update(
    @Param('id') id: string,
    @Body() updateOrderDto: UpdateOrderDto,
    @GetUser('id') userId: string
  ): Promise<OrderResponseDto> {
    return this.ordersService.update(id, updateOrderDto, userId);
  }

  @Patch(':id/status')
  @ApiOperation({ 
    summary: 'Update order status',
    description: 'Updates the order status with proper validation and triggers notifications.'
  })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Order status updated successfully',
    type: OrderResponseDto
  })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateOrderStatusDto,
    @GetUser('id') userId: string
  ): Promise<OrderResponseDto> {
    return this.ordersService.updateStatus(id, updateStatusDto, userId);
  }

  @Patch(':id/payment')
  @ApiOperation({ 
    summary: 'Update payment status',
    description: 'Updates the payment status and related payment information for an order.'
  })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Payment status updated successfully',
    type: OrderResponseDto
  })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async updatePaymentStatus(
    @Param('id') id: string,
    @Body() updatePaymentDto: UpdatePaymentStatusDto,
    @GetUser('id') userId: string
  ): Promise<OrderResponseDto> {
    return this.ordersService.updatePaymentStatus(id, updatePaymentDto, userId);
  }

  @Post(':id/request-modification')
  @ApiOperation({ 
    summary: 'Request order modification',
    description: 'Requests a modification to an existing order with approval workflow.'
  })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ status: 201, description: 'Modification request created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid modification request' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async requestModification(
    @Param('id') orderId: string,
    @Body() modifyOrderDto: ModifyOrderDto,
    @GetUser('id') userId: string
  ): Promise<any> {
    // This would need a proper DTO for modification requests
    return this.ordersService.requestModification(
      orderId,
      'QUANTITY_CHANGE', // This should come from the DTO
      {}, // This should come from the DTO
      modifyOrderDto.modificationReason || 'No reason provided',
      userId
    );
  }

  @Get(':id/status-history')
  @ApiOperation({ 
    summary: 'Get order status history',
    description: 'Retrieves the complete status change history for an order.'
  })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Status history retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async getStatusHistory(@Param('id') orderId: string): Promise<any> {
    return this.ordersService.getOrderStatusHistory(orderId);
  }

  @Get(':id/performance-tracking')
  @ApiOperation({ 
    summary: 'Get order performance tracking',
    description: 'Retrieves detailed performance tracking information for an order including milestones and delays.'
  })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Performance tracking retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async getPerformanceTracking(@Param('id') orderId: string): Promise<any> {
    return this.ordersService.getOrderPerformanceTracking(orderId);
  }

  @Get('metrics/fulfillment')
  @ApiOperation({ 
    summary: 'Get fulfillment metrics',
    description: 'Retrieves comprehensive fulfillment metrics including delivery performance and customer satisfaction.'
  })
  @ApiQuery({ name: 'createdAfter', required: false, description: 'Filter metrics from this date' })
  @ApiQuery({ name: 'createdBefore', required: false, description: 'Filter metrics until this date' })
  @ApiResponse({ status: 200, description: 'Fulfillment metrics retrieved successfully' })
  async getFulfillmentMetrics(@Query() filters: Partial<OrderFiltersDto>): Promise<any> {
    return this.ordersService.getFulfillmentMetrics(filters);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ 
    summary: 'Delete order',
    description: 'Deletes an order. Only pending orders can be deleted.'
  })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ status: 204, description: 'Order deleted successfully' })
  @ApiResponse({ status: 403, description: 'Cannot delete non-pending orders' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.ordersService.remove(id);
  }
}
