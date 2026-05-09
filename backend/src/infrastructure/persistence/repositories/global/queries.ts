export const FIND_SIMPLE_USER_BY_ID = `
    SELECT
        id,
        first_name AS "firstName",
        last_name AS "lastName",
        avatar_url AS "avatarUrl"
    FROM users
    WHERE id = $1;
`;