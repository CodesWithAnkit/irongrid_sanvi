// Test script to create a customer and verify the API works
const fetch = require('node-fetch');

async function testCustomerCreation() {
  try {
    // First, let's try to login to get a token
    const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@sanvi.com',
        password: 'admin123'
      })
    });

    if (!loginResponse.ok) {
      console.log('Login failed, trying to create customer without auth...');
      // Try without auth first
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

      const response = await fetch('http://localhost:3001/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customerData)
      });

      const result = await response.text();
      console.log('Customer creation response:', response.status, result);
      return;
    }

    const loginData = await loginResponse.json();
    console.log('Login successful, token:', loginData.access_token ? 'received' : 'not received');

    // Now create a customer with auth
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

    const response = await fetch('http://localhost:3001/api/customers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${loginData.access_token}`
      },
      body: JSON.stringify(customerData)
    });

    const result = await response.json();
    console.log('Customer creation response:', response.status);
    console.log('Customer data:', JSON.stringify(result, null, 2));

    if (result.id) {
      console.log('✅ Customer created successfully with ID:', result.id);
      console.log('Customer ID format matches CUID pattern:', /^c[a-z0-9]{24}$/.test(result.id));
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

testCustomerCreation();