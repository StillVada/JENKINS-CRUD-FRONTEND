pipeline {
    agent any

    tools {
        nodejs 'NodeJS' // Убедитесь, что в Jenkins настроен NodeJS tool
    }

    environment {
        // Настройки для сборки
        NODE_ENV = 'production'
        CI = 'true'

        // Директории
        APP_DIR = 'crud-app'
        BUILD_DIR = "${APP_DIR}/dist/crud-app"
        ARTIFACT_NAME = "crud-app-${BUILD_NUMBER}.tar.gz"
    }

    stages {
        stage('Checkout') {
            steps {
                echo 'Checking out source code...'
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                dir("${APP_DIR}") {
                    echo 'Installing npm dependencies...'
                    sh 'npm ci --prefer-offline --no-audit'
                }
            }
        }

        stage('Lint and Format Check') {
            steps {
                dir("${APP_DIR}") {
                    echo 'Running Prettier check...'
                    sh 'npx prettier --check "src/**/*.{ts,html,css,json}"'
                }
            }
        }

        stage('Unit Tests') {
            steps {
                dir("${APP_DIR}") {
                    echo 'Running unit tests...'
                    sh 'npm run test -- --watch=false --browsers=ChromeHeadless'
                }
            }
            post {
                always {
                    dir("${APP_DIR}") {
                        // Сохраняем отчеты о тестах
                        junit 'test-results/**/*.xml'
                        publishHTML([
                            allowMissing: true,
                            alwaysLinkToLastBuild: true,
                            keepAll: true,
                            reportDir: 'coverage',
                            reportFiles: 'index.html',
                            reportName: 'Coverage Report'
                        ])
                    }
                }
            }
        }

        stage('Build Production') {
            steps {
                dir("${APP_DIR}") {
                    echo 'Building production version...'
                    sh 'npm run build -- --configuration production'
                }
            }
        }

        stage('Build Analysis') {
            steps {
                dir("${APP_DIR}") {
                    echo 'Analyzing build size...'
                    sh '''
                        echo "Build size analysis:"
                        du -sh dist/
                        find dist/ -name "*.js" -exec ls -lh {} \\;
                        find dist/ -name "*.css" -exec ls -lh {} \\;
                    '''
                }
            }
        }

        stage('Create Artifact') {
            steps {
                echo 'Creating deployment artifact...'
                sh """
                    cd ${BUILD_DIR}
                    tar -czf ../../../${ARTIFACT_NAME} .
                """
                archiveArtifacts artifacts: "${ARTIFACT_NAME}", fingerprint: true
            }
        }

        stage('Deploy to Staging') {
            when {
                anyOf {
                    branch 'develop'
                    branch 'staging'
                }
            }
            steps {
                echo 'Deploying to staging environment...'
                // Пример деплоя на staging сервер
                // Раскомментируйте и настройте под вашу инфраструктуру

                // sh """
                //     scp ${ARTIFACT_NAME} staging-server:/tmp/
                //     ssh staging-server '
                //         cd /var/www/html
                //         sudo rm -rf crud-app/*
                //         sudo tar -xzf /tmp/${ARTIFACT_NAME} -C crud-app/
                //         sudo chown -R www-data:www-data crud-app/
                //         sudo systemctl reload nginx
                //     '
                // """

                echo 'Staging deployment completed'
            }
        }

        stage('Deploy to Production') {
            when {
                branch 'main'
                beforeInput true
            }
            input {
                message 'Deploy to Production?'
                ok 'Deploy'
                submitterParameter 'APPROVER'
            }
            steps {
                echo "Deploying to production environment (approved by ${APPROVER})..."

                // Пример продакшн деплоя
                // Раскомментируйте и настройте под вашу инфраструктуру

                // sh """
                //     scp ${ARTIFACT_NAME} production-server:/tmp/
                //     ssh production-server '
                //         cd /var/www/html
                //         sudo cp -r crud-app crud-app.backup.$(date +%Y%m%d_%H%M%S)
                //         sudo rm -rf crud-app/*
                //         sudo tar -xzf /tmp/${ARTIFACT_NAME} -C crud-app/
                //         sudo chown -R www-data:www-data crud-app/
                //         sudo systemctl reload nginx
                //         # Проверка работоспособности
                //         curl -f http://localhost/ || exit 1
                //     '
                // """

                echo 'Production deployment completed'
            }
        }

        stage('Post-Deploy Tests') {
            when {
                anyOf {
                    branch 'main'
                    branch 'develop'
                }
            }
            steps {
                echo 'Running post-deployment health checks...'
                // Добавьте проверки здоровья приложения после деплоя
                // sh 'curl -f https://your-app-url/health || exit 1'
                echo 'Health checks passed'
            }
        }
    }

    post {
        always {
            echo 'Cleaning up workspace...'
            cleanWs()

            // Отправка уведомлений
            script {
                def buildStatus = currentBuild.currentResult
                def subject = "Build ${buildStatus}: ${env.JOB_NAME} #${env.BUILD_NUMBER}"
                def body = """
                    Build Status: ${buildStatus}
                    Job: ${env.JOB_NAME}
                    Build Number: ${env.BUILD_NUMBER}
                    Branch: ${env.BRANCH_NAME}
                    Duration: ${currentBuild.durationString}

                    Check console output at: ${env.BUILD_URL}
                """

                // Пример отправки email (настройте SMTP в Jenkins)
                // emailext(
                //     subject: subject,
                //     body: body,
                //     to: 'team@example.com',
                //     attachLog: true
                // )

                // Или отправка в Slack (настройте Slack integration)
                // slackSend(
                //     channel: '#builds',
                //     color: buildStatus == 'SUCCESS' ? 'good' : 'danger',
                //     message: subject
                // )
            }
        }

        success {
            echo 'Pipeline completed successfully!'
        }

        failure {
            echo 'Pipeline failed!'
            // Можно добавить дополнительные действия при неудаче
        }

        unstable {
            echo 'Build is unstable'
        }
    }

    options {
        // Таймаут сборки
        timeout(time: 30, unit: 'MINUTES')

        // Сохранять последние 10 сборок
        buildDiscarder(logRotator(numToKeepStr: '10'))

        // Отключить concurrent builds для одной ветки
        disableConcurrentBuilds()

        // Показывать timestamps в логах
        timestamps()

        // ANSI цвета в логах
        ansiColor('xterm')
    }

    triggers {
        // Автоматический запуск при push в репозиторий
        // pollSCM('H/5 * * * *') // каждые 5 минут проверять изменения

        // Или использовать webhooks от GitHub/GitLab
        // githubPush()
    }
}
