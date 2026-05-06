CREATE TYPE product_type AS ENUM (
    'all',
    'mug', 'phone_case',
    'pin', 'poster', 'sticker',
    'sleeve', 'hat', 'bag', 'totebag'
    'tshirt', 'hoodie', 'sweater', 'jacket', 'socks'
);
CREATE TYPE product_size AS ENUM ('xs', 's', 'm', 'l', 'xl');

CREATE TABLE printer_inventory (
    id UUID PRIMARY KEY,
    owner_id UUID NOT NULL,
    inventory_type product_type NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE product (
    id UUID PRIMARY KEY,
    inventory_id UUID NOT NULL,
    size product_size NOT NULL,
    type product_type NOT NULL,
    color CHAR(6) NOT NULL, -- Hex color code (e.g., 'FFFFFF' for white)
    price DECIMAL(10, 2) NOT NULL,
    quantity INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (inventory_id) REFERENCES printer_inventory(id) ON DELETE CASCADE
);