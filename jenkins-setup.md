# Настройка Jenkins для Angular CRUD приложения

## Предварительные требования

### 1. Установка необходимых плагинов в Jenkins
Установите следующие плагины через **Manage Jenkins > Manage Plugins**:
- NodeJS Plugin
- Pipeline
- Git Plugin
- HTML Publisher Plugin (для отчетов о покрытии)
- JUnit Plugin (для результатов тестов)
- Email Extension Plugin (для уведомлений)
- Slack Notification Plugin (опционально)

### 2. Настройка NodeJS Tool
1. Перейдите в **Manage Jenkins > Global Tool Configuration**
2. Найдите секцию **NodeJS**
3. Нажмите **Add NodeJS**
4. Укажите:
   - Name: `NodeJS`
   - Version: выберите LTS версию (рекомендуется 18.x или 20.x)
5. Сохраните настройки

### 3. Настройка Git (если необходимо)
Если Jenkins не имеет доступа к вашему Git репозиторию:
1. Настройте SSH ключи или credentials
2. Добавьте credentials в **Manage Jenkins > Manage Credentials**

## Создание Pipeline Job

### Вариант 1: Использование полного Jenkinsfile
1. Создайте новый **Pipeline** job
2. В секции **Pipeline**:
   - Definition: `Pipeline script from SCM`
   - SCM: `Git`
   - Repository URL: укажите URL вашего репозитория
   - Branch: `*/main` (или нужная ветка)
   - Script Path: `Jenkinsfile`
3. Сохраните и запустите

### Вариант 2: Использование упрощенного Jenkinsfile
1. Создайте новый **Pipeline** job
2. В секции **Pipeline**:
   - Definition: `Pipeline script from SCM`
   - SCM: `Git`
   - Repository URL: укажите URL вашего репозитория
   - Script Path: `Jenkinsfile.simple`
3. Сохраните и запустите

## Настройка различных сред

### Development/Staging среда
- Автоматический деплой при push в ветки `develop` или `staging`
- Используйте легковесный веб-сервер (nginx, Apache)

### Production среда
- Ручное подтверждение для деплоя в main ветку
- Возможность отката на предыдущую версию
- Health checks после деплоя

## Пример настройки Nginx для обслуживания Angular приложения

Создайте конфигурационный файл `/etc/nginx/sites-available/crud-app`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /var/www/html/crud-app;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Кеширование статических ресурсов
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Прокси для API (если бэкенд на том же сервере)
    location /api/ {
        proxy_pass https://localhost:51724;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Включите сайт:
```bash
sudo ln -s /etc/nginx/sites-available/crud-app /etc/nginx/sites-enabled/
sudo systemctl reload nginx
```

## Мониторинг и оповещения

### Настройка email уведомлений
1. Перейдите в **Manage Jenkins > Configure System**
2. Найдите секцию **Extended E-mail Notification**
3. Настройте SMTP сервер
4. В Jenkinsfile раскомментируйте секцию emailext

### Настройка Slack уведомлений
1. Установите Slack Notification Plugin
2. Настройте Slack credentials в Jenkins
3. В Jenkinsfile раскомментируйте секцию slackSend

## Troubleshooting

### Распространенные проблемы:

1. **NodeJS tool не найден**
   - Проверьте, что NodeJS tool правильно настроен в Global Tool Configuration

2. **Тесты падают в headless режиме**
   - Убедитесь, что установлен Chrome/Chromium в Jenkins агенте
   - Или измените конфигурацию тестов на использование jsdom

3. **Права доступа при деплое**
   - Настройте SSH ключи без пароля
   - Или используйте Jenkins credentials

4. **Таймаут при сборке**
   - Увеличьте timeout в Jenkinsfile или оптимизируйте процесс сборки

### Проверка установки:

```bash
# Проверка Node.js
node --version
npm --version

# Проверка Angular CLI
cd crud-app
npx ng version

# Проверка сборки локально
npm ci
npm run build -- --configuration production
```

## Безопасность

- Храните secrets в Jenkins credentials, не в коде
- Используйте HTTPS для всех внешних подключений
- Регулярно обновляйте зависимости
- Настройте доступ к Jenkins только для авторизованных пользователей
