import * as cdk from '@aws-cdk/core'
import * as ec2 from '@aws-cdk/aws-ec2'
import * as ecs from '@aws-cdk/aws-ecs'
// import * as ecs_patterns from '@aws-cdk/aws-ecs-patterns'
// import * as iam from '@aws-cdk/aws-iam'

export interface CoreStackProps extends cdk.StackProps {
  /** short organizational identifier that doesn't use special characters other than - or _ */
  orgTag: string

  vpc?: {
    /** cidr range to use, e.g. '10.0.0.0/16'. tip: if you run different stages with their own vpc, use a different cidr block for each. */
    cidr?: string
    /** maximum number of availability zones for this region */
    maxAzs?: number
    /** defaults to 1, choose at least 2 for production (best is one per az) */
    natGateways?: number
    /** nat gateways are absurdly expensive but they are 'production-grade'; an 'instance' may be suitable for dev or hobby projects. */
    natProvider?: 'gateway' | 'instance'
  }

  cluster?: {
    name?: string
    containerInsights?: boolean
  }
}

export class CoreStack extends cdk.Stack {
  readonly vpc: ec2.Vpc
  readonly cluster: ecs.Cluster

  readonly orgTag: string

  constructor(scope: cdk.Construct, id: string, props: CoreStackProps) {
    super(scope, id, props)

    // @todo add conditional for reserved eip's and use EipNatProvider
    this.vpc = new ec2.Vpc(this, `${props.orgTag}-vpc`, {
      cidr: props?.vpc?.cidr ?? '10.0.0.0/16',
      natGateways: props?.vpc?.natGateways ?? 1,
      maxAzs: props?.vpc?.maxAzs ?? 2,
      natGatewayProvider:
        props?.vpc?.natProvider === 'instance'
          ? ec2.NatProvider.instance({
              instanceType: new ec2.InstanceType('t2.micro'),
            })
          : ec2.NatProvider.gateway(),
    })

    this.cluster = new ecs.Cluster(this, 'ecs-cluster', {
      vpc: this.vpc,
      clusterName: props.cluster?.name,
      containerInsights: props.cluster?.containerInsights ?? true,
    })
  }
}
