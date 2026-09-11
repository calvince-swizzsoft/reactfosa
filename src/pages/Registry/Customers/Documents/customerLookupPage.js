export function customerLookupPage(response, requestedPageSize = 20) {
  const page = response?.data ?? response?.Data ?? response;
  const items = Array.isArray(page) ? page : page?.PageCollection ?? page?.pageCollection ?? [];
  const pageSize = Number(page?.PageSize ?? page?.pageSize) || requestedPageSize;
  const count = Number(page?.ItemsCount ?? page?.itemsCount ?? items.length);
  const reportedPages = Number(page?.TotalPages ?? page?.totalPages);
  return {
    items,
    totalPages: Math.max(1, reportedPages > 0 ? reportedPages : Math.ceil(count / pageSize)),
  };
}
