Write-Host "🔍 Проверка развертывания..." -ForegroundColor Blue

# Проверка ping
Write-Host "Ping сервера..." -ForegroundColor Yellow
$ping = Test-NetConnection -ComputerName 109.172.37.79 -InformationLevel Quiet
if ($ping) {
    Write-Host "✅ Сервер доступен" -ForegroundColor Green
} else {
    Write-Host "❌ Сервер недоступен" -ForegroundColor Red
}

# Проверка портов
Write-Host "Проверка портов..." -ForegroundColor Yellow
$ports = @(22, 80, 3000, 3001)
foreach ($port in $ports) {
    $test = Test-NetConnection -ComputerName 109.172.37.79 -Port $port -InformationLevel Quiet
    if ($test) {
        Write-Host "✅ Порт $port открыт" -ForegroundColor Green
    } else {
        Write-Host "❌ Порт $port закрыт" -ForegroundColor Red
    }
}

Write-Host "📋 Рекомендации:" -ForegroundColor Blue
Write-Host "1. Подключитесь: ssh root@109.172.37.79" -ForegroundColor Cyan
Write-Host "2. Проверьте: cd /opt/orgchart && docker-compose ps" -ForegroundColor Cyan
Write-Host "3. Логи: docker-compose logs backend" -ForegroundColor Cyan 