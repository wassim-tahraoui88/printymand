CREATE TYPE order_status AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELED');

CREATE TABLE "order" (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    status order_status NOT NULL DEFAULT 'PENDING',
    total DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE order_item (
    id UUID PRIMARY KEY,
    order_id UUID NOT NULL,
    design_id UUID,
    product_id UUID,
    quantity INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES "order"(id) ON DELETE CASCADE,
    FOREIGN KEY (design_id) REFERENCES design(id) ON DELETE SET NULL,
    FOREIGN KEY (product_id) REFERENCES product(id) ON DELETE SET NULL
);