import * as ec2 from '@aws-cdk/aws-ec2'
import * as cdk from '@aws-cdk/core'

/**
 * Custom NAT provider VPC's that enables creating NAT Gateways that are associated with the
 * EIP's identified by the given allocation ID(s).
 *
 * This custom provider works around the issue where the CDK construct for VPC's does not (yet??)
 * support using existing EIP's: it only supports creating new EIP's along with the VPC.
 *
 * This presents a problem for enduring infrastructure where a permanent IP is required to support
 * use-cases such as IP whitelisting with third parties, network + firewall configurations, etc.
 *
 * Destroying NAT providers that reference any provided EIP(s) is safe in that the EIP(s) will only
 * become dissociated; they will remain allocated to the AWS account.
 *
 * Usage:
 * When defining a VPC, set the `natGatewayProvider` property value as follows, passing an
 * array of EIP allocation ID's:
 *
 * `new EipNatProvider(this, ["eipalloc-01234abcde", "eipalloc-43210edcba"])`
 *
 * Thanks to @TikiTDO for the basis of this code in a comment on the issue linked to below.
 *
 * @see https://github.com/aws/aws-cdk/issues/4705#issuecomment-819617766
 */

export default class StaticEipNatProvider extends ec2.NatProvider {
  private gateways: Array<[string, string]> = []

  constructor(private construct: cdk.Construct, private allocationIds: string[]) {
    super()
  }

  // this function is called by the VPC construct
  configureNat(options: ec2.ConfigureNatOptions): void {
    options.natSubnets.forEach((publicSubnet: ec2.PublicSubnet, index) => {
      const gateway = new ec2.CfnNatGateway(this.construct, `NATGateway${index}`, {
        allocationId:
          this.allocationIds[index] ??
          new ec2.CfnEIP(this.construct, `EIP${index}`, {
            domain: 'vpc',
          }).attrAllocationId,
        subnetId: publicSubnet.subnetId,
      })

      this.gateways.push([publicSubnet.availabilityZone, gateway.ref])
    })

    options.privateSubnets.forEach((privateSubnet: ec2.PrivateSubnet) => {
      this.configureSubnet(privateSubnet)
    })
  }

  // configure private subnets use the NAT gateway in their AZ
  configureSubnet(subnet: ec2.PrivateSubnet): void {
    const subnetAz = subnet.availabilityZone
    const [, gatewayRef] = this.gateways.find(([gatewayAz]) => subnetAz === gatewayAz) ?? []
    if (gatewayRef) {
      subnet.addRoute('DefaultRoute', {
        enablesInternetConnectivity: true,
        routerId: gatewayRef,
        routerType: ec2.RouterType.NAT_GATEWAY,
      })
    }
  }

  // return gateways created by this provider
  public get configuredGateways(): ec2.GatewayConfig[] {
    return this.gateways.map(([gatewayAz, gatewayId]) => ({ az: gatewayAz, gatewayId }))
  }
}
