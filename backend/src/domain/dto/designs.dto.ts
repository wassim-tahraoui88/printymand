interface CreateDesignDto {
    id: UUID;
    inventoryId?: UUID;
    albumId?: UUID;
	name: string;
	description?: string;
	assetUrl: string;
	displayUrl: string;
	nsfw: boolean;
}

interface DesignInventoryDto {
	id: UUID;
	ownerId: UUID;
	createdAt: Date;
}

interface DesignAlbumDto {
	id: UUID;
	ownerId: UUID;
	title: string;
	description: string;
}
interface DesignDto {
    id: UUID;
    inventoryId: UUID;
    albumId?: UUID;
	name: string;
	description: string;
	displayUrl: string;
	assetUrl: string;
	nsfw: boolean;
    createdAt: Date;
}

interface DesignSummaryDto {
    id: UUID;
	inventoryId: UUID;
	albumId: UUID;
    name: string;
    displayUrl: string;
	nsfw: boolean;
    createdAt: Date;
}