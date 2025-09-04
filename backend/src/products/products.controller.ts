import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards, UsePipes } from '@nestjs/common';
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
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductFiltersDto } from './dto/product-filters.dto';
import { ProductResponseDto, PaginatedProductsResponseDto } from './dto/product-response.dto';
import { ProductsService } from './products.service';
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
import { CreatePricingRuleDto } from './dto/product-actions.dto';

@ApiTags('Products')
@ApiBearerAuth('JWT-auth')
@ApiExtraModels(ProductResponseDto, PaginatedProductsResponseDto, CreateProductDto, UpdateProductDto)
@Controller('products')
@UseGuards(AuthGuard('jwt'))
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Post()
  @ApiAuthenticatedOperation(
    'Create New Product',
    'Add a new product to the catalog with specifications, pricing, and inventory information. Validates SKU uniqueness and product data.'
  )
  @ApiBody({
    type: CreateProductDto,
    description: 'Product creation data with specifications and pricing',
    examples: {
      machinery: {
        summary: 'Industrial machinery example',
        value: {
          sku: 'IND-LATHE-001',
          name: 'CNC Lathe Machine - Model X200',
          description: 'High-precision CNC lathe machine suitable for industrial manufacturing',
          categoryId: 'cm1cat123abc456def789',
          basePrice: 250000,
          currency: 'INR',
          specifications: {
            power: '15 KW',
            weight: '2500 kg',
            dimensions: '3000x1500x2000 mm',
            accuracy: '±0.01 mm',
            maxRPM: 4000
          },
          images: [
            'https://example.com/images/lathe-front.jpg',
            'https://example.com/images/lathe-side.jpg'
          ],
          inventoryCount: 5,
          minOrderQty: 1
        }
      },
      component: {
        summary: 'Machine component example',
        value: {
          sku: 'COMP-BEARING-001',
          name: 'Industrial Ball Bearing - 6208',
          description: 'High-quality ball bearing for industrial applications',
          basePrice: 1500,
          currency: 'INR',
          specifications: {
            innerDiameter: '40 mm',
            outerDiameter: '80 mm',
            width: '18 mm',
            material: 'Chrome Steel',
            sealType: 'Double Sealed'
          },
          inventoryCount: 100,
          minOrderQty: 10
        }
      }
    }
  })
  @ApiStandardResponse(ProductResponseDto, 'Product created successfully')
  @UsePipes(JoiValidation(ValidationSchemas.CreateProduct))
  create(@Body() dto: CreateProductDto) {
    return this.products.create(dto);
  }

  @Get()
  @ApiAuthenticatedOperation(
    'List Products',
    'Retrieve paginated list of products with advanced filtering, sorting, and search capabilities. Supports filtering by category, price range, availability, and full-text search.'
  )
  @ApiPaginationQuery()
  @ApiSearchQuery()
  @ApiDateRangeQuery()
  @ApiQuery({
    name: 'categoryId',
    required: false,
    type: String,
    description: 'Filter by product category ID',
    example: 'cm1cat123abc456def789'
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    type: Boolean,
    description: 'Filter by product active status',
    example: true
  })
  @ApiQuery({
    name: 'minPrice',
    required: false,
    type: Number,
    description: 'Filter products with price greater than or equal to this value',
    example: 10000
  })
  @ApiQuery({
    name: 'maxPrice',
    required: false,
    type: Number,
    description: 'Filter products with price less than or equal to this value',
    example: 500000
  })
  @ApiQuery({
    name: 'inStock',
    required: false,
    type: Boolean,
    description: 'Filter products that are in stock (inventory > 0)',
    example: true
  })
  @ApiPaginatedResponse(ProductResponseDto, 'Products retrieved successfully')
  list(@Query() filters: ProductFiltersDto) {
    return this.products.findAll(filters);
  }

  @Get('categories')
  @ApiAuthenticatedOperation(
    'List Product Categories',
    'Retrieve all product categories with hierarchy and product counts. Used for organizing and filtering products.'
  )
  @ApiStandardResponse(Object, 'Categories retrieved successfully')
  getCategories() {
    return this.products.getCategories();
  }

  @Get('search')
  @ApiAuthenticatedOperation(
    'Search Products',
    'Advanced product search with full-text search across name, description, SKU, and specifications. Supports filters and sorting.'
  )
  @ApiQuery({
    name: 'q',
    required: true,
    type: String,
    description: 'Search query string',
    example: 'CNC lathe machine'
  })
  @ApiQuery({
    name: 'categoryId',
    required: false,
    type: String,
    description: 'Filter by category'
  })
  @ApiQuery({
    name: 'minPrice',
    required: false,
    type: Number,
    description: 'Minimum price filter'
  })
  @ApiQuery({
    name: 'maxPrice',
    required: false,
    type: Number,
    description: 'Maximum price filter'
  })
  @ApiPaginationQuery()
  @ApiStandardResponse(Object, 'Search results retrieved successfully')
  search(@Query() searchParams: any) {
    return this.products.search(searchParams);
  }

  @Get(':id')
  @ApiAuthenticatedOperation(
    'Get Product Details',
    'Retrieve detailed information for a specific product including specifications, pricing, inventory, and related products.'
  )
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Unique product identifier',
    example: 'cm1prod123abc456def789'
  })
  @ApiStandardResponse(ProductResponseDto, 'Product details retrieved successfully')
  get(@Param('id') id: string) {
    return this.products.findOne(id);
  }

  @Patch(':id')
  @ApiAuthenticatedOperation(
    'Update Product',
    'Update product information including specifications, pricing, and inventory. Maintains version history for audit purposes.'
  )
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Unique product identifier',
    example: 'cm1prod123abc456def789'
  })
  @ApiBody({
    type: UpdateProductDto,
    description: 'Product update data',
    examples: {
      priceUpdate: {
        summary: 'Update product price',
        value: {
          basePrice: 275000,
          notes: 'Price updated due to material cost increase'
        }
      },
      inventoryUpdate: {
        summary: 'Update inventory count',
        value: {
          inventoryCount: 8,
          notes: 'Inventory restocked'
        }
      },
      specificationUpdate: {
        summary: 'Update specifications',
        value: {
          specifications: {
            power: '18 KW',
            weight: '2600 kg',
            dimensions: '3000x1500x2000 mm',
            accuracy: '±0.005 mm',
            maxRPM: 4500
          },
          description: 'Updated CNC lathe machine with improved accuracy and power'
        }
      }
    }
  })
  @ApiStandardResponse(ProductResponseDto, 'Product updated successfully')
  @UsePipes(JoiValidation(ValidationSchemas.UpdateProduct))
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.products.update(id, dto);
  }

  @Delete(':id')
  @ApiAuthenticatedOperation(
    'Delete Product',
    'Soft delete a product. Product data is retained for audit purposes but marked as inactive. Cannot delete products with active quotations.'
  )
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Unique product identifier',
    example: 'cm1prod123abc456def789'
  })
  @ApiStandardResponse(Object, 'Product deleted successfully')
  remove(@Param('id') id: string) {
    return this.products.remove(id);
  }

  @Post(':id/inventory')
  @ApiAuthenticatedOperation(
    'Update Product Inventory',
    'Update product inventory count with transaction logging. Supports both absolute updates and relative adjustments.'
  )
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Unique product identifier',
    example: 'cm1prod123abc456def789'
  })
  @ApiBody({
    description: 'Inventory update data',
    examples: {
      absolute: {
        summary: 'Set absolute inventory count',
        value: {
          quantity: 15,
          type: 'SET',
          reason: 'Physical inventory count',
          notes: 'Updated after warehouse audit'
        }
      },
      adjustment: {
        summary: 'Adjust inventory by amount',
        value: {
          quantity: -2,
          type: 'ADJUST',
          reason: 'DAMAGE',
          notes: 'Two units damaged during transport'
        }
      }
    }
  })
  @ApiStandardResponse(Object, 'Inventory updated successfully')
  updateInventory(@Param('id') id: string, @Body() inventoryData: any) {
    return this.products.updateInventory(id, inventoryData);
  }

  @Get(':id/pricing-rules')
  @ApiAuthenticatedOperation(
    'Get Product Pricing Rules',
    'Retrieve pricing rules for a product including customer-specific pricing, volume discounts, and promotional pricing.'
  )
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Unique product identifier',
    example: 'cm1prod123abc456def789'
  })
  @ApiQuery({
    name: 'customerId',
    required: false,
    type: String,
    description: 'Get customer-specific pricing rules',
    example: 'cm1cust123abc456def789'
  })
  @ApiStandardResponse(Object, 'Pricing rules retrieved successfully')
  getPricingRules(@Param('id') id: string, @Query('customerId') customerId?: string) {
    return this.products.getPricingRules(id, customerId);
  }

  @Post(':id/pricing-rules')
  @ApiAuthenticatedOperation(
    'Create Product Pricing Rule',
    'Create a new pricing rule for the product such as volume discounts, customer-specific pricing, or promotional rates.'
  )
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Unique product identifier',
    example: 'cm1prod123abc456def789'
  })
  @ApiBody({
    type: CreatePricingRuleDto,
    description: 'Pricing rule data',
    examples: {
      volumeDiscount: {
        summary: 'Volume discount rule',
        value: {
          type: 'VOLUME_DISCOUNT',
          minQuantity: 5,
          discountType: 'PERCENTAGE',
          discountValue: 10,
          validFrom: '2024-01-01T00:00:00Z',
          validUntil: '2024-12-31T23:59:59Z',
          description: '10% discount for orders of 5 or more units'
        }
      },
      customerSpecific: {
        summary: 'Customer-specific pricing',
        value: {
          type: 'CUSTOMER_SPECIFIC',
          customerId: 'cm1cust123abc456def789',
          priceOverride: 225000,
          validFrom: '2024-01-01T00:00:00Z',
          description: 'Special pricing for key customer'
        }
      }
    }
  })
  @ApiStandardResponse(Object, 'Pricing rule created successfully')
  createPricingRule(@Param('id') id: string, @Body() body: CreatePricingRuleDto) {
    const dto = { ...body, productId: id };
    return this.products.createPricingRule(dto);
  }

  @Get(':id/analytics')
  @ApiAuthenticatedOperation(
    'Get Product Analytics',
    'Retrieve analytics and performance metrics for a product including sales data, quotation frequency, and profitability analysis.'
  )
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Unique product identifier',
    example: 'cm1prod123abc456def789'
  })
  @ApiDateRangeQuery()
  @ApiStandardResponse(Object, 'Product analytics retrieved successfully')
  getProductAnalytics(@Param('id') id: string, @Query() filters: any) {
    return this.products.getProductAnalytics(id, filters);
  }

  @Post('import')
  @ApiAuthenticatedOperation(
    'Import Products',
    'Bulk import products from CSV file with data validation and duplicate detection. Supports field mapping and error reporting.'
  )
  @ApiBody({
    description: 'CSV file upload with product data',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'CSV file containing product data'
        },
        skipDuplicates: {
          type: 'boolean',
          description: 'Skip duplicate entries based on SKU',
          default: true
        },
        validateOnly: {
          type: 'boolean',
          description: 'Only validate data without importing',
          default: false
        },
        categoryMapping: {
          type: 'object',
          description: 'Mapping of category names to category IDs'
        }
      }
    }
  })
  @ApiStandardResponse(Object, 'Products imported successfully')
  importProducts(@Body() importData: any) {
    return this.products.importProducts(importData);
  }
}
