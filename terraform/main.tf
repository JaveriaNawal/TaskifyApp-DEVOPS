# ─────────────────────────────────────────────────────────────────────────────
# main.tf — Task App Azure Infrastructure
#
# Resources defined here:
#   - Resource Group
#   - Azure Container Registry (ACR)
#   - App Service Plan (Linux, B1)
#   - Backend App Service (Docker container from ACR)
#   - Azure Static Web App (Frontend)
#
# Remote state is stored in Azure Blob Storage (see backend "azurerm" block).
# Run EM-A.3 first to create the storage account and container.
# ─────────────────────────────────────────────────────────────────────────────

terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }

  # Local state — state file is stored locally in terraform.tfstate
  # This avoids needing to pre-create a storage account.
  # For team/production use, switch to the azurerm backend block below.
}

provider "azurerm" {
  features {}
}

# ── Resource Group ────────────────────────────────────────────────────────────
resource "azurerm_resource_group" "main" {
  name     = var.resource_group_name
  location = var.location

  tags = {
    project     = "taskapp"
    environment = var.environment
    managed_by  = "terraform"
  }
}

# ── Azure Container Registry ──────────────────────────────────────────────────
# Stores Docker images pushed by the CI/CD pipeline
resource "azurerm_container_registry" "acr" {
  name                = var.acr_name
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  sku                 = "Basic"   # Cheapest tier — sufficient for student lab
  admin_enabled       = true      # Required for App Service to pull images

  tags = {
    project    = "taskapp"
    managed_by = "terraform"
  }
}

# ── App Service Plan ──────────────────────────────────────────────────────────
# Shared compute plan for the backend App Service
resource "azurerm_service_plan" "plan" {
  name                = "asp-taskapp-${var.environment}"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  os_type             = "Linux"
  sku_name            = "B1"   # Basic tier — cheapest that supports containers

  tags = {
    project    = "taskapp"
    managed_by = "terraform"
  }
}

# ── Backend App Service ───────────────────────────────────────────────────────
# Runs the Dockerized Node.js/Express backend pulled from ACR
resource "azurerm_linux_web_app" "backend" {
  name                = var.backend_app_name
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  service_plan_id     = azurerm_service_plan.plan.id

  site_config {
    application_stack {
      docker_image     = "${azurerm_container_registry.acr.login_server}/${var.backend_image_name}"
      docker_image_tag = "latest"
    }

    # Always on keeps the container warm — disable on Free tier
    always_on = true
  }

  # App settings are injected as environment variables at runtime
  # Sensitive values (DB password, JWT secret) should be set manually
  # in Azure Portal > App Service > Configuration after Terraform apply,
  # or stored in Azure Key Vault and referenced here.
  app_settings = {
    DOCKER_REGISTRY_SERVER_URL      = "https://${azurerm_container_registry.acr.login_server}"
    DOCKER_REGISTRY_SERVER_USERNAME = azurerm_container_registry.acr.admin_username
    DOCKER_REGISTRY_SERVER_PASSWORD = azurerm_container_registry.acr.admin_password
    PORT                            = "3001"
    NODE_ENV                        = "production"
    # DB_HOST, DB_NAME, DB_USER, DB_PASSWORD — set manually after apply (sensitive)
    # FRONTEND_URL — set to your Static Web App URL after it is created
  }

  tags = {
    project    = "taskapp"
    managed_by = "terraform"
  }
}

# ── Frontend App Service ──────────────────────────────────────────────────────
# Note: Azure Static Web Apps is blocked by the student subscription policy.
# The frontend (Nginx + React build) runs as a Docker container on App Service instead.
resource "azurerm_linux_web_app" "frontend" {
  name                = var.frontend_app_name
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  service_plan_id     = azurerm_service_plan.plan.id

  site_config {
    application_stack {
      docker_image     = "${azurerm_container_registry.acr.login_server}/${var.frontend_image_name}"
      docker_image_tag = "latest"
    }
    always_on = true
  }

  app_settings = {
    DOCKER_REGISTRY_SERVER_URL      = "https://${azurerm_container_registry.acr.login_server}"
    DOCKER_REGISTRY_SERVER_USERNAME = azurerm_container_registry.acr.admin_username
    DOCKER_REGISTRY_SERVER_PASSWORD = azurerm_container_registry.acr.admin_password
  }

  tags = {
    project    = "taskapp"
    managed_by = "terraform"
  }
}

# ── Azure SQL Server ──────────────────────────────────────────────────────────
resource "azurerm_mssql_server" "sql" {
  name                         = var.sql_server_name
  resource_group_name          = azurerm_resource_group.main.name
  location                     = azurerm_resource_group.main.location
  version                      = "12.0"
  administrator_login          = var.sql_admin_login
  administrator_login_password = var.sql_admin_password

  tags = {
    project    = "taskapp"
    managed_by = "terraform"
  }
}

# Allow all Azure services to access the SQL Server (required by App Service)
resource "azurerm_mssql_firewall_rule" "allow_azure" {
  name             = "AllowAzureServices"
  server_id        = azurerm_mssql_server.sql.id
  start_ip_address = "0.0.0.0"
  end_ip_address   = "0.0.0.0"
}

# ── Azure SQL Database ────────────────────────────────────────────────────────
resource "azurerm_mssql_database" "db" {
  name           = "db-taskapp"
  server_id      = azurerm_mssql_server.sql.id
  collation      = "SQL_Latin1_General_CP1_CI_AS"
  sku_name       = "GP_S_Gen5_1"   # Serverless, 1 vCore — auto-pauses when idle
  min_capacity   = 0.5
  auto_pause_delay_in_minutes = 60

  tags = {
    project    = "taskapp"
    managed_by = "terraform"
  }
}
