type DateInput = string | Date | null | undefined;

export const JAKARTA_TIME_ZONE = "Asia/Jakarta";
const JAKARTA_UTC_OFFSET_HOURS = 7;

type DatePartOptions = {
    year?: "2-digit" | "numeric";
    month?: "2-digit";
    day?: "2-digit";
    hour?: "2-digit";
    minute?: "2-digit";
    second?: "2-digit";
};

const toDate = (value: DateInput) => {
    if (!value) return null;

    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return null;

    return date;
};

const getDateParts = (value: DateInput, options: DatePartOptions) => {
    const date = toDate(value);
    if (!date) return null;

    const formatter = new Intl.DateTimeFormat("en-GB", {
        timeZone: JAKARTA_TIME_ZONE,
        hour12: false,
        ...options,
    });

    const parts = formatter.formatToParts(date);

    return parts.reduce<Record<string, string>>((result, part) => {
        if (part.type !== "literal") {
            result[part.type] = part.value;
        }

        return result;
    }, {});
};

export const formatDateInJakarta = (
    value: DateInput,
    options?: { fallback?: string; year?: "2-digit" | "numeric" }
) => {
    const fallback = options?.fallback ?? "-";
    const parts = getDateParts(value, {
        day: "2-digit",
        month: "2-digit",
        year: options?.year ?? "numeric",
    });

    if (!parts?.day || !parts.month || !parts.year) {
        return fallback;
    }

    return `${parts.day}/${parts.month}/${parts.year}`;
};

export const formatTimeInJakarta = (
    value: DateInput,
    options?: { fallback?: string; includeSeconds?: boolean }
) => {
    const fallback = options?.fallback ?? "-";
    const includeSeconds = options?.includeSeconds ?? false;
    const parts = getDateParts(value, {
        hour: "2-digit",
        minute: "2-digit",
        ...(includeSeconds ? { second: "2-digit" as const } : {}),
    });

    if (!parts?.hour || !parts.minute) {
        return fallback;
    }

    if (includeSeconds) {
        if (!parts.second) {
            return fallback;
        }

        return `${parts.hour}:${parts.minute}:${parts.second}`;
    }

    return `${parts.hour}:${parts.minute}`;
};

export const formatDateTimeInJakarta = (
    value: DateInput,
    options?: {
        fallback?: string;
        includeSeconds?: boolean;
        year?: "2-digit" | "numeric";
    }
) => {
    const fallback = options?.fallback ?? "-";
    const date = formatDateInJakarta(value, { fallback, year: options?.year });

    if (date === fallback) {
        return fallback;
    }

    const time = formatTimeInJakarta(value, {
        fallback,
        includeSeconds: options?.includeSeconds,
    });

    if (time === fallback) {
        return fallback;
    }

    return `${date} ${time}`;
};

export const parseJakartaDateBoundary = (
    value: string | null | undefined,
    options?: { endOfDay?: boolean }
) => {
    if (!value) return null;

    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) {
        return toDate(value);
    }

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const endOfDay = options?.endOfDay ?? false;

    return new Date(
        Date.UTC(
            year,
            month - 1,
            day,
            (endOfDay ? 23 : 0) - JAKARTA_UTC_OFFSET_HOURS,
            endOfDay ? 59 : 0,
            endOfDay ? 59 : 0,
            endOfDay ? 999 : 0
        )
    );
};

export const getJakartaDateKey = (value: DateInput) => {
    const parts = getDateParts(value, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    });

    if (!parts?.year || !parts.month || !parts.day) {
        return null;
    }

    return `${parts.year}-${parts.month}-${parts.day}`;
};

export const getJakartaDateParts = (value: DateInput) => {
    const parts = getDateParts(value, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    });

    if (!parts?.year || !parts.month || !parts.day) {
        return null;
    }

    return {
        year: Number(parts.year),
        month: Number(parts.month),
        day: Number(parts.day),
    };
};
