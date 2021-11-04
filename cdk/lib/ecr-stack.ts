import * as cdk from '@aws-cdk/core'
import * as ecr from '@aws-cdk/aws-ecr'

export interface EcrStackProps extends cdk.StackProps {
  orgTag?: string
  projectTag: string
}

export class EcrStack extends cdk.Stack {
  readonly repo: ecr.Repository

  constructor(scope: cdk.Construct, id: string, props: EcrStackProps) {
    super(scope, id, props)

    // if need to look up an existing ecr repository
    // this.repo = ecr.Repository.fromRepositoryName(this, 'Repo', ECR_REPOSITORY_NAME)

    this.repo = new ecr.Repository(this, 'Repo', {
      repositoryName: `${props.orgTag ? props.orgTag + '/' : ''}${props.projectTag}`,
    })
  }
}
