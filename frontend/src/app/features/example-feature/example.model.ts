/**
 * @description Full dto for fetching all details of a single item
 */
interface ExampleDto {
	id: string;
	property: string;
	anotherProperty: string;
	yetAnotherProperty: string;
}

/**
 * @description Summary dto for fetching smaller projections of data for big lists instead of all details
 */
interface ExampleSummaryDto {
	id: string;
	property: string;
}

/**
* @description DTO for creating a new item
 */
interface ExampleCreateDto {
	property: string;
	anotherProperty: string;
}