async function testFullFlow() {
  const email = `test_${Date.now()}@example.com`;
  const password = 'Password123!';
  
  try {
    console.log('--- Registering ---');
    const regRes = await fetch('https://maintenance-scheduler.pages.dev/api/auth/login'.replace('login', 'register'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        fullName: 'Test User',
        tenantName: 'Test Household'
      })
    });
    const regData = await regRes.json();
    console.log('Register Status:', regRes.status, regData);

    if (regRes.status === 201) {
      console.log('--- Logging In ---');
      const loginRes = await fetch('https://maintenance-scheduler.pages.dev/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const loginData = await loginRes.json();
      console.log('Login Status:', loginRes.status, loginData);
    }
  } catch (error) {
    console.log('Error:', error.message);
  }
}
testFullFlow();
