import { AwsCredentials } from './aws-credentials.interface'
import { AwsSesConfig } from './aws-ses.config.interface'

export interface AwsConfig {
  region: string
  credentials: AwsCredentials
  ses?: AwsSesConfig
}
