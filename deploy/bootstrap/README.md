# Bootstrap: the three things CI cannot do for itself

The pipeline deploys the site and nothing else. Everything that grants it that
right has to exist first, and is created once, by a human with cluster admin.

Run these against gamma (`~/.kube/gamma.yml`).

## 1. Namespace and permissions

```bash
kubectl --kubeconfig ~/.kube/gamma.yml apply -f deploy/bootstrap/namespace.yaml
kubectl --kubeconfig ~/.kube/gamma.yml apply -f deploy/bootstrap/rbac.yaml
```

Check it landed the way it was meant to. The first must say yes, the second no:

```bash
kubectl --kubeconfig ~/.kube/gamma.yml auth can-i create deployments \
  -n acegames-www --as-group=gitlab:project:86013072 --as=gitlab:ci_job:1
kubectl --kubeconfig ~/.kube/gamma.yml auth can-i create deployments \
  -n royalstars-production --as-group=gitlab:project:86013072 --as=gitlab:ci_job:1
```

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

## 3. Agent access

`money.energy/devops/infra`, `.gitlab/agents/gamma-k8s-agent/config.yaml`:

```yaml
ci_access:
  projects:
    - id: money.energy/www
      access_as:
        ci_job: {}
```

Without `access_as: ci_job` the pipeline authenticates as the agent, which holds
cluster-admin, and the RBAC in this directory is decoration. The agent reloads
its config within a minute of the merge.

## Undo

```bash
helm --kubeconfig ~/.kube/gamma.yml -n acegames-www uninstall www
kubectl --kubeconfig ~/.kube/gamma.yml delete -f deploy/bootstrap/rbac.yaml
kubectl --kubeconfig ~/.kube/gamma.yml delete namespace acegames-www
glab api --method DELETE projects/86013072/deploy_tokens/<id>
```
