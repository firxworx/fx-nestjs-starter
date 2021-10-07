import * as cdk from '@aws-cdk/core'
import * as ec2 from '@aws-cdk/aws-ec2'
import * as ecs from '@aws-cdk/aws-ecs'
import * as ecs_patterns from '@aws-cdk/aws-ecs-patterns'
import * as iam from '@aws-cdk/aws-iam'
import * as logs from '@aws-cdk/aws-logs'
import * as route53 from '@aws-cdk/aws-route53'
import * as acm from '@aws-cdk/aws-certificatemanager'

import { CoreStack } from './core-stack'

export interface FargateStackProps extends cdk.StackProps {
  coreStack: CoreStack

  /** short project identifier that doesn't use special characters other than - or _ */
  projectTag: string

  /** ecs/fargate service to target for deployment */
  targetService: ecs.IBaseService

  tasks?: {
    desiredCount?: number
    autoScaleMaxCapacity?: number
    targetUtilizationPercent?: number
    scaleCooldownDuration?: cdk.Duration
  }

  container: {
    image: ecs.ContainerImage
    port: number
    memoryLimit?: ecs.ContainerDefinitionOptions['memoryLimitMiB']
    minCpu?: ecs.ContainerDefinitionOptions['cpu']
    environment?: Record<string, string>
    secrets?: Record<string, ecs.Secret>
  }

  loadBalancer: {
    public?: boolean
    zone?: route53.IHostedZone
    certificateArn: string // acm.ICertificate
    hostedZoneDomainName: string
    domainName?: string
  }

  logs?: {
    logGroupName?: string
    retention?: logs.RetentionDays
    removalPolicy?: cdk.RemovalPolicy
  }
}

export class FargateStack extends cdk.Stack {
  readonly vpc: ec2.Vpc
  readonly cluster: ecs.Cluster
  readonly logDriver: ecs.AwsLogDriver

  readonly taskRole: iam.Role
  readonly taskExecutionRolePolicyStatement: iam.PolicyStatement
  readonly taskDef: ecs.FargateTaskDefinition
  readonly containerDef: ecs.ContainerDefinition
  readonly albfs: ecs_patterns.ApplicationLoadBalancedFargateService
  readonly scalableTaskCount: ecs.ScalableTaskCount

  readonly zone: route53.IHostedZone
  readonly certificate: acm.ICertificate
  readonly domainName: string

  constructor(scope: cdk.Construct, id: string, props: FargateStackProps) {
    super(scope, id, props)

    this.logDriver = new ecs.AwsLogDriver({
      streamPrefix: 'ecs-logs',
      logGroup: new logs.LogGroup(this, 'LogGroup', {
        logGroupName: `/aws/ecs/${props.projectTag}`,
        retention: props.logs?.retention ?? logs.RetentionDays.ONE_WEEK, // logs.RetentionDays.ONE_YEAR
        removalPolicy: props.logs?.removalPolicy ?? cdk.RemovalPolicy.RETAIN, // cdk.RemovalPolicy.DESTROY
      }),
    })

    const taskRoleName = `ecs-taskRole-${this.stackName}`
    this.taskRole = new iam.Role(this, taskRoleName, {
      roleName: taskRoleName,
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    })

    this.taskExecutionRolePolicyStatement = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      resources: ['*'],
      actions: [
        'ecr:GetAuthorizationToken',
        'ecr:BatchCheckLayerAvailability',
        'ecr:GetDownloadUrlForLayer',
        'ecr:BatchGetImage',
        'logs:CreateLogStream',
        'logs:PutLogEvents',
      ],
    })

    this.taskDef = new ecs.FargateTaskDefinition(this, 'ecs-task', {
      taskRole: this.taskRole,
    })

    this.taskDef.addToExecutionRolePolicy(this.taskExecutionRolePolicyStatement)

    /*
    const secret = secretsManager.Secret.fromSecretAttributes(this, 'Secret', {
      secretArn: '...',
    })

    secrets: {
      ENV_SECRET_NAME: ecs.Secret.fromSecretsManager(secret, 'keyNameInSecret')
    }
    */

    this.containerDef = this.taskDef.addContainer('flask-app', {
      // image: ecs.ContainerImage.fromRegistry('dockerhub/image'),
      // image: ecs.ContainerImage.fromAsset('/path/to/Dockerfile'),
      // image: ecs.ContainerImage.fromEcrRepository(this.repository, 'latest'),
      image: props.container.image,
      memoryLimitMiB: props.container.memoryLimit ?? 256,
      cpu: props.container.minCpu ?? 256,
      logging: this.logDriver,
      environment: props.container.environment ?? { NOCOLOR: '1' },
      secrets: props.container.secrets,
    })

    this.containerDef.addPortMappings({
      containerPort: props.container.port,
      protocol: ecs.Protocol.TCP,
    })

    this.certificate = acm.Certificate.fromCertificateArn(this, 'Certificate', props.loadBalancer.certificateArn)
    this.zone = route53.HostedZone.fromLookup(this, `Zone`, {
      domainName: props.loadBalancer.hostedZoneDomainName,
    })

    // the alb will be configured for https + listen on port 443 because a certificate is specified
    this.albfs = new ecs_patterns.ApplicationLoadBalancedFargateService(this, 'ecs-service', {
      cluster: this.cluster,
      taskDefinition: this.taskDef,
      publicLoadBalancer: props.loadBalancer?.public ?? true,
      desiredCount: props.tasks?.desiredCount ?? 2,
      certificate: this.certificate,
      domainZone: this.zone,
      domainName: this.domainName,
    })

    this.scalableTaskCount = this.albfs.service.autoScaleTaskCount({
      maxCapacity: props.tasks?.autoScaleMaxCapacity ?? 4,
    })

    this.scalableTaskCount.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: props.tasks?.targetUtilizationPercent ?? 15,
      scaleInCooldown: props.tasks?.scaleCooldownDuration ?? cdk.Duration.seconds(60),
      scaleOutCooldown: props.tasks?.scaleCooldownDuration ?? cdk.Duration.seconds(60),
    })

    new cdk.CfnOutput(this, 'LoadBalancerDNS', { value: this.albfs.loadBalancer.loadBalancerDnsName })
  }
}
