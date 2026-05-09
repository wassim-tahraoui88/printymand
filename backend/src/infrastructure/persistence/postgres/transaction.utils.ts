type Deferred<T = void> = {
    promise: Promise<void>;
    resolve: (value: T | PromiseLike<T>) => void;
    reject: (reason?: unknown) => void;
};

function createDeferred<T = void>(): Deferred<T> {
    let resolve!: () => void;
    let reject!: (err: unknown) => void;
    const promise = new Promise<void>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
}

export class CommitSignal {
    private readonly commitRequestedDeferred = createDeferred<void>();
    private readonly commitCompletedDeferred = createDeferred<void>();
    private requested = false;

    requestCommit() {
        if (this.requested) return Promise.resolve();
        this.requested = true;
        this.commitRequestedDeferred.resolve();
        return this.commitCompletedDeferred.promise;
    }
    get requestedCommit(): boolean {
        return this.requested;
    }
    async requestRollback(err: unknown) {
        if (this.requested) return;
        this.requested = true;
        this.commitRequestedDeferred.reject(err);
        await this.commitCompletedDeferred.promise;
    }

    async waitForCommitRequest() {
        await this.commitRequestedDeferred.promise;
    }
    async waitUntilCommitted() {
        await this.commitCompletedDeferred.promise;
    }

    markCommitted() {
        this.commitCompletedDeferred.resolve();
    }
    markCommitFailed(err: unknown) {
        this.commitCompletedDeferred.reject(err);
    }

    static create() {
        return new CommitSignal();
    }
}