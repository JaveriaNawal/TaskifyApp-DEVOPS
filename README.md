# Task App — Enterprise Azure CI/CD Lab

A production-grade full-stack Task Manager built with React + Node.js/Express + Azure SQL,
deployed on Microsoft Azure with full CI/CD pipelines and DevSecOps practices.

---

## Submission

| Item | Value |
|---|---|
| **Live Static Web App URL** | `https://<YOUR-APP>.azurestaticapps.net` |
| **Backend Health Endpoint** | `https://<YOUR-BACKEND>.azurewebsites.net/api/health` |
| **Azure DevOps Project** | `https://dev.azure.com/<YOUR-ORG>/taskapp-cicd` |

> **Screenshots** — add these after completing the lab:
> - `docs/screenshots/pipeline-run.png` — successful pipeline run (all stages green)
> - `docs/screenshots/acr-images.png` — ACR with taskapp-backend and taskapp-frontend images
> - `docs/screenshots/static-web-app.png` — live frontend in browser

---

## Architecture

<cite index="1-23">The system follows a standard three-tier architecture deployed on Microsoft Azure:</cite>

| Layer | Technology | Azure Service |
|---|---|---|
| Frontend | React.js (CRA Static Build) | Azure Static Web App (Free) |
| Backend API | Node.js + Express (Dockerized) | Azure App Service (Container) |
| Database | Azure SQL Server + Database | Azure SQL (Free Student Tier) |
| Container Registry | Docker Images | Azure Container Registry (Basic) |
| CI/CD | YAML Pipelines | Azure DevOps (Free Tier) |
| Source Control | Git (Git Flow) | Azure Repos |

---

## Project Structure

```
.
├── backend/                    # Node.js + Express REST API (Azure SQL)
│   ├── src/
│   │   ├── app.js              # Express app, routes, middleware
│   │   ├── index.js            # Server entry point
│   │   ├── routes/tasks.js     # CRUD endpoints for tasks
│   │   └── db/connection.js    # Azure SQL connection pool (mssql)
│   ├── Dockerfile              # Multi-stage Docker build
│   ├── .dockerignore
│   ├── .env.example            # Environment variable template
│   └── package.json
├── frontend/                   # React (Create React App) frontend
│   ├── src/
│   │   ├── App.js              # Main component — task list + form
│   │   ├── App.css
│   │   ├── index.js
│   │   └── index.css
│   ├── public/index.html
│   ├── Dockerfile              # Multi-stage: CRA build + Nginx serve
│   ├── nginx.conf              # SPA fallback, caching, security headers
│   ├── .dockerignore
│   └── package.json
├── db/
│   └── schema.sql              # Azure SQL schema + seed data
├── azure-pipelines/
│   ├── backend-pipeline.yml    # Backend: Build → Push ACR → Deploy App Service
│   ├── frontend-pipeline.yml   # Frontend: Build → Push ACR → Deploy Static Web App
│   └── security-pipeline.yml  # DevSecOps: SAST → SCA → Build/Deploy → DAST
├── terraform/                  # Infrastructure as Code (Extra Mile)
│   ├── main.tf                 # Resource Group, ACR, App Service, Static Web App
│   ├── variables.tf            # Input variables with validation
│   ├── outputs.tf              # Outputs: URLs, ACR login server, tokens
│   └── terraform.tfvars.example
└── .gitignore                  # Excludes .env, node_modules, terraform state
```

---

## Azure DevOps Variable Group

Create a variable group named **`taskapp-variables`** in Pipelines > Library:

| Variable | Example Value | Secret? |
|---|---|---|
| `DOCKER_REGISTRY` | `acrtaskappyourname.azurecr.io` | No |
| `BACKEND_IMAGE_NAME` | `taskapp-backend` | No |
| `FRONTEND_IMAGE_NAME` | `taskapp-frontend` | No |
| `AZURE_SUBSCRIPTION` | `azure-service-connection` | No |
| `BACKEND_APP_NAME` | `app-taskapp-backend-yourname` | No |
| `REACT_APP_API_URL` | `https://app-taskapp-backend-yourname.azurewebsites.net` | No |
| `STATIC_WEB_APP_TOKEN` | *(from Azure Portal → Static Web App → Manage token)* | **Yes** |
| `STATIC_WEB_APP_URL` | `<your-app>.azurestaticapps.net` | No |
| `DB_CONNECTION_STRING` | `Server=tcp:...` | **Yes** |

---

## Git Flow Branching

