export type PaginationItem = number | "ellipsis-left" | "ellipsis-right";

export const buildPaginationItems = (
    currentPage: number,
    totalPages: number,
    maxVisiblePages = 5
): PaginationItem[] => {
    if (totalPages <= 1) return [1];

    if (totalPages <= maxVisiblePages + 2) {
        return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const items: PaginationItem[] = [1];
    const halfWindow = Math.floor(maxVisiblePages / 2);

    let startPage = Math.max(2, currentPage - halfWindow);
    let endPage = Math.min(totalPages - 1, currentPage + halfWindow);

    if (currentPage <= halfWindow + 2) {
        startPage = 2;
        endPage = Math.min(totalPages - 1, maxVisiblePages + 1);
    } else if (currentPage >= totalPages - (halfWindow + 1)) {
        endPage = totalPages - 1;
        startPage = Math.max(2, totalPages - maxVisiblePages);
    }

    if (startPage > 2) {
        items.push("ellipsis-left");
    }

    for (let page = startPage; page <= endPage; page += 1) {
        items.push(page);
    }

    if (endPage < totalPages - 1) {
        items.push("ellipsis-right");
    }

    items.push(totalPages);

    return items;
};
