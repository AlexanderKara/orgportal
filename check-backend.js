const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

(async () => {
  try {
    const res = await fetch('https://a-team.moscow/api/auth/send-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login: 'testuser' })
    });
    let data;
    try {
      data = await res.json();
    } catch {
      data = await res.text();
    }
    console.log({ status: res.status, data });
  } catch (err) {
    console.error('Ошибка запроса:', err);
  }
})(); 