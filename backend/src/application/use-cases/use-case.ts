export interface UseCase<T, R> {
    execute(input: T): R | Promise<R>;
}