import * as pulumi from "@pulumi/pulumi";
import * as awsx from "@pulumi/awsx";
import * as eks from "@pulumi/eks";
import { createArgoCDHelmChart } from "./argocd";
import { Service } from "@pulumi/kubernetes/core/v1";
import { Output } from "@pulumi/pulumi";

// Grab some values from the Pulumi configuration (or use default values)
const config = new pulumi.Config();
const minClusterSize = config.getNumber("minClusterSize") || 2;
const maxClusterSize = config.getNumber("maxClusterSize") || 6;
const desiredClusterSize = config.getNumber("desiredClusterSize") || 2;
const eksNodeInstanceType = config.get("eksNodeInstanceType") || "t3.small";
// Problem : no available/free pods if choosing to too small EC2 instance, see: https://github.com/awslabs/amazon-eks-ami/blob/master/files/eni-max-pods.txt
const vpcNetworkCidr = config.get("vpcNetworkCidr") || "10.0.0.0/16";
const isMinikube = config.requireBoolean("isMinikube");

// Create a new VPC
const eksVpc = new awsx.ec2.Vpc("eks-vpc", {
    enableDnsHostnames: true,
    cidrBlock: vpcNetworkCidr,
});

// Create the EKS cluster
const eksCluster = new eks.Cluster("eks-cluster", {
    // Put the cluster in the new VPC created earlier
    vpcId: eksVpc.vpcId,
    // Public subnets will be used for load balancers
    publicSubnetIds: eksVpc.publicSubnetIds,
    // Private subnets will be used for cluster nodes
    privateSubnetIds: eksVpc.privateSubnetIds,
    // Change configuration values to change any of the following settings
    instanceType: eksNodeInstanceType,
    desiredCapacity: desiredClusterSize,
    minSize: minClusterSize,
    maxSize: maxClusterSize,
    // Do not give the worker nodes public IP addresses
    nodeAssociatePublicIpAddress: false,
    // Uncomment the next two lines for a private cluster (VPN access required)
    // endpointPrivateAccess: true,
    // endpointPublicAccess: false
    version: "1.24",
});

let frontend: pulumi.Output<Service> | undefined = undefined;

let hostname: Output<string>;

function setupArgo() : Output<string> {
    if(process.env.SETUP_ARGO_CD) {
        const argocd = createArgoCDHelmChart(eksCluster.kubeconfig);
        const frontend = argocd.getResource("v1/Service", "argocd/argocd-server");
        // When "done", this will print the public IP.
        return isMinikube
        ? frontend.spec.clusterIP
        : frontend.status.loadBalancer.apply(
            (lb) => lb.ingress[0].ip || "https://" + lb.ingress[0].hostname
        );
    } 
    return Output.create("no-op");
}



// Export some values for use elsewhere
export const kubeconfig = pulumi.secret(eksCluster.kubeconfig); // sensitive - don't want this to be visible in logs
export const vpcId = eksVpc.vpcId;
export const apaId = setupArgo();
// export const ip = isMinikube
//     ? frontend.spec.clusterIP
//     : frontend.status.loadBalancer.apply(
//         (lb) => lb.ingress[0].ip || "https://" + lb.ingress[0].hostname
//     );
