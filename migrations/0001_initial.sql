PRAGMA foreign_keys = ON;

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL COLLATE NOCASE UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('family','sitter','operations','admin')),
  status TEXT NOT NULL DEFAULT 'pending_email' CHECK (status IN ('pending_email','active','suspended','deleted')),
  email_verified_at TEXT,
  session_version INTEGER NOT NULL DEFAULT 1,
  failed_login_count INTEGER NOT NULL DEFAULT 0,
  locked_until TEXT,
  last_login_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  csrf_hash TEXT NOT NULL,
  session_version INTEGER NOT NULL,
  ip_hash TEXT,
  user_agent TEXT,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL
);
CREATE INDEX sessions_user_idx ON sessions(user_id);
CREATE INDEX sessions_expiry_idx ON sessions(expires_at);

CREATE TABLE auth_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  purpose TEXT NOT NULL CHECK (purpose IN ('verify_email','reset_password')),
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  used_at TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE sitter_profiles (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  public_code TEXT UNIQUE,
  avatar TEXT NOT NULL DEFAULT 'heron' CHECK (avatar IN ('heron','pelican','manatee','turtle','dolphin','flamingo','crab','owl')),
  display_name TEXT NOT NULL,
  phone TEXT,
  bio TEXT,
  home_area TEXT,
  service_areas_json TEXT NOT NULL DEFAULT '[]',
  age_groups_json TEXT NOT NULL DEFAULT '[]',
  languages_json TEXT NOT NULL DEFAULT '[]',
  has_vehicle INTEGER NOT NULL DEFAULT 0 CHECK (has_vehicle IN (0,1)),
  can_transport_children INTEGER NOT NULL DEFAULT 0 CHECK (can_transport_children IN (0,1)),
  first_aid_expires_at TEXT,
  screening_status TEXT NOT NULL DEFAULT 'draft' CHECK (screening_status IN ('draft','submitted','under_review','approved','rejected','suspended')),
  availability_timezone TEXT NOT NULL DEFAULT 'America/New_York',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE family_profiles (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  public_code TEXT UNIQUE,
  household_name TEXT NOT NULL,
  phone TEXT,
  default_area TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE children (
  id TEXT PRIMARY KEY,
  family_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  birth_year INTEGER CHECK (birth_year BETWEEN 2005 AND 2100),
  care_notes TEXT,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0,1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX children_family_idx ON children(family_user_id);

CREATE TABLE saved_locations (
  id TEXT PRIMARY KEY,
  family_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  address_line TEXT NOT NULL,
  area TEXT NOT NULL,
  access_notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE weekly_availability (
  id TEXT PRIMARY KEY,
  sitter_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  weekday INTEGER NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  start_minute INTEGER NOT NULL CHECK (start_minute BETWEEN 0 AND 1439),
  end_minute INTEGER NOT NULL CHECK (end_minute BETWEEN 1 AND 1440),
  CHECK (start_minute < end_minute)
);
CREATE INDEX weekly_availability_sitter_idx ON weekly_availability(sitter_user_id, weekday);

CREATE TABLE availability_exceptions (
  id TEXT PRIMARY KEY,
  sitter_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  starts_at TEXT NOT NULL,
  ends_at TEXT NOT NULL,
  available INTEGER NOT NULL CHECK (available IN (0,1)),
  reason TEXT,
  created_at TEXT NOT NULL,
  CHECK (starts_at < ends_at)
);
CREATE INDEX availability_exceptions_sitter_idx ON availability_exceptions(sitter_user_id, starts_at, ends_at);

CREATE TABLE verification_items (
  id TEXT PRIMARY KEY,
  sitter_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('identity','references','background','first_aid','interview','orientation')),
  status TEXT NOT NULL CHECK (status IN ('pending','verified','rejected','expired')),
  expires_at TEXT,
  note TEXT,
  reviewed_by TEXT REFERENCES users(id),
  reviewed_at TEXT,
  created_at TEXT NOT NULL,
  UNIQUE(sitter_user_id, kind)
);

CREATE TABLE sitter_notes (
  id TEXT PRIMARY KEY,
  sitter_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  author_user_id TEXT NOT NULL REFERENCES users(id),
  note TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE bookings (
  id TEXT PRIMARY KEY,
  public_code TEXT NOT NULL UNIQUE,
  family_user_id TEXT NOT NULL REFERENCES users(id),
  assigned_sitter_user_id TEXT REFERENCES users(id),
  location_id TEXT REFERENCES saved_locations(id),
  area TEXT NOT NULL,
  starts_at TEXT NOT NULL,
  ends_at TEXT NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'America/New_York',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','requested','matching','offered','confirmed','in_progress','completed','cancelled','expired')),
  transport_required INTEGER NOT NULL DEFAULT 0 CHECK (transport_required IN (0,1)),
  notes TEXT,
  cancellation_reason TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK (starts_at < ends_at)
);
CREATE INDEX bookings_family_idx ON bookings(family_user_id, starts_at);
CREATE INDEX bookings_sitter_idx ON bookings(assigned_sitter_user_id, starts_at, ends_at);
CREATE INDEX bookings_status_idx ON bookings(status, starts_at);

CREATE TABLE booking_children (
  booking_id TEXT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  child_id TEXT NOT NULL REFERENCES children(id),
  PRIMARY KEY (booking_id, child_id)
);

CREATE TABLE booking_proposals (
  id TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  sitter_user_id TEXT NOT NULL REFERENCES users(id),
  rank INTEGER NOT NULL,
  score INTEGER NOT NULL,
  reasons_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','offered','accepted','declined','expired','withdrawn')),
  offered_at TEXT,
  responded_at TEXT,
  expires_at TEXT,
  created_at TEXT NOT NULL,
  UNIQUE(booking_id, sitter_user_id)
);
CREATE INDEX booking_proposals_sitter_idx ON booking_proposals(sitter_user_id, status);

CREATE TABLE booking_status_history (
  id TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  actor_user_id TEXT REFERENCES users(id),
  reason TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE incidents (
  id TEXT PRIMARY KEY,
  public_code TEXT NOT NULL UNIQUE,
  booking_id TEXT REFERENCES bookings(id),
  reporter_user_id TEXT NOT NULL REFERENCES users(id),
  severity TEXT NOT NULL CHECK (severity IN ('low','medium','high','critical')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','investigating','resolved','closed')),
  summary TEXT NOT NULL,
  details TEXT NOT NULL,
  assigned_to TEXT REFERENCES users(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  resolved_at TEXT
);

CREATE TABLE audit_logs (
  id TEXT PRIMARY KEY,
  actor_user_id TEXT REFERENCES users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  ip_hash TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX audit_entity_idx ON audit_logs(entity_type, entity_id, created_at);
CREATE INDEX audit_actor_idx ON audit_logs(actor_user_id, created_at);

CREATE TABLE account_deletion_requests (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested','approved','completed','rejected')),
  requested_at TEXT NOT NULL,
  reviewed_by TEXT REFERENCES users(id),
  reviewed_at TEXT,
  completed_at TEXT,
  note TEXT
);

CREATE TABLE notification_outbox (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  channel TEXT NOT NULL CHECK (channel IN ('email','sms')),
  template TEXT NOT NULL,
  recipient TEXT NOT NULL,
  payload_json TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','failed','suppressed')),
  attempts INTEGER NOT NULL DEFAULT 0,
  available_at TEXT NOT NULL,
  sent_at TEXT,
  last_error TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE rate_limit_buckets (
  key_hash TEXT NOT NULL,
  window_start INTEGER NOT NULL,
  count INTEGER NOT NULL,
  PRIMARY KEY (key_hash, window_start)
);

CREATE TABLE code_sequences (
  namespace TEXT PRIMARY KEY,
  value INTEGER NOT NULL
);
INSERT INTO code_sequences(namespace, value) VALUES ('family', 0), ('sitter', 0), ('booking', 0), ('incident', 0);

CREATE TRIGGER prevent_overlapping_sitter_assignment_insert
BEFORE INSERT ON bookings
WHEN NEW.assigned_sitter_user_id IS NOT NULL AND NEW.status IN ('confirmed','in_progress')
BEGIN
  SELECT CASE WHEN EXISTS (
    SELECT 1 FROM bookings b
    WHERE b.assigned_sitter_user_id = NEW.assigned_sitter_user_id
      AND b.id <> NEW.id
      AND b.status IN ('confirmed','in_progress')
      AND b.starts_at < NEW.ends_at AND b.ends_at > NEW.starts_at
  ) THEN RAISE(ABORT, 'SITTER_DOUBLE_BOOKING') END;
END;

CREATE TRIGGER prevent_overlapping_sitter_assignment_update
BEFORE UPDATE OF assigned_sitter_user_id, starts_at, ends_at, status ON bookings
WHEN NEW.assigned_sitter_user_id IS NOT NULL AND NEW.status IN ('confirmed','in_progress')
BEGIN
  SELECT CASE WHEN EXISTS (
    SELECT 1 FROM bookings b
    WHERE b.assigned_sitter_user_id = NEW.assigned_sitter_user_id
      AND b.id <> NEW.id
      AND b.status IN ('confirmed','in_progress')
      AND b.starts_at < NEW.ends_at AND b.ends_at > NEW.starts_at
  ) THEN RAISE(ABORT, 'SITTER_DOUBLE_BOOKING') END;
END;
