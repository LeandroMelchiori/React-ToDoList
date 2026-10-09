-- Initial PostgreSQL design. Review with the selected auth/storage adapter before execution.
BEGIN;

CREATE TABLE users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    handle text NOT NULL CHECK (handle ~ '^[a-z0-9_]{3,32}$'),
    display_name text NOT NULL CHECK (char_length(display_name) BETWEEN 1 AND 100),
    time_zone text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (handle)
);
CREATE TABLE auth_identities (
    issuer text NOT NULL,
    subject text NOT NULL,
    user_id uuid NOT NULL REFERENCES users(id),
    PRIMARY KEY (issuer, subject)
);
CREATE TABLE groups (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
    created_by uuid NOT NULL REFERENCES users(id),
    revision bigint NOT NULL DEFAULT 1 CHECK (revision > 0),
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE group_members (
    group_id uuid NOT NULL REFERENCES groups(id),
    user_id uuid NOT NULL REFERENCES users(id),
    role text NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    status text NOT NULL DEFAULT 'invited' CHECK (status IN ('invited', 'active')),
    invited_by uuid NOT NULL REFERENCES users(id),
    PRIMARY KEY (group_id, user_id)
);
CREATE TABLE friendships (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_low uuid NOT NULL REFERENCES users(id),
    user_high uuid NOT NULL REFERENCES users(id),
    requested_by uuid NOT NULL REFERENCES users(id),
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    revision bigint NOT NULL DEFAULT 1 CHECK (revision > 0),
    CHECK (user_low < user_high),
    CHECK (requested_by IN (user_low, user_high)),
    UNIQUE (user_low, user_high)
);
CREATE TABLE calendars (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id uuid REFERENCES users(id),
    group_id uuid REFERENCES groups(id),
    name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
    client_id text,
    time_zone text NOT NULL,
    revision bigint NOT NULL DEFAULT 1 CHECK (revision > 0),
    CHECK ((owner_user_id IS NOT NULL) <> (group_id IS NOT NULL)),
    UNIQUE (owner_user_id, client_id)
);
CREATE TABLE calendar_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    calendar_id uuid NOT NULL REFERENCES calendars(id),
    client_id text NOT NULL,
    time_zone text NOT NULL,
    content jsonb NOT NULL CHECK (jsonb_typeof(content) = 'object'),
    revision bigint NOT NULL DEFAULT 1 CHECK (revision > 0),
    updated_by uuid NOT NULL REFERENCES users(id),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,
    UNIQUE (calendar_id, client_id)
);
CREATE INDEX calendar_items_sync ON calendar_items (calendar_id, updated_at, id);
CREATE TABLE calendar_shares (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    calendar_id uuid NOT NULL REFERENCES calendars(id),
    grantee_user_id uuid REFERENCES users(id),
    grantee_group_id uuid REFERENCES groups(id),
    access text NOT NULL CHECK (access IN ('free_busy', 'details')),
    granted_by uuid NOT NULL REFERENCES users(id),
    revoked_at timestamptz,
    CHECK ((grantee_user_id IS NOT NULL) <> (grantee_group_id IS NOT NULL))
);
CREATE UNIQUE INDEX calendar_shares_person ON calendar_shares (calendar_id, grantee_user_id) WHERE revoked_at IS NULL AND grantee_user_id IS NOT NULL;
CREATE UNIQUE INDEX calendar_shares_group ON calendar_shares (calendar_id, grantee_group_id) WHERE revoked_at IS NULL AND grantee_group_id IS NOT NULL;
CREATE TABLE availability_windows (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id),
    time_zone text NOT NULL,
    weekdays smallint[] NOT NULL CHECK (cardinality(weekdays) > 0 AND weekdays <@ ARRAY[0,1,2,3,4,5,6]::smallint[]),
    start_time time NOT NULL,
    end_time time NOT NULL CHECK (end_time > start_time),
    valid_from date NOT NULL,
    valid_until date CHECK (valid_until IS NULL OR valid_until >= valid_from)
);
CREATE TABLE meetings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organizer_id uuid NOT NULL REFERENCES users(id),
    group_id uuid REFERENCES groups(id),
    title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
    starts_at timestamptz NOT NULL,
    ends_at timestamptz NOT NULL CHECK (ends_at > starts_at),
    status text NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed', 'confirmed', 'canceled')),
    revision bigint NOT NULL DEFAULT 1 CHECK (revision > 0)
);
CREATE TABLE meeting_participants (
    meeting_id uuid NOT NULL REFERENCES meetings(id),
    user_id uuid NOT NULL REFERENCES users(id),
    response text NOT NULL DEFAULT 'invited' CHECK (response IN ('invited', 'accepted', 'declined')),
    PRIMARY KEY (meeting_id, user_id)
);
CREATE INDEX meetings_window ON meetings (starts_at, ends_at) WHERE status <> 'canceled';
CREATE TABLE idempotency_records (
    actor_id uuid NOT NULL REFERENCES users(id),
    operation_id uuid NOT NULL,
    request_hash text NOT NULL,
    response jsonb NOT NULL,
    expires_at timestamptz NOT NULL,
    PRIMARY KEY (actor_id, operation_id)
);
CREATE TABLE sync_heads (
    user_id uuid PRIMARY KEY REFERENCES users(id),
    revision bigint NOT NULL DEFAULT 0 CHECK (revision >= 0)
);
CREATE TABLE sync_changes (
    user_id uuid NOT NULL REFERENCES users(id),
    revision bigint NOT NULL CHECK (revision > 0),
    entity_type text NOT NULL,
    entity_id uuid NOT NULL,
    operation text NOT NULL CHECK (operation IN ('upsert', 'delete', 'invalidate')),
    payload jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, revision)
);
CREATE TABLE account_entitlements (
    user_id uuid PRIMARY KEY REFERENCES users(id),
    plan_code text NOT NULL DEFAULT 'pilot',
    limits jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(limits) = 'object')
);

-- No public/client policies yet: ordinary roles remain closed until authorization is implemented.
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendars ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_windows ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE idempotency_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_heads ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_entitlements ENABLE ROW LEVEL SECURITY;

COMMIT;