<cite index="1-44,1-45">Enterprise teams use Git Flow to manage features, releases, and hotfixes.</cite>

| Branch | Purpose |
|---|---|
| `main` | Production-ready code. Never commit directly. |
| `develop` | Integration branch. All features merge here first. |
| `feature/*` | One branch per feature. Merge to develop via Pull Request. |
| `release/*` | Prepare a release from develop, then merge to main. |

```bash
# Initial setup after cloning
git checkout -b develop
git push origin develop

# Start a feature
git checkout -b feature/dockerize-app develop
```

---

## Local Development

### Prerequisites
- Docker Desktop
- Node.js 18 LTS
- Azure CLI

### Run with Docker

```bash
# Build backend image
docker build -t taskapp-backend:local ./backend

# Build frontend image (pass your backend URL)
docker build \
  --build-arg REACT_APP_API_URL=http://localhost:3001 \
  -t taskapp-frontend:local ./frontend

# Run backend (copy backend/.env.example to backend/.env first)
docker run -p 3001:3001 --env-file ./backend/.env taskapp-backend:local

# Run frontend
docker run -p 8080:80 taskapp-frontend:local

# Visit http://localhost:8080
```

### Run without Docker (dev mode)

```bash
# Terminal 1 — backend
cd backend && npm install && npm run dev   # runs on port 3001

# Terminal 2 — frontend
cd frontend && npm install && npm start    # runs on port 3000
```

---

## Azure Resources

All resources follow the naming convention:
`<abbreviation>-<project>-<environment>-<region>-<count>`

| Resource | Name | Notes |
|---|---|---|
| Resource Group | `rg-taskapp-student-yourname` | Contains all resources |
| Container Registry | `acrtaskappyourname` | Basic SKU, Admin user enabled |
| App Service Plan | `asp-taskapp-prod-eus-01` | Linux, B1 tier |
| App Service | `app-taskapp-backend-yourname` | Docker container from ACR |
| SQL Server | `sql-taskapp-yourname` | Admin login saved securely |
| SQL Database | `db-taskapp` | Serverless, 0.5 vCores, Auto-Pause |
| Static Web App | `stapp-taskapp-frontend` | Free tier, global CDN |

---

## CI/CD Pipelines

<cite index="1-187">Both pipelines follow a multi-stage pattern: Build > Push to Registry > Deploy to Azure.</cite>

### Backend Pipeline (`azure-pipelines/backend-pipeline.yml`)
1. **Build** — Docker build + push to ACR (tagged with Build ID and `latest`)
2. **DeployDev** — Deploy to dev App Service (triggers on `develop` branch)
3. **DeployProd** — Deploy to prod App Service (triggers on `main` branch, requires approval)

### Frontend Pipeline (`azure-pipelines/frontend-pipeline.yml`)
1. **Build** — Docker build + push to ACR
2. **DeployStaticWebApp** — CRA build + deploy to Azure Static Web App

### Security Pipeline (`azure-pipelines/security-pipeline.yml`) — Extra Mile
1. **SAST** — SonarQube static analysis (blocks deploy on quality gate failure)
2. **SCA** — Snyk dependency scan (blocks deploy on HIGH severity CVEs)
3. **BuildAndDeploy** — Only runs if SAST + SCA both passed
4. **DAST** — OWASP ZAP baseline + API scan against live application

---

## Security Practices

- <cite index="1-141,1-142">Database passwords are never hardcoded in code or Dockerfiles. Application Settings in App Service inject them as environment variables at runtime and they are encrypted at rest.</cite>
- `.env` files are in `.gitignore` — no secrets in source control
- <cite index="1-190,1-191">Sensitive values in pipelines use Pipeline Variables and Variable Groups (Library), never hardcoded in YAML.</cite>
- Docker images run as non-root user (`appuser`)
- Nginx serves frontend with security headers (X-Frame-Options, X-Content-Type-Options, etc.)

---

## Infrastructure as Code (Extra Mile — EM-A)

<cite index="1-242,1-243,1-244">Terraform by HashiCorp is the industry standard for Infrastructure as Code. Instead of clicking through the Azure Portal, you write `.tf` files that describe what infrastructure you want. Terraform figures out how to create, update, or delete resources to match your desired state.</cite>

