const http = require('http');

function testEndpoint(path, description) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: 'GET',
      headers: {
        'Authorization': 'Bearer fake-token-for-test'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`${description}:`);
        console.log(`  Status: ${res.statusCode}`);
        console.log(`  Response: ${data.substring(0, 200)}${data.length > 200 ? '...' : ''}`);
        console.log('');
        resolve();
      });
    });

    req.on('error', (err) => {
      console.log(`${description}:`);
      console.log(`  Error: ${err.message}`);
      console.log('');
      resolve();
    });

    req.setTimeout(5000, () => {
      console.log(`${description}:`);
      console.log('  Error: Timeout');
      console.log('');
      req.destroy();
      resolve();
    });

    req.end();
  });
}

async function testServiceEndpoints() {
  console.log('=== Тест endpoints для страницы "Сервис" ===\n');
  
  await testEndpoint('/api/distribution-settings/status', '1. Distribution Settings Status');
  await testEndpoint('/api/tokens/distributions/statistics', '2. Token Distribution Statistics');
  
  console.log('Тестирование завершено.');
  process.exit(0);
}

testServiceEndpoints(); 