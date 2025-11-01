@echo off
REM Скрипт для автоматического обновления версии PWA (Windows)
REM Использование: update-version.bat "Описание обновления"

setlocal enabledelayedexpansion

REM Получаем описание обновления
set "UPDATE_MESSAGE=%~1"
if "%UPDATE_MESSAGE%"=="" set "UPDATE_MESSAGE=Обновление приложения"

REM Читаем текущую версию из sw.js
for /f "tokens=2 delims=v" %%a in ('findstr /r "crm-cache-v[0-9]" frontend\public\sw.js') do (
    for /f "tokens=1 delims='" %%b in ("%%a") do set CURRENT_VERSION=%%b
)

set /a NEW_VERSION=%CURRENT_VERSION% + 1

echo 📦 Обновление версии PWA...
echo    Текущая версия: v%CURRENT_VERSION%
echo    Новая версия: v%NEW_VERSION%
echo    Описание: %UPDATE_MESSAGE%
echo.

REM Обновляем версию в sw.js (используем PowerShell для замены)
powershell -Command "(Get-Content frontend\public\sw.js) -replace 'crm-cache-v%CURRENT_VERSION%', 'crm-cache-v%NEW_VERSION%' -replace 'Обновлено: v%CURRENT_VERSION%.*', 'Обновлено: v%NEW_VERSION% - %UPDATE_MESSAGE%' | Set-Content frontend\public\sw.js"

echo ✅ Версия обновлена до v%NEW_VERSION%
echo.
echo 🚀 Следующие шаги:
echo    1. git add .
echo    2. git commit -m "Update PWA to v%NEW_VERSION%: %UPDATE_MESSAGE%"
echo    3. git push
echo.
echo 📱 После деплоя пользователи получат обновление в течение 60 секунд

endlocal

