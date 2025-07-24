# Развертывание с использованием 7zip
Write-Host "🚀 Развертывание с 7zip..." -ForegroundColor Blue

# Проверяем наличие 7zip
$sevenZipPath = "C:\Program Files\7-Zip\7z.exe"
if (Test-Path $sevenZipPath) {
    Write-Host "✅ 7zip найден" -ForegroundColor Green
} else {
    Write-Host "❌ 7zip не найден" -ForegroundColor Red
    Write-Host "💡 Установите 7zip с https://7-zip.org/" -ForegroundColor Yellow
    exit 1
}

# Создаем архив
$archiveName = "orgchart-7zip-$(Get-Date -Format 'yyyyMMdd-HHmmss').7z"
Write-Host "📦 Создание архива: $archiveName" -ForegroundColor Yellow

try {
    # Создаем архив с исключениями
    $excludeArgs = @(
        "a", $archiveName, ".",
        "-xr!.git",
        "-xr!node_modules", 
        "-xr!logs",
        "-xr!uploads",
        "-xr!*.log",
        "-xr!.DS_Store",
        "-xr!Thumbs.db"
    )
    
    & $sevenZipPath $excludeArgs
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Архив создан" -ForegroundColor Green
        
        # Копируем на сервер
        Write-Host "📤 Копирование на сервер..." -ForegroundColor Yellow
        scp $archiveName root@109.172.37.79:/opt/orgchart/
        
        # Удаляем локальный архив
        Remove-Item $archiveName
        
        Write-Host "✅ Архив скопирован" -ForegroundColor Green
        
        # Выполняем развертывание на сервере
        Write-Host "🚀 Развертывание на сервере..." -ForegroundColor Yellow
        $deployScript = @"
cd /opt/orgchart
7z x $archiveName -y
rm $archiveName
docker-compose down
docker-compose build --no-cache
docker-compose up -d
echo "✅ Развертывание завершено!"
docker-compose ps
"@
        
        $deployScript | ssh root@109.172.37.79 "bash -s"
        
        Write-Host "🎉 Развертывание завершено!" -ForegroundColor Green
        Write-Host "🌐 Проверьте: http://109.172.37.79" -ForegroundColor Blue
        
    } else {
        Write-Host "❌ Ошибка создания архива" -ForegroundColor Red
    }
    
} catch {
    Write-Host "❌ Ошибка: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "💡 Проверьте SSH подключение" -ForegroundColor Yellow
} 