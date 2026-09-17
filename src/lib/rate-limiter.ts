/**
 * Simple Memory-based Rate Limiter for Next.js API Routes
 * 
 * Note: In a distributed environment (e.g. Vercel, Multiple instances), 
 * this should use Redis or a similar shared store.
 */

type RateLimitInfo = {
    count: number;
    resetTime: number;
};


const cache = new Map<string, RateLimitInfo>();

export interface RateLimitConfig {
    limit: number;      // Maximum number of requests
    windowMs: number;   // Time window in milliseconds
}

export function rateLimit(key: string, config: RateLimitConfig) {
    const now = Date.now();
    const info = cache.get(key);

    if (!info || now > info.resetTime) {
        // New window
        const newInfo = {
            count: 1,
            resetTime: now + config.windowMs,
        };
        cache.set(key, newInfo);
        return {
            success: true,
            remaining: config.limit - 1,
            reset: newInfo.resetTime,
        };
    }

    if (info.count < config.limit) {
        // Within limit
        info.count++;
        return {
            success: true,
            remaining: config.limit - info.count,
            reset: info.resetTime,
        };
    }

    // Over limit
    return {
        success: false,
        remaining: 0,
        reset: info.resetTime,
    };
}

// Cleanup interval to prevent memory leaks
if (typeof setInterval !== 'undefined') {
    setInterval(() => {
        const now = Date.now();
        for (const [key, info] of cache.entries()) {
            if (now > info.resetTime) {
                cache.delete(key);
            }
        }
    }, 60000); // Clean up every minute
}
