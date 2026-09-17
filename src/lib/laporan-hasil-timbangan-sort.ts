import { formatTimeInJakarta } from "@/lib/date-time";

export const laporanHasilTimbanganSortFields = [
    "nomorPenerimaan",
    "jamMasuk",
    "jamKeluar",
] as const;

export type LaporanHasilTimbanganSortField =
    (typeof laporanHasilTimbanganSortFields)[number];

export type LaporanHasilTimbanganSortDirection = "asc" | "desc";

export type LaporanHasilTimbanganSortState = {
    sortBy: LaporanHasilTimbanganSortField | null;
    sortDirection: LaporanHasilTimbanganSortDirection;
};

type SortableLaporanHasilTimbanganItem = {
    nomorPenerimaan?: string | null;
    waktuTimbangBruto?: string | Date | null;
    waktuTimbangTarra?: string | Date | null;
};

const isSortField = (
    value: string | null | undefined
): value is LaporanHasilTimbanganSortField =>
    !!value &&
    (laporanHasilTimbanganSortFields as readonly string[]).includes(value);

export const parseLaporanHasilTimbanganSort = (
    sortBy: string | null | undefined,
    sortDirection: string | null | undefined
): LaporanHasilTimbanganSortState => {
    if (!isSortField(sortBy)) {
        return {
            sortBy: null,
            sortDirection: "asc" as LaporanHasilTimbanganSortDirection,
        };
    }

    return {
        sortBy,
        sortDirection:
            sortDirection === "desc" ? "desc" : "asc",
    };
};

const compareNullableValues = (
    left: string,
    right: string,
    direction: LaporanHasilTimbanganSortDirection,
    options?: Intl.CollatorOptions
) => {
    const leftHasValue = left.trim().length > 0;
    const rightHasValue = right.trim().length > 0;

    if (!leftHasValue && !rightHasValue) return 0;
    if (!leftHasValue) return 1;
    if (!rightHasValue) return -1;

    const comparison = left.localeCompare(right, "id-ID", options);
    return direction === "asc" ? comparison : comparison * -1;
};

const getComparableValue = (
    item: SortableLaporanHasilTimbanganItem,
    sortBy: LaporanHasilTimbanganSortField
) => {
    switch (sortBy) {
        case "jamMasuk":
            return formatTimeInJakarta(item.waktuTimbangBruto, { fallback: "" });
        case "jamKeluar":
            return formatTimeInJakarta(item.waktuTimbangTarra, { fallback: "" });
        case "nomorPenerimaan":
        default:
            return item.nomorPenerimaan?.trim() || "";
    }
};

export const sortLaporanHasilTimbangan = <
    T extends SortableLaporanHasilTimbanganItem,
>(
    items: T[],
    sortBy: LaporanHasilTimbanganSortField | null,
    sortDirection: LaporanHasilTimbanganSortDirection
) => {
    if (!sortBy) {
        return [...items];
    }

    return [...items].sort((left, right) => {
        const primaryComparison = compareNullableValues(
            getComparableValue(left, sortBy),
            getComparableValue(right, sortBy),
            sortDirection,
            sortBy === "nomorPenerimaan"
                ? { numeric: true, sensitivity: "base" }
                : undefined
        );

        if (primaryComparison !== 0) {
            return primaryComparison;
        }

        return compareNullableValues(
            left.nomorPenerimaan?.trim() || "",
            right.nomorPenerimaan?.trim() || "",
            "asc",
            { numeric: true, sensitivity: "base" }
        );
    });
};
