-- Task App Database Schema
-- Run this in Azure Portal Query Editor or Azure Data Studio
-- after creating your Azure SQL Database (db-taskapp)

-- Tasks table
CREATE TABLE tasks (
    id          INT IDENTITY(1,1) PRIMARY KEY,
    title       NVARCHAR(255)  NOT NULL,
    description NVARCHAR(1000) NOT NULL DEFAULT '',
    completed   BIT            NOT NULL DEFAULT 0,
    priority    NVARCHAR(10)   NOT NULL DEFAULT 'medium'
                               CHECK (priority IN ('low','medium','high')),
    due_date    DATE           NULL,
    created_at  DATETIME2      NOT NULL DEFAULT GETUTCDATE()
);

-- Index for ordering by creation date (used in GET /api/tasks)
CREATE INDEX idx_tasks_created_at ON tasks (created_at DESC);
CREATE INDEX idx_tasks_priority   ON tasks (priority);

-- Seed data for testing
INSERT INTO tasks (title, description, completed, priority, due_date) VALUES
    ('Set up Azure DevOps project',    'Create org, project, and import repo',               0, 'high',   DATEADD(day,  1, GETUTCDATE())),
    ('Write backend Dockerfile',       'Multi-stage build with node:18-alpine',               1, 'high',   DATEADD(day, -1, GETUTCDATE())),
    ('Write frontend Dockerfile',      'Build React app, serve with Nginx',                   1, 'medium', DATEADD(day, -1, GETUTCDATE())),
    ('Provision Azure resources',      'ACR, App Service, SQL, Static Web App',               0, 'high',   DATEADD(day,  2, GETUTCDATE())),
    ('Create CI/CD pipeline',          'Backend and frontend YAML pipelines',                 0, 'high',   DATEADD(day,  3, GETUTCDATE())),
    ('Configure service connections',  'azure-service-connection and acr-service-connection', 0, 'medium', DATEADD(day,  4, GETUTCDATE())),
    ('Set up Git Flow branching',      'main, develop, feature/* branches',                   1, 'low',    DATEADD(day, -2, GETUTCDATE()));
