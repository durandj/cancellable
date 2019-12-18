export class Cancellation extends Error {
    constructor(message: string) {
        super(message);

        Object.setPrototypeOf(this, Cancellation.prototype);
    }
}

export class Timeout extends Error {
    constructor(message: string) {
        super(message);

        Object.setPrototypeOf(this, Timeout.prototype);
    }
}

export class Cancellable {
    private isCancelled = false;
    private resolve: (err: Cancellation) => void;
    private promise: Promise<Cancellation>;

    constructor(promise?: Promise<Cancellation>) {
        // We need to provide a default value and from experimentation
        // this value does get properly replaced very quickly so I'm
        // not too worried about throwing an exception or something.
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        this.resolve = (): void => {};

        this.promise = new Promise((resolve): void => {
            this.resolve = resolve;

            promise?.then((reason): void => {
                this.resolve(reason);
                this.isCancelled = true;
            })
        });
    }

    cancel(reason: string): void {
        this.resolve(new Cancellation(reason));
        this.isCancelled = true;
    }

    get cancellationPromise(): Promise<Cancellation> {
        return this.promise;
    }

    withTimeout(ms: number): Cancellable {
        return new Cancellable(new Promise((resolve): void => {
            const timeoutId = setTimeout((): void => {
                resolve(new Timeout(`Promise did not resolve after ${ms} ms`));
            }, ms);

            this.promise.then((reason): void => {
                resolve(reason);

                clearTimeout(timeoutId);
            });
        }));
    }

    wrap<Type>(promise: Promise<Type>): Promise<Type> {
        return new Promise((resolve, reject): void => {
            this.promise.then((reason): void => {
                reject(reason);
            });

            promise
                .then((value): void => {
                    if (this.isCancelled) {
                        return;
                    }

                    resolve(value);
                })
                .catch((err): void => {
                    if (this.isCancelled) {
                        return;
                    }

                    reject(err);
                });
        });
    }
}
