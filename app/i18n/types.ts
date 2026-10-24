// Same keys as the German master, any text: a missing or extra key in another language is a
// type error. Functions (for counts and names) keep their parameters.
export type Translation<T> = {
  [K in keyof T]: T[K] extends (...args: infer A) => string
    ? (...args: A) => string
    : T[K] extends string
      ? string
      : Translation<T[K]>;
};
