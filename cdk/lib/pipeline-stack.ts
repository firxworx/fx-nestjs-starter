import * as cdk from '@aws-cdk/core'
import * as ecr from '@aws-cdk/aws-ecr'
import * as ecs from '@aws-cdk/aws-ecs'
import * as iam from '@aws-cdk/aws-iam'
import * as codebuild from '@aws-cdk/aws-codebuild'
import * as codepipeline from '@aws-cdk/aws-codepipeline'
import * as codepipeline_actions from '@aws-cdk/aws-codepipeline-actions'

import { CoreStack } from './core-stack'

// import * as codecommit from '@aws-cdk/aws-codecommit'
// import * as targets from '@aws-cdk/aws-events-targets'
// import * as codedeploy from '@aws-cdk/aws-codedeploy'

export interface PipelineStackProps extends cdk.StackProps {
  coreStack: CoreStack

  /** short project identifier that doesn't use special characters other than - or _ */
  projectTag: string

  /** ecs/fargate service deployment target. */
  targetService: ecs.IBaseService
  github: {
    /** github username of repo owner */
    owner: string
    /** github repo name */
    repo: string
    /** default branch name (often 'main' or 'master') */
    defaultBranch: string
    /** aws secrets manager secret id that corresponds to github personal access token */
    tokenSecretId: string
  }
}

export class PipelineStack extends cdk.Stack {
  readonly repo: ecr.Repository
  readonly source: codebuild.Source
  readonly project: codebuild.Project
  readonly actions: Record<'source' | 'build' | 'approve' | 'deploy', codepipeline_actions.Action>
  readonly pipeline: codepipeline.Pipeline

  constructor(scope: cdk.Construct, id: string, props: PipelineStackProps) {
    super(scope, id, props)

    this.repo = new ecr.Repository(this, 'Repo', {
      repositoryName: `${props.coreStack.orgTag ? props.coreStack.orgTag + '/' : ''}${props.projectTag}`,
    })

    // this.repo = ecr.Repository.fromRepositoryName(this, 'Repo', ECR_REPOSITORY_NAME)

    this.source = codebuild.Source.gitHub({
      owner: props.github.owner,
      repo: props.github.repo,
      webhook: true, // optional, defaults to true if `webhookFilteres` were provided, false otherwise
      webhookFilters: [
        codebuild.FilterGroup.inEventOf(codebuild.EventAction.PUSH).andBranchIs(props.github.defaultBranch),
      ], // optional, by default all pushes and Pull Requests will trigger a build
    })

    this.project = new codebuild.Project(this, props.projectTag, {
      projectName: `${this.stackName}`,
      source: this.source,
      environment: {
        buildImage: codebuild.LinuxBuildImage.AMAZON_LINUX_2_2,
        privileged: true,
      },
      environmentVariables: {
        CLUSTER_NAME: {
          value: `${props.coreStack.cluster.clusterName}`,
        },
        ECR_REPO_URI: {
          value: `${this.repo.repositoryUri}`,
        },
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          pre_build: {
            commands: ['env', 'export TAG=${CODEBUILD_RESOLVED_SOURCE_VERSION}'],
          },
          build: {
            commands: [
              'cd flask-docker-app',
              `docker build -t $ECR_REPO_URI:$TAG .`,
              '$(aws ecr get-login --no-include-email)',
              'docker push $ECR_REPO_URI:$TAG',
            ],
          },
          post_build: {
            commands: [
              'echo "In Post-Build Stage"',
              'cd ..',
              'printf \'[{"name":"flask-app","imageUri":"%s"}]\' $ECR_REPO_URI:$TAG > imagedefinitions.json',
              'pwd; ls -al; cat imagedefinitions.json',
            ],
          },
        },
        artifacts: {
          files: ['imagedefinitions.json'],
        },
      }),
    })

    const sourceOutput = new codepipeline.Artifact()
    const buildOutput = new codepipeline.Artifact()

    this.actions = {
      source: new codepipeline_actions.GitHubSourceAction({
        actionName: 'GitHub_Source',
        owner: props.github.owner,
        repo: props.github.repo,
        branch: props.github.defaultBranch,
        oauthToken: cdk.SecretValue.secretsManager(props.github.tokenSecretId), // /example/github/token
        // oauthToken: cdk.SecretValue.plainText('<plain-text>'),
        output: sourceOutput,
      }),
      build: new codepipeline_actions.CodeBuildAction({
        actionName: 'CodeBuild',
        project: this.project,
        input: sourceOutput,
        outputs: [buildOutput], // optional
      }),
      approve: new codepipeline_actions.ManualApprovalAction({
        actionName: 'Approve',
      }),
      deploy: new codepipeline_actions.EcsDeployAction({
        actionName: 'DeployAction',
        service: props.targetService,
        imageFile: new codepipeline.ArtifactPath(buildOutput, `imagedefinitions.json`),
      }),
    }

    this.pipeline = new codepipeline.Pipeline(this, 'MyECSPipeline', {
      stages: [
        {
          stageName: 'Source',
          actions: [this.actions.source],
        },
        {
          stageName: 'Build',
          actions: [this.actions.build],
        },
        {
          stageName: 'Approve',
          actions: [this.actions.approve],
        },
        {
          stageName: 'Deploy-ECS',
          actions: [this.actions.deploy],
        },
      ],
    })

    if (this.project.role) {
      this.repo.grantPullPush(this.project.role)
    }

    this.project.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          'ecs:DescribeCluster',
          'ecr:GetAuthorizationToken',
          'ecr:BatchCheckLayerAvailability',
          'ecr:BatchGetImage',
          'ecr:GetDownloadUrlForLayer',
        ],
        resources: [`${props.coreStack.cluster.clusterArn}`],
      }),
    )
  }
}
