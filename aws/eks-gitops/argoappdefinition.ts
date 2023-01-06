import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";
import { CustomResource } from '@pulumi/pulumi';

const config = new pulumi.Config();
const targetRevision = config.require("argoCDGitTargetRevision") || "t3.small";

const ARGO_CD_NAMESPACE = "argocd";

export function newArgoApplication(appNameSpace: string, kubeconfig: pulumi.Input<string>) : CustomResource {
    // Create the k8s provider with the kubeconfig.
    const provider = new k8s.Provider("k8sProvider", {kubeconfig});

    const ns = new k8s.core.v1.Namespace(appNameSpace + "-ns", {
        metadata: { name: appNameSpace },
    }, { provider });

    return new k8s.apiextensions.CustomResource(
        "vote-app",
        {
            apiVersion: "argoproj.io/v1alpha1",
            kind: "Application",
            metadata: {
                namespace: ARGO_CD_NAMESPACE, // the ns where argocd is deployed
                name: appNameSpace, // name of app in ArgoCd
            },
            spec: {
                destination: {
                    namespace: ns.metadata.name,
                    server: "https://kubernetes.default.svc",
                },
                project: "default",
                source: {
                    path: "vote-app/argocd-app-config/dev",
                    repoURL: "https://github.com/andtell/cloud-iac-demo-apps/",
                    targetRevision: "HEAD",
                },
                syncPolicy: {
                    automated: {}
                }
            }
        },
        {provider: provider}
    );


}

// source:
    // repoURL: https://github.com/andtell/cloud-iac-demo.git
    // # targetRevision: HEAD
    // targetRevision: develop
    // path: kubernetes/demo-app/argocd-app-config/dev

// Exposing app https://aws.amazon.com/premiumsupport/knowledge-center/eks-kubernetes-services-cluster/

/*

kubectl get service guestbook-ui -n cadec-demo
kubectl get service guestbook-ui -n cadec-demo

kubectl expose deployment guestbook-ui --type=ClusterIP  --name=guestbook-ui-ip -n cadec-demo

*/