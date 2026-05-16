-- Task App Database Schema
-- Run this in Azure Portal Query Editor or Azure Data Studio
-- after creating your Azure SQL Database (db-taskapp)

-- Tasks table
CREATE TABLE tasks (
    id          INT IDENTITY(1,1) PRIMARY KEY,
    title       NVARCHAR(255)  NOT NULL,
    description NVARCHAR(1000) NOT NULL DEFAULT '',
    completed   BIT            NOT NULL DEFAULT 0,
    created_at  DATETIME2      NOT NULL DEFAULT GETUTCDATE()
);

-- Index for ordering by creation date (used in GET /api/tasks)
CREATE INDEX idx_tasks_created_at ON tasks (created_at DESC);

-- Seed data for testing
INSERT INTO tasks (title, description, completed) VALUES
    ('Set up Azure DevOps project',    'Create org, project, and import repo',          0),
    ('Write backend Dockerfile',       'Multi-stage build with node:18-alpine',          1),
    ('Write frontend Dockerfile',      'Build React app, serve with Nginx',              1),
    ('Provision Azure resources',      'ACR, App Service, SQL, Static Web App',          0),
    ('Create CI/CD pipeline',          'Backend and frontend YAML pipelines',            0),
    ('Configure service connections',  'azure-service-connection and acr-service-connection', 0),
    ('Set up Git Flow branching',      'main, develop, feature/* branches',              1);
