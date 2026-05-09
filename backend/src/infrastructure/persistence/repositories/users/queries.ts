export const INSERT_USER = `
    INSERT INTO users (id, email, password_hash, name, address, phone_number, role)
    VALUES ($1, $2, $3, $4, $5, $6, $7);
`;

export const FIND_BY_ID = `
    SELECT id, email, name, address, phone_number AS "phoneNumber", avatar_url AS "avatarUrl",
           role, status, created_at AS "createdAt"
    FROM users
    WHERE id = $1;
`;

export const FIND_AUTH_BY_EMAIL = `
    SELECT id, password_hash AS "passwordHash", role
    FROM users
    WHERE email = $1;
`;