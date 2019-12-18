import { expect } from 'chai';
import { describe, it } from 'mocha';

import { Cancellable, Timeout } from './cancellable';

describe('Cancellable', (): void => {
    describe('given a standalone cancellable', (): void => {
        describe('when the cancellable is not cancelled', (): void => {
            it('should allow the wrapped promise to resolve', async (): Promise<void> => {
                const cancellable = new Cancellable();
                const value = 'value';
                const promise = Promise.resolve(value);

                const promiseWithCancellable = cancellable.wrap(promise);

                await expect(promiseWithCancellable).to.eventually.equal(value);
            });

            it('should allow the wrapped promise to reject', async (): Promise<void> => {
                const cancellable = new Cancellable();
                const reason = 'Testing';
                const promise = Promise.reject(reason);

                const promiseWithCancellable = cancellable.wrap(promise);

                await expect(promiseWithCancellable).to.eventually.be.rejectedWith(reason);
            });
        });

        describe('when the cancellable is cancelled', (): void => {
            it('should not allow the wrapped promise to resolve', async (): Promise<void> => {
                const cancellable = new Cancellable();
                const promise = Promise.resolve('value');

                const promiseWithCancellable = cancellable.wrap(promise);
                const reason = 'Testing';
                cancellable.cancel(reason);

                await expect(promiseWithCancellable).to.eventually.be.rejectedWith(reason);
            });

            it('should not allow the wrapped promise to reject', async (): Promise<void> => {
                const cancellable = new Cancellable();
                const promise = Promise.reject('value');

                const promiseWithCancellable = cancellable.wrap(promise);
                const reason = 'Testing';
                cancellable.cancel(reason);

                await expect(promiseWithCancellable).to.eventually.be.rejectedWith(reason);
            });
        });
    });

    describe('given a chained cancellable', (): void => {
        describe('when the parent cancellable is cancelled', (): void => {
            it('should resolve the child cancellable', async (): Promise<void> => {
                const reason = 'Testing';
                const parentCancellable = new Cancellable();
                const childCancellable = new Cancellable(parentCancellable.cancellationPromise);

                parentCancellable.cancel(reason);

                const error = await childCancellable.cancellationPromise;

                expect(error.message).to.equal(reason);
            });

            it('should cause wrapped promises to reject', async (): Promise<void> => {
                const reason = 'Testing';
                const parentCancellable = new Cancellable();
                const childCancellable = new Cancellable(parentCancellable.cancellationPromise);

                parentCancellable.cancel(reason);

                const promiseWithCancellable = childCancellable.wrap(Promise.resolve('value'));

                await expect(promiseWithCancellable).to.eventually.be.rejectedWith(reason);
            });
        });

        describe('when the child cancellable is cancelled', (): void => {
            it('should not interrupt the parent cancellable', async (): Promise<void> => {
                const reason = 'Testing';
                const parentCancellable = new Cancellable();
                const childCancellable = new Cancellable(parentCancellable.cancellationPromise);

                childCancellable.cancel(reason);

                const parentValue = 'parent';
                const parentPromiseWithCancellable = parentCancellable.wrap(
                    Promise.resolve(parentValue),
                );
                const childPromiseWithCancellable = childCancellable.wrap(Promise.resolve('child'));

                await expect(parentPromiseWithCancellable).to.eventually.equal(parentValue);
                await expect(childPromiseWithCancellable).to.eventually.be.rejectedWith(reason);
            });

            it('should not interrupt sibling cancellables', async (): Promise<void> => {
                const reason = 'Testing';
                const parentCancellable = new Cancellable();
                const childCancellable = new Cancellable(parentCancellable.cancellationPromise);
                const siblingCancellable = new Cancellable(parentCancellable.cancellationPromise);

                childCancellable.cancel(reason);

                const parentValue = 'parent';
                const parentPromiseWithCancellable = parentCancellable.wrap(
                    Promise.resolve(parentValue),
                );
                const siblingValue = 'sibling';
                const siblingPromiseWithCancellable = siblingCancellable.wrap(
                    Promise.resolve(siblingValue),
                );
                const childPromiseWithCancellable = childCancellable.wrap(Promise.resolve('child'));

                await expect(parentPromiseWithCancellable).to.eventually.equal(parentValue);
                await expect(siblingPromiseWithCancellable).to.eventually.equal(siblingValue);
                await expect(childPromiseWithCancellable).to.eventually.be.rejectedWith(reason);
            });

            it('should cause wrapped promises to reject', async (): Promise<void> => {
                const reason = 'Testing';
                const parentCancellable = new Cancellable();
                const childCancellable = new Cancellable(parentCancellable.cancellationPromise);

                const promiseWithCancellable = childCancellable.wrap(Promise.resolve('value'));

                childCancellable.cancel(reason);

                await expect(promiseWithCancellable).to.eventually.be.rejected;
            });
        });

        describe('when no cancellable is cancelled', (): void => {
            it('should allow wrapped promises to resolve', async (): Promise<void> => {
                const parentCancellable = new Cancellable();
                const childCancellable = new Cancellable(parentCancellable.cancellationPromise);

                const value = 'value';
                const promiseWithCancellable = childCancellable.wrap(Promise.resolve(value));

                await expect(promiseWithCancellable).to.eventually.equal(value);
            });

            it('should allow wrapped promises to reject', async (): Promise<void> => {
                const parentCancellable = new Cancellable();
                const childCancellable = new Cancellable(parentCancellable.cancellationPromise);

                const value = 'value';
                const promiseWithCancellable = childCancellable.wrap(Promise.reject(value));

                await expect(promiseWithCancellable).to.eventually.be.rejectedWith(value);
            });
        });
    });

    describe('given a cancellable with a timeout', (): void => {
        describe('when the wrapped promise resolves before the timeout', (): void => {
            it('should allow the wrapped promise to resolve', async (): Promise<void> => {
                const value = 'value';
                const cancellable = new Cancellable().withTimeout(10000);
                const promiseWithCancellable = cancellable.wrap(Promise.resolve(value));

                await expect(promiseWithCancellable).to.eventually.equal(value);
            });

            it('should allow the wrapped promise to reject', async (): Promise<void> => {
                const value = 'value';
                const cancellable = new Cancellable().withTimeout(10000);
                const promiseWithCancellable = cancellable.wrap(Promise.reject(value));

                await expect(promiseWithCancellable).to.eventually.be.rejectedWith(value);
            });
        });

        describe('when the timeout is reached first', (): void => {
            it('should not allow the wrapped promise to resolve', async (): Promise<void> => {
                const cancellable = new Cancellable().withTimeout(1);
                const promiseWithCancellable = cancellable.wrap(new Promise((resolve): void => {
                    setTimeout((): void => {
                        resolve('value');
                    }, 1000);
                }));

                await expect(promiseWithCancellable).to.eventually
                    .be.rejected.with.instanceOf(Timeout);
            });

            it('should not allow the wrapped promise to reject', async (): Promise<void> => {
                const cancellable = new Cancellable().withTimeout(1);
                const promiseWithCancellable = cancellable.wrap(new Promise((_, reject): void => {
                    setTimeout((): void => {
                        reject('value');
                    }, 1000);
                }));

                await expect(promiseWithCancellable).to.eventually
                    .be.rejected.with.instanceOf(Timeout);
            });
        });
    });
});
