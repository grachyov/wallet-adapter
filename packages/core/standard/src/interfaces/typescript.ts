/** @internal */
export type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never;

/** @internal */
export type Extends<T, U extends T> = U;
