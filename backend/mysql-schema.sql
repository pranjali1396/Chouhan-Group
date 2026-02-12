-- MySQL Schema for Chouhan CRM
-- Run this in MySQL Workbench to create the database and tables

-- Create database
CREATE DATABASE IF NOT EXISTS chouhan_crm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE chouhan_crm;

-- ============================================
-- Table: users
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    role VARCHAR(50) NOT NULL COMMENT 'Admin or Salesperson',
    avatar_url TEXT,
    local_id VARCHAR(50) COMMENT 'Maps local frontend user IDs (e.g., user-1, admin-0) to database IDs',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_local_id (local_id),
    INDEX idx_users_role (role),
    INDEX idx_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: leads
-- ============================================
CREATE TABLE IF NOT EXISTS leads (
    id VARCHAR(36) PRIMARY KEY,
    customer_name VARCHAR(255) NOT NULL,
    mobile VARCHAR(20),
    email VARCHAR(255),
    status VARCHAR(50) DEFAULT 'New Lead',
    assigned_salesperson_id VARCHAR(36),
    lead_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    month VARCHAR(50),
    mode_of_enquiry VARCHAR(50) DEFAULT 'Digital',
    occupation VARCHAR(100),
    interested_project VARCHAR(255),
    interested_unit VARCHAR(100),
    temperature VARCHAR(20) COMMENT 'Hot, Warm, Cold',
    visit_status VARCHAR(20) DEFAULT 'No',
    visit_date DATE,
    next_follow_up_date DATE,
    last_remark TEXT,
    booking_status VARCHAR(50),
    is_read BOOLEAN DEFAULT FALSE,
    missed_visits_count INT DEFAULT 0,
    labels JSON COMMENT 'Array of label strings',
    budget VARCHAR(100),
    purpose VARCHAR(100),
    city VARCHAR(100),
    platform VARCHAR(50),
    source_website VARCHAR(100) DEFAULT 'website',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (assigned_salesperson_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_leads_status (status),
    INDEX idx_leads_assigned (assigned_salesperson_id),
    INDEX idx_leads_lead_date (lead_date DESC),
    INDEX idx_leads_next_followup (next_follow_up_date),
    INDEX idx_leads_customer_name (customer_name),
    INDEX idx_leads_mobile (mobile)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: notifications
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(36) PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    lead_id VARCHAR(36),
    lead_data JSON COMMENT 'Additional lead information',
    target_role VARCHAR(50) COMMENT 'Admin, Salesperson, etc.',
    target_user_id VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE,
    INDEX idx_notifications_target_role (target_role),
    INDEX idx_notifications_target_user_id (target_user_id),
    INDEX idx_notifications_created_at (created_at DESC),
    INDEX idx_notifications_is_read (is_read),
    INDEX idx_notifications_type (type),
    CONSTRAINT chk_notification_type CHECK (type IN ('new_lead', 'lead_assigned', 'lead_progress'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Sample Data (Optional - for testing)
-- ============================================

-- Insert sample admin user
-- INSERT INTO users (id, name, email, role, local_id) 
-- VALUES (UUID(), 'Admin User', 'admin@chouhangroup.com', 'Admin', 'admin-0');

-- Insert sample salesperson
-- INSERT INTO users (id, name, email, role, local_id) 
-- VALUES (UUID(), 'Sales Person', 'sales@chouhangroup.com', 'Salesperson', 'user-1');

-- ============================================
-- Verification Queries
-- ============================================

-- Check table structure
-- DESCRIBE users;
-- DESCRIBE leads;
-- DESCRIBE notifications;

-- Check row counts
-- SELECT COUNT(*) as user_count FROM users;
-- SELECT COUNT(*) as lead_count FROM leads;
-- SELECT COUNT(*) as notification_count FROM notifications;

-- Check indexes
-- SHOW INDEX FROM users;
-- SHOW INDEX FROM leads;
-- SHOW INDEX FROM notifications;
