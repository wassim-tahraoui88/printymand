export const INSERT_USER = `
    INSERT INTO users (id, username, password_hash, first_name, last_name, phone_number, avatar_url, status)
    VALUES ($1, $2, $3, $4, $5, $6, '', 'PENDING');
`;

export const FIND_BY_ID = `
    SELECT id, username, first_name AS "firstName", last_name AS "lastName", phone_number AS "phoneNumber", avatar_url AS "avatarUrl",
           role, status, created_at AS "createdAt"
    FROM users
    WHERE id = $1;
`;

export const FIND_AUTH_BY_USERNAME = `
    SELECT id, password_hash AS "passwordHash", role, status
    FROM users
    WHERE username = $1;
`;