```bash
# Install Terraform (Windows)
winget install HashiCorp.Terraform

# Authenticate with Azure
az login
az account set --subscription "<YOUR-SUBSCRIPTION-ID>"

# Set up remote state storage first (run once)
az group create --name rg-terraform-state --location eastus
az storage account create --name sttfstateyourname \
  --resource-group rg-terraform-state --sku Standard_LRS --kind StorageV2
az storage container create --name tfstate --account-name sttfstateyourname

# Deploy infrastructure
cd terraform/
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values
terraform init
terraform plan -out=tfplan
terraform apply tfplan
terraform output
```

---

## DevSecOps (Extra Mile — EM-B, EM-C, EM-D)

### SAST — SonarQube (EM-B)
<cite index="1-257,1-258,1-259">Static Application Security Testing analyzes source code for security vulnerabilities without running the application. SonarQube is the most widely-used SAST tool in enterprise software. It identifies code smells, bugs, vulnerabilities, and security hotspots.</cite>

### SCA — Snyk (EM-C)
<cite index="1-290,1-291,1-292">Software Composition Analysis scans project dependencies against known vulnerability databases. Every npm package installed could have known CVEs (Common Vulnerabilities and Exposures). Snyk catches these.</cite>

### DAST — OWASP ZAP (EM-D)
<cite index="1-311,1-312">Dynamic Application Security Testing tests a running application from the outside — simulating how an attacker would probe your web application. OWASP ZAP (Zed Attack Proxy) is a free, open-source DAST tool maintained by the Open Web Application Security Project.</cite>

<cite index="1-313,1-314">DAST is the last stage of the security pipeline and runs AFTER the application is deployed. The correct order is: SAST (before build) > SCA (before deploy) > DAST (after deploy).</cite>

---

## Completion Checklist

- [ ] Forked GitHub repo (fork badge visible on GitHub profile)
- [ ] Git Flow branches: `main`, `develop`, `feature/*` in Azure Repos
- [ ] `backend/Dockerfile` and `frontend/Dockerfile` committed
- [ ] Docker images in ACR: `taskapp-backend` and `taskapp-frontend` with build tags
- [ ] Azure SQL Database `db-taskapp` running with schema tables populated
- [ ] App Service deployed — `/api/health` returns HTTP 200
- [ ] Static Web App live — React frontend loads and calls backend API
- [ ] End-to-end test: create a task in the UI, it appears in the list
- [ ] Successful pipeline run (all stages green) in Azure DevOps
- [ ] Multi-stage pipeline proof (Build → DeployDev or DeployProd)
- [ ] Approval gate used (production environment approval recorded)
- [ ] No secrets in code (`.env` in `.gitignore`, no passwords in committed files)

### Extra Mile
- [ ] Terraform state file in Azure Blob Storage (`tfstate` container)
- [ ] All resources created by Terraform (Activity Log shows `terraform`)
- [ ] SonarQube running on Azure VM at `http://<VM-IP>:9000`
- [ ] Custom Quality Gate "TaskApp Enterprise Gate" configured
- [ ] Pipeline blocked by quality gate failure (screenshot)
- [ ] Snyk project monitoring enabled (snyk.io dashboard)
- [ ] ZAP reports published as pipeline artifacts
- [ ] Top 3 ZAP findings documented with remediation steps (see below)

---

## ZAP Findings & Remediation (Extra Mile — EM-D)

> Fill this section in after running the DAST stage.

| # | Alert | Severity | Remediation |
|---|---|---|---|
| 1 | *(e.g., Missing Anti-clickjacking Header)* | Medium | Add `X-Frame-Options: SAMEORIGIN` header |
| 2 | *(e.g., Content Security Policy not set)* | Medium | Add `Content-Security-Policy` header in Nginx config |
| 3 | *(e.g., Server leaks version info)* | Low | Set `server_tokens off;` in Nginx config |

---

## Troubleshooting

| Issue | Solution |
|---|---|
| Pipeline fails: 'Unauthorized' to ACR | Re-create `acr-service-connection`. Verify Admin User is enabled on ACR. |
| App Service shows 'Application Error' | Go to App Service > Log Stream. Usually a missing environment variable. |
| Docker build fails with ENOENT | Check COPY paths in Dockerfile — paths are relative to `buildContext`. |
| SQL connection refused | Enable 'Allow Azure services' on SQL Server firewall. Check connection string format. |
| Static Web App doesn't update | Disconnect the auto-generated GitHub Actions workflow. Azure DevOps pipeline should be the only deployer. |
| SonarQube quality gate stuck | Add a webhook in SonarQube: Administration > Webhooks → point to Azure DevOps. |
| Terraform: 'Provider not initialized' | Run `terraform init` first. Re-run if provider versions change. |
