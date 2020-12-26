export class NeverError extends Error {
  constructor(value: never) {
    console.log(value);
    super('Unreachable statement');
  }
}
