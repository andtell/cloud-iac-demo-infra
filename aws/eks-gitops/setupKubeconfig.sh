pulumi stack output kubeconfig --show-secrets > kubeconfig.json

echo "Rember to 'source' this file in order to make env vars stick after exit."

export KUBECONFIG=$PWD/kubeconfig.json

echo $KUBECONFIG

kubectl get svc


# https://eu-north-1.console.aws.amazon.com/vpc/home?region=eu-north-1#subnets:search=eks;sort=SubnetId

# aws eks describe-cluster --name eks-cluster-eksCluster-0d14d05 


# Maybe? https://stackoverflow.com/questions/72176710/eks-update-config-with-awscli-command-aws-eks-update-kubeconfig-fails-with-err

kubectl -n argocd get svc 
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d | pbcopy 