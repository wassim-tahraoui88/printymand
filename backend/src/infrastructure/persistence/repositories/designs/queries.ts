export const INSERT_DESIGN = `
	INSERT INTO design (id, inventory_id, album_id, description, display_url, asset_url)
	VALUES ($1, $2, $3, $4, $5, $6);
`;

export const FIND_BY_ID = `
	SELECT
		id,
		inventory_id AS "inventoryId",
		album_id AS "albumId",
		display_url AS "displayUrl",
		name, description, nsfw,
		created_at AS "createdAt"
	FROM design
	WHERE id = $1;
`;
export const FIND_SUMMARY_BY_ID = `
	SELECT
		id,
		inventory_id AS "inventoryId",
		album_id AS "albumId",
		display_url AS "displayUrl",
		name, nsfw,
		created_at AS "createdAt"
	FROM design
	WHERE id = $1;
`;

export const FIND_ALL = `
    SELECT
        id,
	    inventory_id AS "inventoryId",
	    album_id AS "albumId",
        display_url AS "displayUrl",
        name, nsfw,
        created_at AS "createdAt"
    FROM design
    WHERE ($1::UUID IS NULL OR id < $1)
	ORDER BY id DESC
	LIMIT $2;
`;
export const FIND_ALL_BY_INVENTORY = `
    SELECT
        id,
        display_url AS "displayUrl",
        name, nsfw,
        created_at AS "createdAt"
    FROM design
    WHERE inventory_id = $1 AND ($2::UUID IS NULL OR id < $2)
	ORDER BY id DESC
	LIMIT $3;
`;
export const FIND_ALL_BY_ALBUM = `
    SELECT
        id,
        inventory_id AS "inventoryId",
        display_url AS "displayUrl",
        name, nsfw,
        created_at AS "createdAt"
    FROM design
    WHERE album_id = $1 AND ($2::UUID IS NULL OR id < $2)
	ORDER BY id DESC
	LIMIT $3;
`;