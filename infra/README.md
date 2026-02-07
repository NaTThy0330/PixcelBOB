# Infra Directory

This folder tracks infrastructure-as-code artifacts for the PixcelBOB platform. Keep Terraform/Helm/Kustomize manifests here so CI/CD can audit changes easily.

Recommended layout:

```
infra/
  terraform/
    dev/
    prod/
  k8s/
    base/
    overlays/
  README.md   <- this file
```

Add provider-specific instructions and state backend details before committing.
