def EC2_PUBLIC_IP = ""
def RDS_ENDPOINT = ""
def DEPLOYER_KEY_URI = ""

pipeline {
    agent any
    environment {
        AWS_ACCESS_KEY_ID     = credentials('jenkins_aws_access_key_id')
        AWS_SECRET_ACCESS_KEY = credentials('jenkins_aws_secret_access_key')
        ECR_REPO_URL          = '522814692322.dkr.ecr.us-east-1.amazonaws.com'
        ECR_REPO_NAME         = 'enis-app'
        IMAGE_REPO            = "${ECR_REPO_URL}/${ECR_REPO_NAME}"
        AWS_REGION            = "us-east-1"
    }

    stages {
        stage('Provision Server and Database') {
            steps {
                script {

                    dir('myterraform/remote-backend') {
                        sh "ls -la"

                        sh "terraform init -lock=false -migrate-state  "
                        // Apply Terraform configuration
                        sh "terraform apply -lock=false --auto-approve"
                    }

                    dir('myterraform') {
                        // Initialize Terraform
                        sh "terraform init -lock=false -migrate-state "
                        sh "terraform plan -lock=false"

                        // Apply Terraform configuration
                        sh "terraform apply -lock=false --auto-approve"

                        // Get EC2 Public IP
                        EC2_PUBLIC_IP = sh(
                            script: '''
                                terraform output instance_details | grep "instance_public_ip" | awk '{print $3}' | tr -d '"'
                            ''',
                            returnStdout: true
                        ).trim()

                        // Get RDS Endpoint
                        RDS_ENDPOINT = sh(
                            script: '''
                                terraform output rds_endpoint | grep "endpoint" | awk -F'=' '{print $2}' | tr -d '[:space:]"' | sed 's/:3306//'
                            ''',
                            returnStdout: true
                        ).trim()

                        // Get Deployer Key URI
                        DEPLOYER_KEY_URI = sh(
                            script: '''
                                terraform output deployer_key_s3_uri | tr -d '"'
                            ''',
                            returnStdout: true
                        ).trim()

                        // Debugging: Print captured values
                        echo "EC2 Public IP: ${EC2_PUBLIC_IP}"
                        echo "RDS Endpoint: ${RDS_ENDPOINT}"
                        echo "Deployer Key URI: ${DEPLOYER_KEY_URI}"
                    }
                }
            }
        }

        stage('Update Frontend Configuration') {
            steps {
                script {
                    dir('frontend/src') {
                        writeFile file: 'config.js', text: """
                            export const API_BASE_URL = 'http://${EC2_PUBLIC_IP}:8000';
                        """
                        
                        sh '''
                            echo "Contents of config.js after update:"
                            cat config.js
                        '''
                    }
                }
            }
        }

        stage('Update Backend Configuration') {
            steps {
                script {
                    dir('backend/backend') {
                        // Verify the existence of settings.py
                        sh '''
                            if [ -f "settings.py" ]; then
                                echo "Found settings.py at $(pwd)"
                            else
                                echo "settings.py not found in $(pwd)!"
                                exit 1
                            fi
                        '''

                        // Update the HOST in the DATABASES section
                        sh """
                            sed -i "/'HOST':/c\\ 'HOST': '${RDS_ENDPOINT}'," settings.py
                        """

                        // Verify the DATABASES section after the update
                        sh '''
                            echo "DATABASES section of settings.py after update:"
                            sed -n '/DATABASES = {/,/^}/p' settings.py
                        '''
                    }
                }
            }
        }
    }
}
