const express = require('express');
const router = express.Router();

// Логирование для миниаппа
router.post('/miniapp', async (req, res) => {
  try {
    const { timestamp, message, data, url, userAgent } = req.body;
    
    console.log(`[MINIAPP LOG] ${timestamp}: ${message}`);
    if (data) {
      console.log(`[MINIAPP DATA] ${JSON.stringify(data, null, 2)}`);
    }
    console.log(`[MINIAPP URL] ${url}`);
    console.log(`[MINIAPP USER-AGENT] ${userAgent}`);
    console.log('---');
    
    // В будущем можно сохранять логи в базу данных
    // const log = await Log.create({
    //   source: 'miniapp',
    //   timestamp: new Date(timestamp),
    //   message,
    //   data: JSON.stringify(data),
    //   url,
    //   userAgent
    // });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error logging miniapp:', error);
    res.status(500).json({ success: false, message: 'Error logging' });
  }
});

module.exports = router; 