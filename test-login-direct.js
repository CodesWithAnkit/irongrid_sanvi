const axios = require('axios');

async function testLogin() {
  try {
    console.log('Testing direct login API call...');
    
    const response = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'admin@sanvi-machinery.com',
      password: 'Admin123!'
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      withCredentials: true
    });

    console.log('✅ Login successful!');
    console.log('Status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    console.log('Response headers:', response.headers);
    
    return response.data;

  } catch (error) {
    if (error.response) {
      console.error('❌ Login failed!');
      console.error('Status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
      console.error('Response headers:', error.response.headers);
    } else {
      console.error('❌ Network error:', error.message);
    }
    throw error;
  }
}

testLogin()
  .then(() => {
    console.log('\n🎉 Test completed successfully!');
    process.exit(0);
  })
  .catch(() => {
    console.log('\n💥 Test failed!');
    process.exit(1);
  });