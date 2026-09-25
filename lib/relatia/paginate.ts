import { relatiaFetch } from "./client";
import type { RelatiaPaginated } from "./types";

const DEFAULT_PAGE_SIZE = 100;

/**
 * Scorre tutte le pagine DRF (`next`) e concatena `results`.
 */
export async function fetchAllPages<T>(
  path: string,
  searchParams: Record<string, string | number | boolean | undefined | null> = {},
  pageSize = DEFAULT_PAGE_SIZE,
): Promise<{ items: T[]; count: number }> {
  const items: T[] = [];
  let page = 1;
  let count = 0;
  let hasNext = true;

  while (hasNext) {
    const data = await relatiaFetch<RelatiaPaginated<T>>(path, {
      searchParams: {
        ...searchParams,
        page,
        page_size: pageSize,
      },
    });

    count = data.count ?? items.length + data.results.length;
    items.push(...data.results);
    hasNext = Boolean(data.next);
    page += 1;

    // safety: evita loop se next è presente ma results vuoti
    if (!data.results.length) break;
  }

  return { items, count };
}

/**
 * Conteggio DRF economico: `page_size=1` e usa `count`.
 */
export async function fetchCount(
  path: string,
  searchParams: Record<string, string | number | boolean | undefined | null> = {},
): Promise<number> {
  const data = await relatiaFetch<RelatiaPaginated<unknown>>(path, {
    searchParams: {
      ...searchParams,
      page: 1,
      page_size: 1,
    },
  });
  return data.count ?? 0;
}
