export type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
};

export type ListResult<T> = {
  data: T[];
  meta: PaginationMeta;
};

export type ListQuery = {
  page?: number;
  pageSize?: number;
};

export function paginate<T>(items: T[], query: ListQuery = {}): ListResult<T> {
  const pageSize = Math.max(1, query.pageSize ?? Math.max(items.length, 1));
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const page = Math.min(Math.max(1, query.page ?? 1), pageCount);
  const start = (page - 1) * pageSize;

  return {
    data: items.slice(start, start + pageSize),
    meta: { page, pageSize, total: items.length },
  };
}
