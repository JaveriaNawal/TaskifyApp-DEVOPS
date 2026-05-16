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

output "static_web_app_url" {
  description = "Frontend Static Web App URL — use as STATIC_WEB_APP_URL in Azure DevOps variable group"
  value       = "https://${azurerm_static_site.frontend.default_host_name}"
}

output "static_web_app_api_key" {
  description = "Static Web App deployment token — use as STATIC_WEB_APP_TOKEN in Azure DevOps variable group (mark as secret)"
  value       = azurerm_static_site.frontend.api_key
  sensitive   = true
}
