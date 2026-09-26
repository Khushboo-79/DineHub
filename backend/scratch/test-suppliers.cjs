const jwt = require('jsonwebtoken');

async function test() {
  const token = jwt.sign(
    { sub: '03c3bd96-7c39-4458-8686-3532cf2ce355', role: 'OWNER' },
    'your_jwt_secret_key',
    { expiresIn: '1h' }
  );

  console.log('Minted Token:', token);

  const reqRes = await fetch('http://localhost:3000/inventory/suppliers', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await reqRes.text();
  console.log('Suppliers response:', data);
}
test();
