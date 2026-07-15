pipeline {
    agent {
        kubernetes {
            defaultContainer 'node'
            yaml '''
apiVersion: v1
kind: Pod
spec:
  serviceAccountName: jenkins-agents
  containers:
    - name: node
      image: node:20-alpine
      command:
        - cat
      tty: true

    - name: kaniko
      image: gcr.io/kaniko-project/executor:v1.23.2-debug
      command:
        - /busybox/cat
      tty: true
      volumeMounts:
        - name: docker-config
          mountPath: /kaniko/.docker

    - name: kubectl
      image: bitnami/kubectl:1.34
      command:
        - /bin/sh
        - -c
        - cat
      tty: true

  volumes:
    - name: docker-config
      emptyDir: {}
'''
        }
    }

    environment {
        DOCKER_IMAGE = 'baroorks/cloudbees-fresh-demo-app'
        IMAGE_TAG = "${BUILD_NUMBER}"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                container('node') {
                    sh 'npm install'
                }
            }
        }

        stage('Test Application') {
            steps {
                container('node') {
                    sh 'npm test'
                }
            }
        }

        stage('Prepare Docker Credentials') {
            steps {
                container('kaniko') {
                    withCredentials([
                        usernamePassword(
                            credentialsId: 'dockerhub-creds',
                            usernameVariable: 'DOCKER_USERNAME',
                            passwordVariable: 'DOCKER_TOKEN'
                        )
                    ]) {
                        sh '''
                            AUTH=$(printf "%s:%s" "$DOCKER_USERNAME" "$DOCKER_TOKEN" | base64 | tr -d '\\n')

                            cat > /kaniko/.docker/config.json <<EOF
{
  "auths": {
    "https://index.docker.io/v1/": {
      "auth": "$AUTH"
    }
  }
}
EOF
                        '''
                    }
                }
            }
        }

        stage('Build and Push Docker Image') {
            steps {
                container('kaniko') {
                    sh '''
                        /kaniko/executor \
                          --context "$WORKSPACE" \
                          --dockerfile "$WORKSPACE/Dockerfile" \
                          --destination "${DOCKER_IMAGE}:${IMAGE_TAG}" \
                          --destination "${DOCKER_IMAGE}:latest"
                    '''
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                container('kubectl') {
                    sh '''
                        sed "s|baroorks/cloudbees-fresh-demo-app:latest|${DOCKER_IMAGE}:${IMAGE_TAG}|g" \
                          k8s/deployment.yaml > k8s/deployment-rendered.yaml

                        kubectl apply -f k8s/deployment-rendered.yaml
                        kubectl apply -f k8s/service.yaml

                        kubectl rollout status deployment/cloudbees-demo-app \
                          --namespace cloudbees-core \
                          --timeout=180s
                    '''
                }
            }
        }

        stage('Validate Deployment') {
            steps {
                container('kubectl') {
                    sh '''
                        kubectl get deployment cloudbees-demo-app \
                          --namespace cloudbees-core

                        kubectl get pods \
                          --namespace cloudbees-core \
                          -l app=cloudbees-demo-app

                        kubectl get service cloudbees-demo-app \
                          --namespace cloudbees-core
                    '''
                }
            }
        }
    }

    post {
        success {
            echo "Pipeline completed successfully."
            echo "Docker image pushed: ${DOCKER_IMAGE}:${IMAGE_TAG}"
            echo "Application deployed successfully to Amazon EKS."
        }

        failure {
            echo 'Pipeline failed. Review the failed stage and console logs.'
        }

        always {
            echo 'Pipeline execution finished.'
        }
    }
}
