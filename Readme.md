# Cancellable

When promises were implemented they did not come with a built-in
mechanism to implement cancellation like you might see in some other
Future type implementations. Normally this isn't a huge issue but
there are definitely instances where you need to be able to stop a
promise from resolving/rejecting.

## Installation

Just use your favorite package manager to install.

```bash
npm install @theisleoffavalon/cancellable
yarn add @theisleoffavalon/cancellable
pnpm install @theisleoffavalon/cancellable
```

## Basic Usage

One example of a time where you want to be really careful about if a
promise will resolve is with React. In React you can't modify a
React component once it has become unmounted from the page. If you
have a component that renders a list of items that are retrieved from
a REST endpoint, you might start a request either on the first render
or right before it and then when the requests finishes render some
content based on the results. Something like this:

```tsx
import React, {
    FunctionComponent,
    ReactElement,
    useEffect,
    useState,
} from 'react';

const NameList: FunctionComponent = (): ReactElement => {
    const [ names, setNames ] = useState([]);

    useEffect((): void => {
        fetch('http://example.com/names')
            .then((response: Response) => {
                // You would normally handle errors and what not here

                return response.json();
            })
            .then(setNames);
    }, []);

    return (
        <ul>
            {names.map((name: string) => {
                return <li>{name}</li>;
            })}
        </ul>
    );
};
```

This will work fine up until you have a situation where the component
gets unmounted before the request resolves. In that situation you'll
get an exception from React when you try to update the state on an
unmounted component.

One solution to this problem is adding cancellation to promises. Using
this library you could rewrite this component like so:

```tsx
import React, {
    FunctionComponent,
    ReactElement,
    useEffect,
    useState,
} from 'react';

import { Cancellable } from '@theisleoffavalon/cancellable';

const NameList: FunctionComponent = (): ReactElement => {
    const [ names, setNames ] = useState([]);

    useEffect((): ((): void) => {
        const cancellable = new Cancellable();

        cancellable.wrap(fetch('http://example.com/names'))
            .then((response: Response) => {
                // You would normally handle errors and what not here

                return response.json();
            })
            .then(setNames);

        return (): void => {
            cancellable.cancel('React component unmounted');
        };
    }, []);

    return (
        <ul>
            {names.map((name: string) => {
                return <li>{name}</li>;
            })}
        </ul>
    );
};
```

Now if the component unmounts before the fetch resolves, the promise
is cancelled and nothing happens.

## With a timeout

Continuing on with the previous example, maybe you want to add some
extra handling in so that if a request takes too long that it gets
auto cancelled and rejected.

**Note that in a more realistic situation you would use a timeout when
you have multiple long running operations happening that you want to
stop if they're taking too long.**

```tsx
import React, {
    FunctionComponent,
    ReactElement,
    useEffect,
    useState,
} from 'react';

import { Cancellable } from '@theisleoffavalon/cancellable';

const NameList: FunctionComponent = (): ReactElement => {
    const [ names, setNames ] = useState([]);

    useEffect((): ((): void) => {
        const cancellable = new Cancellable().withTimeout(60000);

        cancellable.wrap(fetch('http://example.com/names'))
            .then((response: Response) => {
                // You would normally handle errors and what not here

                return response.json();
            })
            .then(setNames);

        return (): void => {
            cancellable.cancel('React component unmounted');
        };
    }, []);

    return (
        <ul>
            {names.map((name: string) => {
                return <li>{name}</li>;
            })}
        </ul>
    );
};
```

We've simply moved from `const cancellable = new Cancellable();` to
`const cancellable = new Cancellable().withTimeout(60000);` which will
automatically cancel the promise after one minute unless the promise
resolves on its own first.
