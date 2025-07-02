export function isNullOrUndefined(a: any) {
  return a === null || a === undefined;
}

export function alphanumericSort(
  a: string | null | undefined,
  b: string | null | undefined,
  isAsc: boolean = true,
) {
  if (isNullOrUndefined(a) && isNullOrUndefined(b)) {
    return 0;
  }
  if (isNullOrUndefined(a)) {
    return 1 * (isAsc ? 1 : -1);
  }
  if (isNullOrUndefined(b)) {
    return -1 * (isAsc ? 1 : -1);
  }

  return (
    // @ts-ignore
    a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }) *
    (isAsc ? 1 : -1)
  );
}
