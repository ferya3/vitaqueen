-- ---------------------------------------------------------------------------
-- VitaQueen schema, version 1.
--
-- Translatable columns hold JSON objects keyed by locale:
--   {"fa": "…", "en": "…", "ar": "…", "ru": "…"}
-- The locale set is fixed at four and no locale has fields of its own, so a
-- translation table per model would double every query for no benefit.
--
-- Anything a buyer or an auditor might quote back at the company (analysis
-- values, certificate numbers, report references) is a real typed column,
-- never free text inside a blob.
--
-- Timestamps are ISO-8601 UTC strings; booleans are 0/1.
-- ---------------------------------------------------------------------------

CREATE TABLE users (
  id                  INTEGER PRIMARY KEY,
  name                TEXT    NOT NULL,
  email               TEXT    NOT NULL UNIQUE COLLATE NOCASE,
  password_hash       TEXT    NOT NULL,
  role                TEXT    NOT NULL DEFAULT 'content_manager'
                        CHECK (role IN ('super_admin', 'admin', 'editor', 'content_manager')),
  is_active           INTEGER NOT NULL DEFAULT 1,
  -- TOTP secret and recovery-code hashes are encrypted with APP_SECRET, so a
  -- copy of this file on its own does not hand over anyone's second factor.
  totp_secret         TEXT,
  totp_confirmed_at   TEXT,
  -- Last accepted 30-second step, so an observed code cannot be replayed.
  totp_last_step      INTEGER,
  recovery_codes      TEXT,
  last_login_at       TEXT,
  last_login_ip       TEXT,
  created_at          TEXT    NOT NULL,
  updated_at          TEXT    NOT NULL
);

-- The cookie carries a random token; only its SHA-256 is stored here, so a
-- leaked database cannot be replayed as a live session.
CREATE TABLE sessions (
  id                  TEXT    PRIMARY KEY,
  user_id             INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  two_factor_passed   INTEGER NOT NULL DEFAULT 0,
  ip_address          TEXT,
  user_agent          TEXT,
  created_at          TEXT    NOT NULL,
  last_seen_at        TEXT    NOT NULL,
  expires_at          TEXT    NOT NULL
);
CREATE INDEX sessions_user ON sessions (user_id);
CREATE INDEX sessions_expiry ON sessions (expires_at);

-- Fixed-window counters for login, contact and upload limits. Kept in the
-- database rather than in memory so that pm2 restarts and cluster mode do not
-- reset an attacker's budget.
CREATE TABLE rate_limits (
  key                 TEXT    PRIMARY KEY,
  hits                INTEGER NOT NULL,
  reset_at            INTEGER NOT NULL
);

CREATE TABLE media (
  id                  INTEGER PRIMARY KEY,
  kind                TEXT    NOT NULL CHECK (kind IN ('image', 'document')),
  path                TEXT    NOT NULL UNIQUE,
  original_name       TEXT    NOT NULL,
  mime_type           TEXT    NOT NULL,
  size_bytes          INTEGER NOT NULL,
  width               INTEGER,
  height              INTEGER,
  checksum            TEXT    NOT NULL,
  alt                 TEXT,
  uploaded_by         INTEGER REFERENCES users (id) ON DELETE SET NULL,
  created_at          TEXT    NOT NULL
);
CREATE INDEX media_kind ON media (kind, created_at);
CREATE INDEX media_checksum ON media (checksum);

