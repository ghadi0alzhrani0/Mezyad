BEGIN;

CREATE TABLE IF NOT EXISTS users (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 name VARCHAR(120) NOT NULL CHECK (length(trim(name)) > 0),
 email VARCHAR(254) NOT NULL UNIQUE CHECK (email = lower(email)),
 password_hash TEXT NOT NULL,
 role VARCHAR(10) NOT NULL DEFAULT 'USER' CHECK (role IN ('USER','ADMIN')),
 created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);
CREATE TABLE IF NOT EXISTS user_sessions (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 token_hash CHAR(64) NOT NULL UNIQUE,
 expires_at TIMESTAMPTZ NOT NULL
);
CREATE TABLE IF NOT EXISTS categories (
 id UUID PRIMARY KEY,
 name VARCHAR(80) NOT NULL UNIQUE
);
CREATE TABLE IF NOT EXISTS items (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 seller_id UUID NOT NULL REFERENCES users(id),
 category_id UUID NOT NULL REFERENCES categories(id),
 title VARCHAR(200) NOT NULL CHECK (length(trim(title)) > 0),
 description TEXT NOT NULL CHECK (length(trim(description)) > 0),
 category_fields JSONB NOT NULL CHECK (jsonb_typeof(category_fields) = 'object'),
 status VARCHAR(20) NOT NULL DEFAULT 'PENDING_REVIEW' CHECK (status IN ('PENDING_REVIEW','APPROVED','REJECTED')),
 review_reason TEXT,
 reviewed_by UUID REFERENCES users(id),
 reviewed_at TIMESTAMPTZ,
 CHECK ((status = 'PENDING_REVIEW' AND reviewed_by IS NULL AND reviewed_at IS NULL)
 OR (status IN ('APPROVED','REJECTED') AND reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL)),
 CHECK (status <> 'REJECTED' OR (review_reason IS NOT NULL AND length(trim(review_reason)) > 0))
);
CREATE TABLE IF NOT EXISTS item_images (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
 image_url TEXT NOT NULL UNIQUE
);
CREATE TABLE IF NOT EXISTS auctions (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 item_id UUID NOT NULL UNIQUE REFERENCES items(id),
 visibility VARCHAR(10) NOT NULL CHECK (visibility IN ('PUBLIC','PRIVATE')),
 access_code_hash CHAR(64),
 starting_price NUMERIC(18,2) NOT NULL CHECK (starting_price > 0),
 current_price NUMERIC(18,2) NOT NULL CHECK (current_price >= starting_price),
 minimum_increment NUMERIC(18,2) NOT NULL CHECK (minimum_increment > 0),
 start_time TIMESTAMPTZ NOT NULL,
 end_time TIMESTAMPTZ NOT NULL CHECK (end_time > start_time),
 status VARCHAR(10) NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED','ACTIVE','CLOSED')),
 CHECK ((visibility = 'PUBLIC' AND access_code_hash IS NULL) OR
 (visibility = 'PRIVATE' AND access_code_hash IS NOT NULL))
);
CREATE TABLE IF NOT EXISTS private_auction_access (
 auction_id UUID NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
 user_id UUID NOT NULL REFERENCES users(id),
 granted_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
 PRIMARY KEY (auction_id,user_id)
);
CREATE TABLE IF NOT EXISTS bid_commitments (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 auction_id UUID NOT NULL REFERENCES auctions(id),
 user_id UUID NOT NULL REFERENCES users(id),
 status VARCHAR(10) NOT NULL CHECK (status IN ('PENDING','APPROVED','REJECTED','FAILED')),
 sandbox_reference VARCHAR(120),
 created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
 UNIQUE (auction_id,user_id)
);
CREATE TABLE IF NOT EXISTS bids (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 auction_id UUID NOT NULL REFERENCES auctions(id),
 bidder_id UUID NOT NULL REFERENCES users(id),
 amount NUMERIC(18,2) NOT NULL CHECK (amount > 0),
 request_id UUID NOT NULL UNIQUE,
 created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
 UNIQUE (auction_id,id),
 FOREIGN KEY (auction_id,bidder_id) REFERENCES bid_commitments(auction_id,user_id)
);
CREATE TABLE IF NOT EXISTS auction_results (
 auction_id UUID PRIMARY KEY REFERENCES auctions(id),
 winner_bid_id UUID UNIQUE,
 closed_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
 FOREIGN KEY (auction_id,winner_bid_id) REFERENCES bids(auction_id,id)
);
CREATE INDEX IF NOT EXISTS sessions_by_user ON user_sessions(user_id,expires_at);
CREATE INDEX IF NOT EXISTS items_by_owner ON items(seller_id);
CREATE INDEX IF NOT EXISTS items_by_review ON items(status);
CREATE INDEX IF NOT EXISTS auctions_public_status ON auctions(visibility,status,end_time);
CREATE INDEX IF NOT EXISTS bids_by_auction_price ON bids(auction_id,amount DESC,created_at);
CREATE INDEX IF NOT EXISTS bids_by_user ON bids(bidder_id,auction_id);
CREATE INDEX IF NOT EXISTS images_by_item ON item_images(item_id);

COMMIT;
