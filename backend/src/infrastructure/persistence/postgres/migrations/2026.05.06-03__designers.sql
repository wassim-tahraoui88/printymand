CREATE TABLE designer_inventory (
    id UUID PRIMARY KEY,
    owner_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE designer_album (
    id UUID PRIMARY KEY,
    owner_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE design (
    id UUID PRIMARY KEY,
    inventory_id UUID NOT NULL,
    album_id UUID NULL,
    description VARCHAR(255) NOT NULL,
    displayUrl TEXT,
    asset_url TEXT,
    nsfw BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    FOREIGN KEY (inventory_id) REFERENCES designer_inventory(id) ON DELETE CASCADE,
    FOREIGN KEY (album_id) REFERENCES designer_album(id) ON DELETE SET NULL
);

CREATE TABLE design_tag (
    id UUID PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);
CREATE TABLE design_tags (
    design_id UUID NOT NULL,
    tag_id UUID NOT NULL,
    PRIMARY KEY (design_id, tag_id),
    FOREIGN KEY (design_id) REFERENCES design(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES design_tag(id) ON DELETE CASCADE
);