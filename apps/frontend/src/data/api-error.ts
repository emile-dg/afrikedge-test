export class ApiError extends Error {
    constructor(
        public readonly status: number,
        message: string,
        public readonly errors: {field: string; message: string}[] = [],
    ) {
        super(message)
        this.name = 'ApiError'
    }
}
