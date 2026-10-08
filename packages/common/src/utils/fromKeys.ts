export function fromKeys<K extends string, V>(
  keys: K[] | readonly K[],
  fn: (key: K) => V,
): Record<K, V> {
  return Object.fromEntries(keys.map((key) => [key, fn(key)])) as Record<K, V>;
}
