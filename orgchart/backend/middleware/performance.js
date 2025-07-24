const performanceMiddleware = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    // Можно добавить отправку в систему мониторинга, если нужно
    // if (duration > 1000) { ... }
  });
  
  next();
};

const dbPerformanceMiddleware = (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    // Анализируем размер ответа (можно отправлять в мониторинг)
    // const responseSize = Buffer.byteLength(JSON.stringify(data), 'utf8');
    originalSend.call(this, data);
  };
  
  next();
};

module.exports = {
  performanceMiddleware,
  dbPerformanceMiddleware
}; 