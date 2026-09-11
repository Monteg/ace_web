# Bootstrap: the two things CI cannot do for itself

The pipeline deploys the site and nothing else. Everything that grants it that
right has to exist first, and is created once, by a human with cluster admin.

Run these against gamma (`~/.kube/gamma.yml`).

## 1. Namespace, deploy identity and permissions

```bash
kubectl --kubeconfig ~/.kube/gamma.yml apply -f deploy/bootstrap/namespace.yaml
kubectl --kubeconfig ~/.kube/gamma.yml apply -f deploy/bootstrap/rbac.yaml
kubectl --kubeconfig ~/.kube/gamma.yml -n acegames-www wait \
  --for=jsonpath='{.data.token}' secret/ci-deployer-token --timeout=60s
```

The second manifest creates a dedicated `ci-deployer` service account and a
persistent token Secret. Store that token in GitLab without printing it:

```bash
kubectl --kubeconfig ~/.kube/gamma.yml -n acegames-www \
  get secret ci-deployer-token -o go-template='{{index .data "token" | base64decode}}' | \
  glab variable set ACEGAMES_KUBE_TOKEN --repo money.energy/www \
    --masked --protected --hidden --raw --scope production
```

The first check must say yes and the second no:

```bash
kubectl --kubeconfig ~/.kube/gamma.yml auth can-i create deployments \
  -n acegames-www --as=system:serviceaccount:acegames-www:ci-deployer
kubectl --kubeconfig ~/.kube/gamma.yml auth can-i create deployments \
  -n royalstars-production --as=system:serviceaccount:acegames-www:ci-deployer
```

This explicit credential is needed because `access_as: ci_job` for the GitLab
Kubernetes Agent is a Premium/Ultimate feature and this group is on GitLab
Free. Binding the shared runner service account would give every project using
that runner the same access, so the pipeline does not do that.

## 2. Registry pull secret

The registry is private, so the kubelet needs credentials of its own: a job
token expires with the job and a pod may be rescheduled months later. A project
deploy token scoped to `read_registry` is the smallest thing that works.

```bash
cat > /tmp/deploy-token.json <<'JSON'
{"name": "acegames-www-pull", "username": "acegames-www-pull", "scopes": ["read_registry"]}
JSON
glab api --method POST projects/86013072/deploy_tokens --input /tmp/deploy-token.json
```

The response shows the token once. Feed it straight in:

```bash
kubectl --kubeconfig ~/.kube/gamma.yml -n acegames-www \
  create secret docker-registry gitlab-registry \
  --docker-server=registry.gitlab.com \
  --docker-username=acegames-www-pull \
  --docker-password='<token from the response>'
```

Not a personal access token. One namespace in this cluster already keeps a
developer's PAT in its `gitlab-registry` secret; anything that can read secrets
there can act as that person across all of GitLab.

## Rotate or revoke the deploy credential

Rotate when no deployment is running. Deleting the Secret revokes the old
token immediately, so deployments pause until the GitLab variable is updated:

```bash
kubectl --kubeconfig ~/.kube/gamma.yml -n acegames-www \
  delete secret ci-deployer-token
kubectl --kubeconfig ~/.kube/gamma.yml apply -f deploy/bootstrap/rbac.yaml
kubectl --kubeconfig ~/.kube/gamma.yml -n acegames-www wait \
  --for=jsonpath='{.data.token}' secret/ci-deployer-token --timeout=60s
kubectl --kubeconfig ~/.kube/gamma.yml -n acegames-www \
  get secret ci-deployer-token -o go-template='{{index .data "token" | base64decode}}' | \
  glab variable update ACEGAMES_KUBE_TOKEN --repo money.energy/www \
    --masked --protected --hidden --raw --scope production
```

To revoke without replacement, delete both the GitLab variable and the token
Secret. The service account and its Role can stay in place without a usable
credential.

## Undo

```bash
helm --kubeconfig ~/.kube/gamma.yml -n acegames-www uninstall www
glab variable delete ACEGAMES_KUBE_TOKEN --repo money.energy/www
kubectl --kubeconfig ~/.kube/gamma.yml delete -f deploy/bootstrap/rbac.yaml
kubectl --kubeconfig ~/.kube/gamma.yml delete namespace acegames-www
glab api --method DELETE projects/86013072/deploy_tokens/<id>
```

