/**
 * Utility to extract human-readable error messages from @solana/kit errors.
 *
 * Error 7618003 (FAILED_TO_EXECUTE_TRANSACTION_PLAN) is a wrapper —
 * the real cause is nested inside `context.transactionPlanResult` or `cause`.
 */

// Well-known Anchor custom error codes for the Higher program (6000–6005)
const HIGHER_PROGRAM_ERRORS: Record<number, string> = {
    6000: "GameOver — The game timer has expired",
    6001: "GameNotOver — The game timer has not expired yet",
    6002: "NotKing — Only the current king can claim the prize",
    6003: "GameNotActive — The game is not currently active",
    6004: "Overflow — Arithmetic overflow",
    6005: "InvalidMultiplier — Multiplier must be between 1.25x and 3x",
};

/**
 * Walk the error tree to find a custom program error code.
 * SolanaError objects can nest: error → cause → cause → ... with `context.code`.
 */
function findCustomCode(err: unknown): number | null {
    if (!err || typeof err !== "object") return null;

    const ctx = (err as Record<string, unknown>).context;
    if (ctx && typeof ctx === "object") {
        const code = (ctx as Record<string, unknown>).code;
        if (typeof code === "number") return code;
    }

    // Recurse into `cause`
    const cause = (err as Record<string, unknown>).cause;
    if (cause) return findCustomCode(cause);

    return null;
}

/**
 * Walk the error tree looking inside `transactionPlanResult` for failed entries.
 */
function findPlanResultError(err: unknown): string | null {
    if (!err || typeof err !== "object") return null;

    const ctx = (err as Record<string, unknown>).context;
    if (ctx && typeof ctx === "object") {
        const planResult = (ctx as Record<string, unknown>).transactionPlanResult;
        if (planResult && typeof planResult === "object") {
            // planResult is typically an array of { status, error } or similar
            const entries = Array.isArray(planResult) ? planResult : [planResult];
            for (const entry of entries) {
                if (entry && typeof entry === "object") {
                    // Look for nested errors in each entry
                    const entryError = (entry as Record<string, unknown>).error;
                    if (entryError) {
                        const msg = extractSolanaErrorMessage(entryError);
                        if (msg) return msg;
                    }
                    // Some plan results have a `cause`
                    const entryCause = (entry as Record<string, unknown>).cause;
                    if (entryCause) {
                        const msg = extractSolanaErrorMessage(entryCause);
                        if (msg) return msg;
                    }
                }
            }
        }
    }

    return null;
}

/**
 * Extract a user-friendly error message from any error, deeply unwrapping
 * @solana/kit's SolanaError wrapper hierarchy.
 */
export function extractSolanaErrorMessage(err: unknown): string {
    // 1. Try to find a Higher program custom error code anywhere in the chain
    const customCode = findCustomCode(err);
    if (customCode !== null && HIGHER_PROGRAM_ERRORS[customCode]) {
        return HIGHER_PROGRAM_ERRORS[customCode];
    }

    // 2. Try to extract a message from transactionPlanResult
    const planMsg = findPlanResultError(err);
    if (planMsg) return planMsg;

    // 3. Walk `cause` chain for the deepest meaningful message
    if (err && typeof err === "object") {
        const cause = (err as Record<string, unknown>).cause;
        if (cause && cause instanceof Error) {
            const deepMsg = extractSolanaErrorMessage(cause);
            if (deepMsg && deepMsg !== "Unknown error") return deepMsg;
        }
    }

    // 4. Fall back to err.message, stripping the unhelpful code prefix
    if (err instanceof Error) {
        let msg = err.message;
        // Strip the generic "Solana error #NNNNNNN" prefix to surface the actual text
        msg = msg.replace(/^Solana error #\d+;\s*/i, "");
        if (msg.length > 200) msg = msg.slice(0, 200) + "…";
        return msg || "Unknown error";
    }

    return String(err);
}
