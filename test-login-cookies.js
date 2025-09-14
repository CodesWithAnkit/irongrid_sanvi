// Test script to verify login with cookies works
const axios = require('axios');
const axiosCookieJarSupport = require('axios-cookiejar-support').wrapper;
const tough = require('tough-cookie');

async function testLogin() {
  try {
    console.log('Testing login with cookies...');
    
    // Create axios instance with cookie jar support
    const client = axios.create({
      baseURL: 'http://localhost:3001/api',
      withCredentials: true,
      timeout: 10000
    });
    
    // Enable cookie jar support
    axiosCookieJarSupport(client);
    client.defaults.jar = new tough.CookieJar();

    // Login
    const loginResponse = await client.post('/auth/login', {
      email: 'admin@sanvi-machinery.com',
      password: 'Admin123!'
    });

    console.log('✅ Login successful!');
    console.log('Response:', loginResponse.data);
    console.log('Cookies received:', loginResponse.headers['set-cookie']);

    // Test authenticated request - get current user
    const userResponse = await client.get('/auth/me');
    console.log('✅ Authenticated request successful!');
    console.log('Current user:', userResponse.data);

    // Test creating a customer
    const customerData = {
      companyName: "Test Company Ltd",
      contactPerson: "John Doe",
      email: "john.doe@testcompany.com",
      phone: "+91-9876543210",
      address: "123 Test Street",
      city: "Mumbai",
      state: "Maharashtra",
      country: "India",
      postalCode: "400001",
      customerType: "SMALL_BUSINESS",
      creditLimit: 100000,
      paymentTerms: "NET_30"
    };

    const customerResponse = await client.post('/customers', customerData);
    console.log('✅ Customer creation successful!');
    console.log('Customer ID:', customerResponse.data.id);
    console.log('Customer ID matches CUID pattern:', /^c[a-z0-9]{24}$/.test(customerResponse.data.id));

    // Test creating a quotation
    const quotationData = {
      customerId: "cmfjeun5o0000od2x5uv8f4o9", // Default customer
      items: [
        {
          productId: "cmfjeun660001od2xl94oskdx", // RO SYSTEM
          quantity: 1,
          unitPrice: 434120,
          discount: 0.01,
          customSpecifications: { description: "RO SYSTEM", unit: "item" }
        }
      ],
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      termsConditions: "Customer will be billed after indicating acceptance of this quote.",
      notes: "Test quotation from automated script"
    };

    const quotationResponse = await client.post('/quotations', quotationData);
    console.log('✅ Quotation creation successful!');
    console.log('Quotation ID:', quotationResponse.data.id);

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
    }
  }
}

testLogin();