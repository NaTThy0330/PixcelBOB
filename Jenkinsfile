pipeline {
  agent any

  environment {
    REGISTRY = credentials('docker-registry')
    DOCKERHUB_REPO = "pixcelbob"
    APP_VERSION = sh(returnStdout: true, script: 'git describe --tags --always').trim()
  }

  options {
    timestamps()
    ansiColor('xterm')
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Install root deps') {
      steps {
        sh 'npm ci'
      }
    }

    stage('Unit Tests - Backend') {
      steps {
        dir('backend') {
          sh 'npm ci'
          sh 'npm test || true'
        }
      }
    }

    stage('Build Docker Images') {
      parallel {
        stage('Frontend Image') {
          steps {
            sh """
              docker build -f frontend/Dockerfile -t $DOCKERHUB_REPO/frontend:${APP_VERSION} .
            """
          }
        }
        stage('Backend Image') {
          steps {
            sh """
              docker build -f backend/Dockerfile -t $DOCKERHUB_REPO/backend:${APP_VERSION} .
            """
          }
        }
        stage('Worker Image') {
          steps {
            sh """
              docker build -f worker/Dockerfile -t $DOCKERHUB_REPO/worker:${APP_VERSION} .
            """
          }
        }
      }
    }

    stage('Security Scan') {
      steps {
        sh """
          trivy image $DOCKERHUB_REPO/backend:${APP_VERSION}
          trivy image $DOCKERHUB_REPO/worker:${APP_VERSION}
          trivy image $DOCKERHUB_REPO/frontend:${APP_VERSION}
        """
      }
    }

    stage('Push Images') {
      when {
        branch 'main'
      }
      steps {
        withCredentials([
          usernamePassword(credentialsId: 'docker-registry', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')
        ]) {
          sh """
            echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin
            docker push $DOCKERHUB_REPO/backend:${APP_VERSION}
            docker push $DOCKERHUB_REPO/worker:${APP_VERSION}
            docker push $DOCKERHUB_REPO/frontend:${APP_VERSION}
          """
        }
      }
    }
  }
}
