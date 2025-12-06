/**
 * Simple client-side moderation utility to filter abusive language.
 * Returns { valid: boolean, warning: string | null }
 */

// List of regex patterns for common strong profanity and abusive terms.
// We use simple obfuscation checks (e.g. f*ck, s.h.i.t)
const BANNED_PATTERNS = [
    /f[u\*@\.]?c?k/i,
    /s[h\*@\.]?i?t/i,
    /b[i\*@\.]?t?c?h/i,
    /a[s\*@\.]?s/i,
    /d[i\*@\.]?c?k/i,
    /p[u\*@\.]?s?s?y/i,
    /c[u\*@\.]?n?t/i,
    /w[h\*@\.]?o?r?e/i,
    /s[l\*@\.]?u?t/i,
    /b[a\*@\.]?s?t?a?r?d/i,
    /n[i\*@\.]?g?g?e?r/i,
    /f[a\*@\.]?g?g?o?t/i,
    /k[y\*@\.]?s/i, // kill yourself
    /r[a\*@\.]?p?e/i,
    /idiot/i,
    /stupid/i,
    /dumb/i,
    /hate/i,
    /kill/i,
    /die/i
];

export const checkContent = (text) => {
    if (!text) return { valid: true, warning: null };

    const lower = text.toLowerCase();

    for (const pattern of BANNED_PATTERNS) {
        if (pattern.test(lower)) {
            return {
                valid: false,
                warning: "Your message contains language that may be harmful or inappropriate. Please revise it before posting — this is a safe community space. 🛡️"
            };
        }
    }

    return { valid: true, warning: null };
};
