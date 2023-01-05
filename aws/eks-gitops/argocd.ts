import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";

const name = "argocd"
const config = new pulumi.Config();
const isMinikube = config.requireBoolean("isMinikube");

// FIXME
// export function createArgoCDHelmChartFromStaticKubeconfig(): k8s.helm.v3.Chart {
//     const kubeConfig = config.getSecret("kubeconfig");
    
//     return createArgoCDHelmChart(kubeConfig);
// }

export function createArgoCDHelmChart(kubeconfig: pulumi.Input<string>) : k8s.helm.v3.Chart {

    const provider = new k8s.Provider("k8sProvider", {kubeconfig});
    
    const argocdNamespace = new k8s.core.v1.Namespace("argocd-ns", {
        metadata: { name: name },
    }, { provider: provider });

    return new k8s.helm.v3.Chart("argocd", {
        namespace: argocdNamespace.metadata.name,
        fetchOpts: {
            repo: "https://argoproj.github.io/argo-helm"
        },
        chart: "argo-cd",
        values: {
            //installCRDs: false,
            server: {
                service: {
                    type: isMinikube ? 'ClusterIP' : 'LoadBalancer',
                },
            }
        },
        // The helm chart is using a deprecated apiVersion,
            // So let's transform it
        transformations: [
            (obj: any) => {
                if (obj.apiVersion == "extensions/v1beta1")  {
                    obj.apiVersion = "networking.k8s.io/v1beta1"
                }
            },
        ],
    },
    { providers: { kubernetes: provider }});

}




// Export the public IP for WordPress.
//const frontend = argocd.getResource("v1/Service", "argocd/argocd-server");

// When "done", this will print the public IP.
// export const ip = isMinikube
//     ? frontend.spec.clusterIP
//     : frontend.status.loadBalancer.apply(
//           (lb) => lb.ingress[0].ip || "https://" + lb.ingress[0].hostname
//       );