CREATE TABLE products (
  id                  INTEGER PRIMARY KEY,
  slug                TEXT    NOT NULL UNIQUE,
  sku                 TEXT    NOT NULL UNIQUE,
  name                TEXT    NOT NULL,
  tagline             TEXT,
  description         TEXT,
  packaging           TEXT,
  volume_ml           INTEGER NOT NULL,
  bottle_type         TEXT,
  cap_type            TEXT,
  ph                  REAL,
  tds                 INTEGER,
  shelf_life_months   INTEGER,
  units_per_case      INTEGER,
  cases_per_pallet    INTEGER,
  barcode             TEXT,
  datasheet_media_id  INTEGER REFERENCES media (id) ON DELETE SET NULL,
  model_3d_url        TEXT,
  featured            INTEGER NOT NULL DEFAULT 0,
  is_published        INTEGER NOT NULL DEFAULT 0,
  position            INTEGER NOT NULL DEFAULT 0,
  created_at          TEXT    NOT NULL,
  updated_at          TEXT    NOT NULL
);
CREATE INDEX products_listing ON products (is_published, position);

CREATE TABLE product_media (
  product_id          INTEGER NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  media_id            INTEGER NOT NULL REFERENCES media (id) ON DELETE CASCADE,
  position            INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (product_id, media_id)
);

CREATE TABLE certificates (
  id                  INTEGER PRIMARY KEY,
  slug                TEXT    NOT NULL UNIQUE,
  title               TEXT    NOT NULL,
  issuer              TEXT    NOT NULL,
  number              TEXT,
  scope               TEXT,
  issued_at           TEXT,
  valid_until         TEXT,
  logo_media_id       INTEGER REFERENCES media (id) ON DELETE SET NULL,
  document_media_id   INTEGER REFERENCES media (id) ON DELETE SET NULL,
  is_published        INTEGER NOT NULL DEFAULT 0,
  position            INTEGER NOT NULL DEFAULT 0,
  created_at          TEXT    NOT NULL,
  updated_at          TEXT    NOT NULL
);
CREATE INDEX certificates_listing ON certificates (is_published, position);

CREATE TABLE certificate_product (
  product_id          INTEGER NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  certificate_id      INTEGER NOT NULL REFERENCES certificates (id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, certificate_id)
);

CREATE TABLE water_analyses (
  id                  INTEGER PRIMARY KEY,
  sampling_point      TEXT    NOT NULL,
  sampled_at          TEXT    NOT NULL,
  laboratory          TEXT,
  report_number       TEXT,
  ph                  REAL    NOT NULL,
  tds                 INTEGER NOT NULL,
  hardness            INTEGER,
  temperature_c       REAL,
  document_media_id   INTEGER REFERENCES media (id) ON DELETE SET NULL,
  -- Seeded typical values. The public pages say so in the visitor's language
  -- for as long as this is set.
  is_sample           INTEGER NOT NULL DEFAULT 0,
  is_published        INTEGER NOT NULL DEFAULT 0,
  created_at          TEXT    NOT NULL,
  updated_at          TEXT    NOT NULL
);
CREATE INDEX water_analyses_listing ON water_analyses (is_published, sampled_at);

CREATE TABLE water_analysis_values (
  water_analysis_id   INTEGER NOT NULL REFERENCES water_analyses (id) ON DELETE CASCADE,
  -- Matches the message keys under `source.minerals.*`, which is what lets the
  -- label be translated without a join.
  key                 TEXT    NOT NULL,
  value               REAL    NOT NULL,
  unit                TEXT    NOT NULL DEFAULT 'mg/L',
  limit_value         REAL,
  method              TEXT,
  position            INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (water_analysis_id, key)
);

-- One row, id = 1.
CREATE TABLE source_profile (
  id                  INTEGER PRIMARY KEY CHECK (id = 1),
  altitude_meters     INTEGER NOT NULL,
  latitude            REAL    NOT NULL,
  longitude           REAL    NOT NULL,
  source_type         TEXT    NOT NULL,
  aquifer_age         TEXT    NOT NULL,
  temperature_c       REAL    NOT NULL,
  ph                  REAL    NOT NULL,
  tds                 INTEGER NOT NULL,
  hardness            INTEGER NOT NULL,
  is_sample           INTEGER NOT NULL DEFAULT 0,
  updated_at          TEXT    NOT NULL
);

