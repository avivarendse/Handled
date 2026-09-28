CREATE TABLE IF NOT EXISTS businesses (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(150) NOT NULL,
  phone VARCHAR(30) NULL DEFAULT NULL,
  email VARCHAR(255) NULL DEFAULT NULL,
  address VARCHAR(255) NULL DEFAULT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  business_id INT UNSIGNED NOT NULL,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('MANAGER', 'TECHNICIAN') NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  INDEX idx_users_business_id (business_id),
  UNIQUE KEY uq_users_business_email (business_id, email),
  CONSTRAINT fk_users_business FOREIGN KEY (business_id)
    REFERENCES businesses (id) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS customers (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  business_id INT UNSIGNED NOT NULL,
  name VARCHAR(150) NOT NULL,
  phone VARCHAR(30) NULL DEFAULT NULL,
  email VARCHAR(255) NULL DEFAULT NULL,
  address VARCHAR(255) NULL DEFAULT NULL,
  customer_type ENUM('INDIVIDUAL', 'BUSINESS') NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  INDEX idx_customers_business_id (business_id),
  CONSTRAINT fk_customers_business FOREIGN KEY (business_id)
    REFERENCES businesses (id) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS jobs (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  business_id INT UNSIGNED NOT NULL,
  customer_id INT UNSIGNED NOT NULL,
  created_by INT UNSIGNED NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT NULL DEFAULT NULL,
  service_type VARCHAR(100) NULL DEFAULT NULL,
  status ENUM('NEW', 'SCHEDULED', 'IN_PROGRESS', 'FOLLOW_UP_REQUIRED', 'COMPLETED', 'CUSTOMER_CONFIRMED', 'CLOSED') NOT NULL,
  service_address VARCHAR(255) NOT NULL,
  invoice_number VARCHAR(100) NULL DEFAULT NULL,
  invoice_amount DECIMAL(10,2) NULL DEFAULT NULL,
  invoice_status ENUM('NOT_INVOICED', 'INVOICED', 'PAID') NOT NULL DEFAULT 'NOT_INVOICED',
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  INDEX idx_jobs_business_id (business_id),
  INDEX idx_jobs_customer_id (customer_id),
  INDEX idx_jobs_status (status),
  INDEX idx_jobs_created_at (created_at),
  CONSTRAINT fk_jobs_business FOREIGN KEY (business_id)
    REFERENCES businesses (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_jobs_customer FOREIGN KEY (customer_id)
    REFERENCES customers (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_jobs_created_by FOREIGN KEY (created_by)
    REFERENCES users (id) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS job_visits (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  job_id INT UNSIGNED NOT NULL,
  technician_id INT UNSIGNED NOT NULL,
  status ENUM('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED') NOT NULL,
  scheduled_start DATETIME NOT NULL,
  scheduled_end DATETIME NOT NULL,
  completion_summary TEXT NULL DEFAULT NULL,
  completed_at DATETIME NULL DEFAULT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  INDEX idx_job_visits_job_id (job_id),
  INDEX idx_job_visits_technician_id (technician_id),
  INDEX idx_job_visits_status (status),
  INDEX idx_job_visits_scheduled_start (scheduled_start),
  CONSTRAINT fk_job_visits_job FOREIGN KEY (job_id)
    REFERENCES jobs (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_job_visits_technician FOREIGN KEY (technician_id)
    REFERENCES users (id) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS visit_notes (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  visit_id INT UNSIGNED NOT NULL,
  created_by INT UNSIGNED NOT NULL,
  note TEXT NOT NULL,
  created_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  INDEX idx_visit_notes_visit_id (visit_id),
  CONSTRAINT fk_visit_notes_visit FOREIGN KEY (visit_id)
    REFERENCES job_visits (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_visit_notes_created_by FOREIGN KEY (created_by)
    REFERENCES users (id) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS visit_photos (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  visit_id INT UNSIGNED NOT NULL,
  uploaded_by INT UNSIGNED NOT NULL,
  file_url VARCHAR(500) NOT NULL,
  caption VARCHAR(255) NULL DEFAULT NULL,
  created_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  INDEX idx_visit_photos_visit_id (visit_id),
  CONSTRAINT fk_visit_photos_visit FOREIGN KEY (visit_id)
    REFERENCES job_visits (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_visit_photos_uploaded_by FOREIGN KEY (uploaded_by)
    REFERENCES users (id) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS visit_materials (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  visit_id INT UNSIGNED NOT NULL,
  name VARCHAR(150) NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit VARCHAR(30) NOT NULL,
  created_by INT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  INDEX idx_visit_materials_visit_id (visit_id),
  CONSTRAINT fk_visit_materials_visit FOREIGN KEY (visit_id)
    REFERENCES job_visits (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_visit_materials_created_by FOREIGN KEY (created_by)
    REFERENCES users (id) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS job_events (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  job_id INT UNSIGNED NOT NULL,
  visit_id INT UNSIGNED NULL DEFAULT NULL,
  user_id INT UNSIGNED NULL DEFAULT NULL,
  event_type ENUM('JOB_CREATED', 'VISIT_CREATED', 'TECHNICIAN_ASSIGNED', 'VISIT_STARTED', 'VISIT_COMPLETED', 'FOLLOW_UP_REQUIRED', 'CUSTOMER_CONFIRMED', 'JOB_CLOSED') NOT NULL,
  description VARCHAR(500) NULL DEFAULT NULL,
  created_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  INDEX idx_job_events_job_id (job_id),
  INDEX idx_job_events_visit_id (visit_id),
  INDEX idx_job_events_created_at (created_at),
  CONSTRAINT fk_job_events_job FOREIGN KEY (job_id)
    REFERENCES jobs (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_job_events_visit FOREIGN KEY (visit_id)
    REFERENCES job_visits (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_job_events_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS job_signoffs (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  job_id INT UNSIGNED NOT NULL,
  customer_name VARCHAR(150) NOT NULL,
  confirmed_at DATETIME NOT NULL,
  confirmation_type ENUM('TYPED_CONFIRMATION') NOT NULL,
  confirmation_data TEXT NULL DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_job_signoffs_job_id (job_id),
  CONSTRAINT fk_job_signoffs_job FOREIGN KEY (job_id)
    REFERENCES jobs (id) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB;