
export interface Maybe<T> {
    isNothing: boolean;
    isJust: boolean;

    map<U>(projection: ((val: T) => U)): Maybe<U>;
    chain<U>(projection: ((val: T) => Maybe<U>)): Maybe<U>;
    toString(): string;
    isEqual(other: Maybe<T>): boolean;
    get(): T;
    getOrElse(val: T): T;
    orElse(transformation: (() => Maybe<T>)): Maybe<T>;
    toJSON(): any
}

interface Just<T> extends Maybe<T> {
    value: T;
}

interface Nothing<T> extends Maybe<T> {

}

export function Nothing<T>() : Nothing<T>;
export function Just<T>(value: T) : Just<T>;
export function of<T>(value: T) : Just<T>;
export function fromNullable<T>(value: T) : Maybe<T>;

