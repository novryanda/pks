"use client";

import { Button } from "@/components/ui/button";
import { buildPaginationItems } from "@/lib/pagination";

type TablePaginationProps = {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    pageStart: number;
    pageEnd: number;
    onPageChange: (page: number) => void;
};

export function TablePagination({
    currentPage,
    totalPages,
    totalItems,
    pageStart,
    pageEnd,
    onPageChange,
}: TablePaginationProps) {
    if (totalItems <= 0) return null;

    const paginationItems = buildPaginationItems(currentPage, totalPages);

    return (
        <div className="mt-4 flex flex-col gap-3 border-t pt-3 text-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="text-muted-foreground">
                Menampilkan <span className="font-semibold text-foreground">{pageStart}</span> -{" "}
                <span className="font-semibold text-foreground">{pageEnd}</span> dari{" "}
                <span className="font-semibold text-foreground">{totalItems}</span> data
            </div>
            {totalPages > 1 && (
                <div className="flex flex-wrap gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                    >
                        Sebelumnya
                    </Button>
                    {paginationItems.map((item) =>
                        typeof item === "number" ? (
                            <Button
                                key={item}
                                variant={item === currentPage ? "default" : "outline"}
                                size="sm"
                                onClick={() => onPageChange(item)}
                            >
                                {item}
                            </Button>
                        ) : (
                            <div
                                key={item}
                                className="flex items-center px-2 text-muted-foreground"
                            >
                                ...
                            </div>
                        )
                    )}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                    >
                        Selanjutnya
                    </Button>
                </div>
            )}
        </div>
    );
}
