import uuid from 'react-native-uuid';

/**
 * The single id-generation util for the app (STG-002). `taskRepository`
 * (and anything else that needs a fresh persisted-entity id) calls this
 * rather than hand-rolling a `Math.random()`/timestamp id — keeps id
 * generation in one place if the strategy ever changes.
 *
 * `react-native-uuid` is a zero-dependency, pure-JS RFC4122 v4 UUID
 * generator — no native linking, no `react-native-get-random-values`
 * polyfill required (unlike the `uuid` package, which needs that polyfill
 * for RN's `crypto.getRandomValues`). Chosen for that simplicity.
 *
 * `uuid.v4()` is typed `string | number[]` upstream because the library
 * can also fill a caller-supplied byte buffer (`v4(options, buf, offset)`);
 * called with no arguments (as here) it always returns the string form —
 * the cast documents that, it does not widen unsafely.
 */
export function newId(): string {
  // reason: react-native-uuid's `v4()` signature returns `number[]` only
  // when a `buf` argument is supplied; called with none it always returns
  // the string form.
  return uuid.v4() as string;
}
