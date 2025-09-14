const axios = require('axios');

// Test the quotation creation with correct customSpecifications format
async function testQuotationCreation() {
  try {
    const quotationData = {
      customerId: "cmfjeun5o0000od2x5uv8f4o9",
      items: [
        {
          productId: "cmfjeun660001od2xl94oskdx",
          quantity: 1,
          unitPrice: 434120,
          discount: 0.01,
          customSpecifications: [
            { name: "description", value: "RO SYSTEM" },
            { name: "unit", value: "item" }
          ]
        },
        {
          productId: "cmfjeun6h0002od2xw7acw2oy",
          quantity: 1,
          unitPrice: 52082,
          discount: 0.01,
          customSpecifications: [
            { name: "description", value: "SAND FILTER" },
            { name: "unit", value: "item" }
          ]
        },
        {
          productId: "cmfjeun6l0003od2xfo3wtn70",
          quantity: 1,
          unitPrice: 43412,
          discount: 0.01,
          customSpecifications: [
            { name: "description", value: "RAW WATER PUMP" },
            { name: "unit", value: "item" }
          ]
        }
      ],
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      termsConditions: "Customer will be billed after indicating acceptance of this quote.\nPayment will be due prior to delivery of service and goods.",
      notes: "If you any enquires about this quotation, please contact Suruchi Sinha on Mobile: 7677614547"
    };

    console.log('Testing quotation creation with correct format...');
    console.log('Payload:', JSON.stringify(quotationData, null, 2));

    const response = await axios.post('http://localhost:3001/api/quotations', quotationData, {
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'accessToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbWVzbm94ZWwwMDN5cDVmemJybnd6dDM1IiwiZW1haWwiOiJhZG1pbkBzYW52aS1tYWNoaW5lcnkuY29tIiwicm9sZXMiOlsiYWRtaW4iXSwicGVybWlzc2lvbnMiOlsidXNlcnM6Y3JlYXRlIiwidXNlcnM6cmVhZCIsInVzZXJzOnVwZGF0ZSIsInVzZXJzOmRlbGV0ZSIsImN1c3RvbWVyczpjcmVhdGUiLCJjdXN0b21lcnM6cmVhZCIsImN1c3RvbWVyczp1cGRhdGUiLCJjdXN0b21lcnM6ZGVsZXRlIiwicHJvZHVjdHM6Y3JlYXRlIiwicHJvZHVjdHM6cmVhZCIsInByb2R1Y3RzOnVwZGF0ZSIsInByb2R1Y3RzOmRlbGV0ZSIsInF1b3RhdGlvbnM6Y3JlYXRlIiwicXVvdGF0aW9uczpyZWFkIiwicXVvdGF0aW9uczp1cGRhdGUiLCJxdW90YXRpb25zOmRlbGV0ZSIsInF1b3RhdGlvbnM6c2VuZCIsInF1b3RhdGlvbnM6YXBwcm92ZSIsIm9yZGVyczpjcmVhdGUiLCJvcmRlcnM6cmVhZCIsIm9yZGVyczp1cGRhdGUiLCJvcmRlcnM6ZGVsZXRlIiwib3JkZXJzOnByb2Nlc3MiLCJhbmFseXRpY3M6cmVhZCIsInJlcG9ydHM6Y3JlYXRlIiwicmVwb3J0czpleHBvcnQiLCJzeXN0ZW06Y29uZmlndXJlIiwiYXVkaXQ6cmVhZCJdLCJpYXQiOjE3NTc4Mzg0NzcsImV4cCI6MTc1NzgzOTM3N30.7Xb_NjMsoCAAq5MXwKnm0dj3lPEi2FqSXIiBNNWuqeM'
      }
    });

    console.log('✅ Success! Quotation created:', response.data);
    return response.data;

  } catch (error) {
    if (error.response) {
      console.error('❌ API Error:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('❌ Network Error:', error.message);
    }
    throw error;
  }
}

// Run the test
testQuotationCreation()
  .then(() => {
    console.log('\n🎉 Test completed successfully!');
    process.exit(0);
  })
  .catch(() => {
    console.log('\n💥 Test failed!');
    process.exit(1);
  });