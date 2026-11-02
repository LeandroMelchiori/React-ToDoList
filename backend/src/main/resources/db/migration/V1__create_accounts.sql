CREATE TABLE users (
    id uuid PRIMARY KEY,
    email text NOT NULL UNIQUE CHECK (email = lower(email) AND char_length(email) BETWEEN 3 AND 254),
    handle text NOT NULL UNIQUE CHECK (handle ~ '^[a-z0-9_]{3,32}$'),
    display_name text NOT NULL CHECK (char_length(display_name) BETWEEN 1 AND 100),
    time_zone text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE auth_identities (
    issuer text NOT NULL CHECK (char_length(issuer) BETWEEN 1 AND 2048),
    subject text NOT NULL CHECK (char_length(subject) BETWEEN 1 AND 255),
    user_id uuid NOT NULL REFERENCES users(id),
    PRIMARY KEY (issuer, subject),
    UNIQUE (user_id)
);

CREATE TABLE calendars (
    id uuid PRIMARY KEY,
    owner_user_id uuid NOT NULL REFERENCES users(id),
    name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
    client_id text NOT NULL,
    time_zone text NOT NULL,
    revision bigint NOT NULL DEFAULT 1 CHECK (revision > 0),
    UNIQUE (owner_user_id, client_id)
);

CREATE TABLE access_invitations (
    id uuid PRIMARY KEY,
    token_hash char(64) NOT NULL UNIQUE,
    email text NOT NULL CHECK (email = lower(email) AND char_length(email) BETWEEN 3 AND 254),
    expires_at timestamptz NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    revoked_at timestamptz,
    redeemed_at timestamptz,
    redeemed_by uuid REFERENCES users(id),
    CHECK ((redeemed_at IS NULL) = (redeemed_by IS NULL))
);

CREATE TABLE enrollment_requests (
    issuer text NOT NULL,
    subject text NOT NULL,
    operation_id uuid NOT NULL,
    request_hash char(64) NOT NULL,
    user_id uuid NOT NULL REFERENCES users(id),
    PRIMARY KEY (issuer, subject, operation_id),
    FOREIGN KEY (issuer, subject) REFERENCES auth_identities(issuer, subject)
);

-- Identity/invitation bootstrap tables are server-only; private rows also require a transaction-local actor.
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE users FORCE ROW LEVEL SECURITY;
CREATE POLICY own_profile ON users
    USING (id = nullif(current_setting('taskflow.actor_id', true), '')::uuid)
    WITH CHECK (id = nullif(current_setting('taskflow.actor_id', true), '')::uuid);

ALTER TABLE calendars ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendars FORCE ROW LEVEL SECURITY;
CREATE POLICY own_calendar ON calendars
    USING (owner_user_id = nullif(current_setting('taskflow.actor_id', true), '')::uuid)
    WITH CHECK (owner_user_id = nullif(current_setting('taskflow.actor_id', true), '')::uuid);
