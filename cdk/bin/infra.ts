#!/usr/bin/env node
import 'source-map-support/register'
import * as dotenv from 'dotenv'
import * as cdk from '@aws-cdk/core'
// import { InfraStack } from '../lib/infra-stack'
import { CoreStack } from '../lib/core-stack'
import { PipelineStack } from '../lib/pipeline-stack'
import { FargateStack } from '../lib/fargate-stack'
import { EcrStack } from '../lib/ecr-stack'

dotenv.config({ path: __dirname + '/../.env' })
const app = new cdk.App()

// @see https://docs.aws.amazon.com/cdk/latest/guide/environments.html
const env = {
  region: app.node.tryGetContext('region') || process.env.CDK_INTEG_REGION || process.env.CDK_DEFAULT_REGION,
  account: app.node.tryGetContext('account') || process.env.CDK_INTEG_ACCOUNT || process.env.CDK_DEFAULT_ACCOUNT,
}

const projectTag = process.env.AWS_CDK_PROJECT_TAG ?? 'nestapp'

const coreStack = new CoreStack(app, 'CoreStack', {
  env,
  orgTag: 'org',
})

const ecrStack = new EcrStack(app, 'EcrStack', {
  env,
  projectTag,
})

const fargateStack = new FargateStack(app, 'FargateStack', {
  env,
  projectTag,
  coreStack,
  loadBalancer: {
    certificateArn: '', // @todo - acm.ICertificate
    hostedZoneDomainName: process.env.AWS_CDK_DOMAIN_NAME ?? '',
  },
  container: {
    repository: ecrStack.repo,
    port: Number(process.env.PORT), // @todo the nest app needs to actually use the port
  },
})

const _pipelineStack = new PipelineStack(app, 'PipelineStack', {
  env,
  coreStack,
  github: {
    owner: process.env.AWS_CDK_GITHUB_OWNER ?? '',
    repo: process.env.AWS_CDK_GITHUB_REPOSITORY ?? '',
    defaultBranch: process.env.AWS_CDK_GITHUB_DEFAULT_BRANCH ?? '',
    tokenSecretId: process.env.AWS_CDK_GITHUB_TOKEN_SECRET_ID ?? '',
  },
  projectTag,
  targetService: fargateStack.albfs.service,
})

// new InfraStack(app, 'InfraStack', {
//   env,
// })
