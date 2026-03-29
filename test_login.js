async function testLogin() {
  try {
    const response = await fetch('https://maintenance-scheduler.pages.dev/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'curtis@builtnetworks.com',
        password: 'invalid_password_to_check_401'
      })
    });
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Body:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.log('Error:', error.message);
  }
}
testLogin();
