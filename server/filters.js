

export function postFilter(hint, level) {
    if (!hint) return "";

    hint = hint.replace(/```[\s\S]*?```/g, "");

    if (level < 4) {
        hint = hint.replace(/\b(return|for\s*\(|while\s*\(|console\.log|printf|def\s|\{|\}|\=\=|\+\+|--|=>|->)\b/gi, "[redacted]");
        hint = hint.replace(/[;]/g, "");
    }


    const words = hint.split(/\s+/);
    if (words.length > 120) {
        hint = words.slice(0, 120).join(" ") + " ...";
    }

    return hint.trim();
}
