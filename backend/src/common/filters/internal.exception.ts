export class InternalException extends Error {
    public status: number;

    constructor(message: string) {
        super(message);
        this.status = 500;
    }
}