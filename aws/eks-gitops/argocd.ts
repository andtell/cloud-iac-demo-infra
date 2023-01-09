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

export function createArgoCDHelmChart(provider: k8s.Provider) : k8s.helm.v3.Chart {

    // const provider = new k8s.Provider("k8sProvider", {kubeconfig});
    
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