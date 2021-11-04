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

  /** ecs/fargate service to target for deployment. */
  targetService: ecs.IBaseService

  github: {
    /** github username of repo owner */
    owner: string
    /** github repo name */
    repo: string
    /** default branch name (often 'main' or 'master') */
    defaultBranch: string
    /** aws secrets manager secret id that corresponds to github personal access token, e.g. `/org/github/token` */
    tokenSecretId: string
  }
}

export class PipelineStack extends cdk.Stack {
  readonly repo: ecr.Repository
  // readonly source: codebuild.Source
  // readonly project: codebuild.Project
  // readonly actions: Record<'source' | 'build' | 'deploy', codepipeline_actions.Action> // 'approve'
  // readonly pipeline: codepipeline.Pipeline
  // private readonly artifacts: {
  //   source: codepipeline.Artifact
  //   build: codepipeline.Artifact
  // }

  readonly codeBuild: {
    source: codebuild.Source
    project: codebuild.Project
    artifacts: {
      source: codepipeline.Artifact
      build: codepipeline.Artifact
    }
  }

  codePipeline: {
    actions: Record<'source' | 'build' | 'deploy', codepipeline_actions.Action> // approve
    pipeline: codepipeline.Pipeline
  }

  constructor(scope: cdk.Construct, id: string, props: PipelineStackProps) {
    super(scope, id, props)

    this.codeBuild.source = codebuild.Source.gitHub({
      owner: props.github.owner,
      repo: props.github.repo,
      webhook: true, // optional, defaults to true if `webhookFilters` provided, false otherwise
      webhookFilters: [
        codebuild.FilterGroup.inEventOf(codebuild.EventAction.PUSH).andBranchIs(props.github.defaultBranch),
      ], // optional, by default all pushes and Pull Requests will trigger a build
    })

    this.codeBuild.project = new codebuild.Project(this, props.projectTag, {
      projectName: `${this.stackName}`,
      source: this.codeBuild.source,
      environment: {
        buildImage: codebuild.LinuxBuildImage.AMAZON_LINUX_2_2,
        // computeType: codebuild.ComputeType.SMALL,
        privileged: true,
      },
      environmentVariables: {
        CLUSTER_NAME: {
          value: `${props.coreStack.cluster.clusterName}`,
        },
        ECR_REPO_URI: {
          value: `${this.repo.repositoryUri}`,
        },
        REPO_NAME: {
          type: codebuild.BuildEnvironmentVariableType.PLAINTEXT,
          value: this.repo.repositoryName,
        },
      },
      buildSpec: codebuild.BuildSpec.fromObject(this.getBuildSpec()),
    })

    this.codeBuild.artifacts = {
      source: new codepipeline.Artifact(),
      build: new codepipeline.Artifact(),
    }

    this.codePipeline.actions = {
      source: new codepipeline_actions.GitHubSourceAction({
        actionName: 'GitHub_Source',
        owner: props.github.owner,
        repo: props.github.repo,
        branch: props.github.defaultBranch,
        oauthToken: cdk.SecretValue.secretsManager(props.github.tokenSecretId), //
        // oauthToken: cdk.SecretValue.plainText('<plain-text>'),
        output: this.codeBuild.artifacts.source,
      }),
      build: new codepipeline_actions.CodeBuildAction({
        actionName: 'CodeBuild',
        project: this.codeBuild.project,
        input: this.codeBuild.artifacts.source,
        outputs: [this.codeBuild.artifacts.build],
      }),
      // approve: new codepipeline_actions.ManualApprovalAction({
      //   actionName: 'Approve',
      // }),
      deploy: new codepipeline_actions.EcsDeployAction({
        actionName: 'DeployAction',
        service: props.targetService,
        imageFile: new codepipeline.ArtifactPath(this.codeBuild.artifacts.build, `imagedefinitions.json`),
      }),
    }

    this.codePipeline.pipeline = new codepipeline.Pipeline(this, 'DeployPipeline', {
      // pipelineName: ...
      stages: [
        {
          stageName: 'Source',
          actions: [this.codePipeline.actions.source],
        },
        {
          stageName: 'Build',
          actions: [this.codePipeline.actions.build],
        },
        // {
        //   stageName: 'Approve',
        //   actions: [this.actions.approve],
        // },
        {
          stageName: 'Deploy-ECS',
          actions: [this.codePipeline.actions.deploy],
        },
      ],
    })

    // https://github.com/andreiox/aws-cdk-ecs-test-drive/blob/a20f266bbbcbe73565da9b5f1935ad1513e52b60/lib/fastify-app-stack.ts

    if (this.codeBuild.project.role) {
      this.repo.grantPullPush(this.codeBuild.project.role)
    }

    this.codeBuild.project.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          // "ecr:CompleteLayerUpload",
          // "ecr:GetAuthorizationToken",
          // "ecr:InitiateLayerUpload",
          // "ecr:PutImage",
          // "ecr:UploadLayerPart"

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

  private getBuildSpec(): Record<string, unknown> {
    return {
      version: '0.2',
      phases: {
        // install: {
        //   'runtime-versions': {
        //     docker: 20,
        //   },
        // },
        pre_build: {
          commands: [
            'env',
            'COMMIT_HASH=$(echo $CODEBUILD_RESOLVED_SOURCE_VERSION | cut -c 1-7)',
            'IMAGE_TAG=${COMMIT_HASH:=latest}',
            'echo Logging into ECR...',
            'aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com',
          ],
        },
        build: {
          commands: [
            'echo Build started on `date`',
            'echo Building docker image...',
            'docker build -t $IMAGE_REPO_NAME:$IMAGE_TAG .',
            `docker build -t $REPO_NAME:$IMAGE_TAG -f $DOCKERFILE .`,
            'docker tag $IMAGE_REPO_NAME:$IMAGE_TAG $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME:$IMAGE_TAG',
            //
            //
            // 'cd flask-docker-app',
            // `docker build -t $ECR_REPO_URI:$TAG .`,
            // '$(aws ecr get-login --no-include-email)',
            // 'docker push $ECR_REPO_URI:$TAG',
          ],
        },
        post_build: {
          commands: [
            'echo Build completed on `date`',
            'echo Pushing the Docker image...',
            'docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME:$IMAGE_TAG',
            // why not? ecs-cli push ecrname/ecr-project
            //
            //
            // 'echo "In Post-Build Stage"',
            // 'cd ..',
            // 'printf \'[{"name":"flask-app","imageUri":"%s"}]\' $ECR_REPO_URI:$TAG > imagedefinitions.json',
            // 'pwd; ls -al; cat imagedefinitions.json',
          ],
        },
      },
      artifacts: {
        files: ['imagedefinitions.json'],
      },
    }
  }
}
