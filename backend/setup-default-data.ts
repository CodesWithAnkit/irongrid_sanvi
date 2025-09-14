import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();
const prisma = new PrismaClient();

async function setupDefaultData() {
  console.log('Setting up default data for quotation builder...');

  // Create a default customer for quotation builder
  const defaultCustomer = await prisma.customer.upsert({
    where: { email: 'default@quotationbuilder.local' },
    update: {},
    create: {
      companyName: 'MS ARADHYA MINERAL WATER',
      contactPerson: 'VIKASH KUMAR',
      email: 'default@quotationbuilder.local',
      phone: '+91-9876543210',
      address: 'VIKASH NAGER, BIHARSHARIF NALANDA 803101',
      city: 'BIHARSHARIF',
      state: 'BIHAR',
      postalCode: '803101',
      country: 'India',
      customerType: 'SMALL_BUSINESS',
      creditLimit: 500000,
      paymentTerms: 'NET_30',
    },
  });

  console.log('Default customer created:', defaultCustomer.id);

  // Create default products for quotation builder
  const products = [
    { name: 'RO SYSTEM', price: 434120 },
    { name: 'SAND FILTER', price: 52082 },
    { name: 'RAW WATER PUMP', price: 43412 },
    { name: 'CARBON FILTER', price: 60737 },
    { name: 'RAW WATER TANK', price: 86846 },
    { name: 'UV STERILIZER', price: 43141 },
  ];

  const createdProducts = [];
  for (const product of products) {
    const createdProduct = await prisma.product.upsert({
      where: { sku: `QB-${product.name.replace(/\s+/g, '-').toUpperCase()}` },
      update: {},
      create: {
        sku: `QB-${product.name.replace(/\s+/g, '-').toUpperCase()}`,
        name: product.name,
        description: product.name,
        basePrice: product.price,
        currency: 'INR',
        isActive: true,
        inventoryCount: 100,
      },
    });
    createdProducts.push(createdProduct);
    console.log('Product created:', createdProduct.id, '-', createdProduct.name);
  }

  console.log('\n✅ Default data setup completed!');
  console.log('Default Customer ID:', defaultCustomer.id);
  console.log('Product IDs:');
  createdProducts.forEach(p => console.log(`  ${p.name}: ${p.id}`));

  await prisma.$disconnect();
}

setupDefaultData().catch(console.error);