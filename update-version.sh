#!/bin/bash

# Скрипт для автоматического обновления версии PWA
# Использование: ./update-version.sh "Описание обновления"

# Получаем описание обновления
UPDATE_MESSAGE=${1:-"Обновление приложения"}

# Читаем текущую версию из sw.js
CURRENT_VERSION=$(grep -oP "crm-cache-v\K\d+" frontend/public/sw.js)
NEW_VERSION=$((CURRENT_VERSION + 1))

echo "📦 Обновление версии PWA..."
echo "   Текущая версия: v$CURRENT_VERSION"
echo "   Новая версия: v$NEW_VERSION"
echo "   Описание: $UPDATE_MESSAGE"

# Обновляем версию в sw.js
sed -i "s/crm-cache-v$CURRENT_VERSION/crm-cache-v$NEW_VERSION/g" frontend/public/sw.js
sed -i "s/Обновлено: v$CURRENT_VERSION.*/Обновлено: v$NEW_VERSION - $UPDATE_MESSAGE/g" frontend/public/sw.js

echo "✅ Версия обновлена до v$NEW_VERSION"
echo ""
echo "🚀 Следующие шаги:"
echo "   1. git add ."
echo "   2. git commit -m \"Update PWA to v$NEW_VERSION: $UPDATE_MESSAGE\""
echo "   3. git push"
echo ""
echo "📱 После деплоя пользователи получат обновление в течение 60 секунд"

