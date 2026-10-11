-- migrate:up
CREATE TABLE "user" (
	id text PRIMARY KEY,
	name text NOT NULL,
	email text NOT NULL UNIQUE,
	"emailVerified" boolean NOT NULL,
	image text,
	"createdAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
	"updatedAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
	role text,
	banned boolean,
	"banReason" text,
	"banExpires" timestamptz,
	"twoFactorEnabled" boolean
);

CREATE TABLE session (
	id text PRIMARY KEY,
	"expiresAt" timestamptz NOT NULL,
	token text NOT NULL UNIQUE,
	"createdAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
	"updatedAt" timestamptz NOT NULL,
	"ipAddress" text,
	"userAgent" text,
	"userId" text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
	"impersonatedBy" text,
	"activeOrganizationId" text
);

CREATE TABLE account (
	id text PRIMARY KEY,
	"accountId" text NOT NULL,
	"providerId" text NOT NULL,
	"userId" text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
	"accessToken" text,
	"refreshToken" text,
	"idToken" text,
	"accessTokenExpiresAt" timestamptz,
	"refreshTokenExpiresAt" timestamptz,
	scope text,
	password text,
	"createdAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
	"updatedAt" timestamptz NOT NULL
);

CREATE TABLE verification (
	id text PRIMARY KEY,
	identifier text NOT NULL,
	value text NOT NULL,
	"expiresAt" timestamptz NOT NULL,
	"createdAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
	"updatedAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "twoFactor" (
	id text PRIMARY KEY,
	secret text NOT NULL,
	"backupCodes" text NOT NULL,
	"userId" text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
	verified boolean,
	"failedVerificationCount" integer,
	"lockedUntil" timestamptz
);

CREATE TABLE organization (
	id text PRIMARY KEY,
	name text NOT NULL,
	slug text NOT NULL UNIQUE,
	logo text,
	"createdAt" timestamptz NOT NULL,
	metadata text
);

CREATE TABLE member (
	id text PRIMARY KEY,
	"organizationId" text NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
	"userId" text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
	role text NOT NULL,
	"createdAt" timestamptz NOT NULL
);

CREATE TABLE invitation (
	id text PRIMARY KEY,
	"organizationId" text NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
	email text NOT NULL,
	role text,
	status text NOT NULL,
	"expiresAt" timestamptz NOT NULL,
	"createdAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
	"inviterId" text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
);

CREATE INDEX "session_userId_idx" ON session ("userId");
CREATE INDEX "account_userId_idx" ON account ("userId");
CREATE INDEX verification_identifier_idx ON verification (identifier);
CREATE INDEX "twoFactor_secret_idx" ON "twoFactor" (secret);
CREATE INDEX "twoFactor_userId_idx" ON "twoFactor" ("userId");
CREATE INDEX "member_organizationId_idx" ON member ("organizationId");
CREATE INDEX "member_userId_idx" ON member ("userId");
CREATE INDEX "invitation_organizationId_idx" ON invitation ("organizationId");
CREATE INDEX invitation_email_idx ON invitation (email);

-- migrate:down
DROP TABLE invitation, member, organization, "twoFactor", verification, account, session, "user";
