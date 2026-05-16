# ─────────────────────────────────────────────────────────────────────────────
# variables.tf — Input variables for the Task App infrastructure
#
# Override defaults by passing -var flags or creating a terraform.tfvars file.
# Example: terraform apply -var="acr_name=acrtaskappjohn"
# ─────────────────────────────────────────────────────────────────────────────

variable "resource_group_name" {
  description = "Name of the Azure Resource Group that contains all resources"
  type        = string
  default     = "rg-taskapp-tf"
}

variable "location" {
  description = "Azure region for all resources"
  type        = string
  default     = "East US"
}

variable "environment" {
  description = "Deployment environment (dev or prod)"
  type        = string
  default     = "prod"

  validation {
    condition     = contains(["dev", "prod"], var.environment)
    error_message = "environment must be 'dev' or 'prod'."
  }
}

variable "acr_name" {
  description = "Azure Container Registry name — must be globally unique, lowercase, no hyphens, 5-50 chars"
  type        = string

  validation {
    condition     = can(regex("^[a-z0-9]{5,50}$", var.acr_name))
    error_message = "ACR name must be lowercase alphanumeric, 5-50 characters, no hyphens."
  }
}

variable "backend_app_name" {
  description = "Name of the backend Azure App Service (must be globally unique)"
  type        = string
  default     = "app-taskapp-backend"
}

variable "backend_image_name" {
  description = "Docker image name for the backend (as stored in ACR)"
  type        = string
  default     = "taskapp-backend"
}