CREATE TABLE production_stages (
  id                  INTEGER PRIMARY KEY,
  key                 TEXT    NOT NULL UNIQUE,
  title               TEXT,
  body                TEXT,
  media_id            INTEGER REFERENCES media (id) ON DELETE SET NULL,
  video_webm_url      TEXT,
  video_mp4_url       TEXT,
  is_published        INTEGER NOT NULL DEFAULT 1,
  position            INTEGER NOT NULL DEFAULT 0,
  created_at          TEXT    NOT NULL,
  updated_at          TEXT    NOT NULL
);

CREATE TABLE news_articles (
  id                  INTEGER PRIMARY KEY,
  slug                TEXT    NOT NULL UNIQUE,
  title               TEXT    NOT NULL,
  excerpt             TEXT,
  body                TEXT,
  tags                TEXT,
  cover_media_id      INTEGER REFERENCES media (id) ON DELETE SET NULL,
  author_id           INTEGER REFERENCES users (id) ON DELETE SET NULL,
  published_at        TEXT,
  is_published        INTEGER NOT NULL DEFAULT 0,
  created_at          TEXT    NOT NULL,
  updated_at          TEXT    NOT NULL
);
CREATE INDEX news_listing ON news_articles (is_published, published_at);

CREATE TABLE pages (
  id                  INTEGER PRIMARY KEY,
  slug                TEXT    NOT NULL UNIQUE,
  title               TEXT    NOT NULL,
  body                TEXT,
  meta_description    TEXT,
  is_published        INTEGER NOT NULL DEFAULT 0,
  created_at          TEXT    NOT NULL,
  updated_at          TEXT    NOT NULL
);

CREATE TABLE distributors (
  id                  INTEGER PRIMARY KEY,
  company             TEXT    NOT NULL,
  region              TEXT    NOT NULL,
  country             TEXT    NOT NULL,
  city                TEXT,
  phone               TEXT,
  email               TEXT,
  website             TEXT,
  is_published        INTEGER NOT NULL DEFAULT 0,
  position            INTEGER NOT NULL DEFAULT 0,
  created_at          TEXT    NOT NULL,
  updated_at          TEXT    NOT NULL
);
CREATE INDEX distributors_listing ON distributors (is_published, country);

CREATE TABLE contact_messages (
  id                  INTEGER PRIMARY KEY,
  name                TEXT    NOT NULL,
  email               TEXT    NOT NULL,
  phone               TEXT,
  company             TEXT,
  topic               TEXT    NOT NULL,
  subject             TEXT    NOT NULL,
  message             TEXT    NOT NULL,
  locale              TEXT    NOT NULL,
  -- Kept for abuse investigation only, and stripped by the retention job.
  ip_address          TEXT,
  user_agent          TEXT,
  handled_at          TEXT,
  handled_by          INTEGER REFERENCES users (id) ON DELETE SET NULL,
  created_at          TEXT    NOT NULL
);
CREATE INDEX contact_messages_inbox ON contact_messages (handled_at, created_at);

-- Append-only from the application's point of view: nothing updates a row,
-- and only the retention job deletes.
CREATE TABLE audit_logs (
  id                  INTEGER PRIMARY KEY,
  user_id             INTEGER REFERENCES users (id) ON DELETE SET NULL,
  user_email          TEXT,
  action              TEXT    NOT NULL,
  resource_type       TEXT,
  resource_id         TEXT,
  details             TEXT,
  ip_address          TEXT,
  user_agent          TEXT,
  created_at          TEXT    NOT NULL
);
CREATE INDEX audit_logs_resource ON audit_logs (resource_type, resource_id);
CREATE INDEX audit_logs_time ON audit_logs (created_at);
CREATE INDEX audit_logs_action ON audit_logs (action);

-- Small key/value store for housekeeping (seed state, last prune run).
CREATE TABLE meta (
  key                 TEXT    PRIMARY KEY,
  value               TEXT    NOT NULL
);
