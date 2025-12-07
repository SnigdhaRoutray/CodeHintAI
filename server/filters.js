// filters.js
// Prevents model from returning actual code or revealing full solutions.

export function postFilter(hint, level) {
    if (!hint) return "";

    // Remove code fences like ```...```
    hint = hint.replace(/```[\s\S]*?```/g, "");

    // Strong filtering for levels 1–3: remove common code tokens
    if (level < 4) {
        hint = hint.replace(/\b(return|for\s*\(|while\s*\(|console\.log|printf|def\s|\{|\}|\=\=|\+\+|--|=>|->)\b/gi, "[redacted]");
        // also remove language-style semicolons and arrow functions
        hint = hint.replace(/[;]/g, "");
    }

    // Limit length
    const words = hint.split(/\s+/);
    if (words.length > 120) {
        hint = words.slice(0, 120).join(" ") + " ...";
    }

    return hint.trim();
}
