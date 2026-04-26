export const INSERT_USER = `
    INSERT INTO users (username, password_hash, first_name, last_name, phone_number, avatar_url, status, created_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING id
`;