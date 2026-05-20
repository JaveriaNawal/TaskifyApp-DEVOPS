# ─────────────────────────────────────────────────────────────────────────────
# outputs.tf — Values printed after terraform apply
#
# Use these to configure your Azure DevOps variable group (taskapp-variables)
# and your App Service environment variables.
# ─────────────────────────────────────────────────────────────────────────────

output "resource_group_name" {
  description = "Name of the created resource group"
  value       = azurerm_resource_group.main.name
}

output "acr_login_server" {
  description = "ACR login server URL — use as DOCKER_REGISTRY in Azure DevOps variable group"
  value       = azurerm_container_registry.acr.login_server
}

output "acr_admin_username" {
  description = "ACR admin username — used by App Service to pull images"
  value       = azurerm_container_registry.acr.admin_username
  sensitive   = true
}

output "backend_app_service_url" {
  description = "Backend App Service URL — use as VITE_APP_BASE_URL / REACT_APP_API_URL"
  value       = "https://${azurerm_linux_web_app.backend.default_hostname}"
}

output "backend_app_service_name" {
  description = "Backend App Service name — use as BACKEND_APP_NAME in Azure DevOps variable group"
  value       = azurerm_linux_web_app.backend.name
}

output "frontend_app_service_url" {
  description = "Frontend App Service URL — open this in your browser after deploy"
  value       = "https://${azurerm_linux_web_app.frontend.default_hostname}"
}

output "frontend_app_service_name" {
  description = "Frontend App Service name — use as FRONTEND_APP_NAME in Azure DevOps variable group"
  value       = azurerm_linux_web_app.frontend.name
}

output "sql_server_fqdn" {
  description = "SQL Server fully qualified domain name — use in DB_CONNECTION_STRING"
  value       = azurerm_mssql_server.sql.fully_qualified_domain_name
}

output "db_connection_string" {
  description = "Full SQL connection string for the backend App Service (mark as secret!)"
  value       = "Server=tcp:${azurerm_mssql_server.sql.fully_qualified_domain_name},1433;Database=db-taskapp;User ID=${var.sql_admin_login};Password=${var.sql_admin_password};Encrypt=true;TrustServerCertificate=false;Connection Timeout=30;"
  sensitive   = true
}
