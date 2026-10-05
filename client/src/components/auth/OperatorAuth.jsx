/* @jsx React.createElement */
// ============================================================================
// Operator sign-in.
//
// Citizens never see this. It gates the control-room actions that commit
// municipal resources: dispatching pumps, diverting traffic, running pipelines.
// ============================================================================

/** Focus trap + Escape handling, shared by every modal in the app. */
function useDialogBehaviour(open, onClose) {
    const dialogRef = useRef(null);

    useEffect(() => {
        if (!open) return undefined;

        const previouslyFocused = document.activeElement;
        const node = dialogRef.current;
        const selector = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

        const focusables = () => Array.from(node ? node.querySelectorAll(selector) : []);
        const first = focusables()[0];
        if (first) first.focus();

        const onKeyDown = (event) => {
            if (event.key === "Escape") {
                event.stopPropagation();
                onClose();
                return;
            }
            if (event.key !== "Tab") return;
            const items = focusables();
            if (items.length === 0) return;
            const firstItem = items[0];
            const lastItem = items[items.length - 1];
            if (event.shiftKey && document.activeElement === firstItem) {
                event.preventDefault();
                lastItem.focus();
            } else if (!event.shiftKey && document.activeElement === lastItem) {
                event.preventDefault();
                firstItem.focus();
            }
        };

        document.addEventListener("keydown", onKeyDown, true);
        return () => {
            document.removeEventListener("keydown", onKeyDown, true);
            if (previouslyFocused && previouslyFocused.focus) previouslyFocused.focus();
        };
    }, [open, onClose]);

    return dialogRef;
}

/** Accessible modal shell: role, label, backdrop, Escape, focus return. */
function Dialog({ open, onClose, title, description, children, labelledById }) {
    const dialogRef = useDialogBehaviour(open, onClose);
    if (!open) return null;

    const titleId = labelledById || `dialog-title-${title.replace(/\W+/g, "-").toLowerCase()}`;
    const descriptionId = `${titleId}-description`;

    return (
        <div className="fixed inset-0 z-[950] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                onClick={onClose}
                aria-hidden="true"
            />
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                aria-describedby={description ? descriptionId : undefined}
                className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 p-6"
            >
                <h2 id={titleId} className="text-lg font-bold text-slate-900">{title}</h2>
                {description && (
                    <p id={descriptionId} className="mt-1.5 text-sm text-slate-600 leading-relaxed">
                        {description}
                    </p>
                )}
                <div className="mt-4">{children}</div>
            </div>
        </div>
    );
}

/**
 * Confirmation step for anything that commits resources.
 *
 * "Send pump" and "Divert traffic" used to fire on a single tap with no undo.
 */
function ConfirmDialog({ request, onCancel, onConfirm }) {
    return (
        <Dialog
            open={Boolean(request)}
            onClose={onCancel}
            title={request ? request.title : ""}
            description={request ? request.description : ""}
        >
            {request && (
                <div>
                    <dl className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-sm space-y-1.5">
                        {(request.details || []).map((row) => (
                            <div key={row.label} className="flex justify-between gap-4">
                                <dt className="text-slate-600">{row.label}</dt>
                                <dd className="font-semibold text-slate-900 text-right">{row.value}</dd>
                            </div>
                        ))}
                    </dl>
                    <p className="mt-3 text-sm text-amber-900 bg-amber-50 border border-amber-300 rounded-xl p-3">
                        This action cannot be undone from this screen.
                    </p>
                    <div className="mt-5 flex items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="min-h-[44px] px-4 rounded-xl border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={onConfirm}
                            className="min-h-[44px] px-5 rounded-xl bg-red-700 hover:bg-red-800 text-white text-sm font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-900"
                        >
                            {request.confirmLabel || "Confirm"}
                        </button>
                    </div>
                </div>
            )}
        </Dialog>
    );
}

/** Sign-in form. Credentials go straight to the API; nothing is stored here. */
function OperatorLoginDialog({ open, onClose, onSignedIn }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const [busy, setBusy] = useState(false);

    const submit = async (event) => {
        event.preventDefault();
        setBusy(true);
        setError(null);
        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "same-origin",
                body: JSON.stringify({ username, password }),
            });
            const body = await response.json().catch(() => ({}));
            if (!response.ok) {
                setError(body.detail || "Sign-in failed. Check your credentials.");
                return;
            }
            setUsername("");
            setPassword("");
            onSignedIn(body.operator);
            onClose();
        } catch (_) {
            setError("Could not reach the server. Check your connection and try again.");
        } finally {
            setBusy(false);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            title="Control room sign-in"
            description="For municipal operators. Citizens do not need an account to check flood conditions."
        >
            <form onSubmit={submit} className="space-y-4">
                <div>
                    <label htmlFor="operator-username" className="block text-sm font-semibold text-slate-700">
                        Username
                    </label>
                    <input
                        id="operator-username"
                        name="username"
                        type="text"
                        autoComplete="username"
                        required
                        value={username}
                        onChange={(event) => setUsername(event.target.value)}
                        className="mt-1 w-full min-h-[44px] rounded-xl border border-slate-300 px-3 text-base text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-700"
                    />
                </div>
                <div>
                    <label htmlFor="operator-password" className="block text-sm font-semibold text-slate-700">
                        Password
                    </label>
                    <input
                        id="operator-password"
                        name="password"
                        type="password"
                        autoComplete="current-password"
                        required
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        className="mt-1 w-full min-h-[44px] rounded-xl border border-slate-300 px-3 text-base text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-700"
                    />
                </div>

                {error && (
                    <p role="alert" className="text-sm font-medium text-red-800 bg-red-50 border border-red-300 rounded-xl p-3">
                        {error}
                    </p>
                )}

                <div className="flex items-center justify-end gap-3 pt-1">
                    <button
                        type="button"
                        onClick={onClose}
                        className="min-h-[44px] px-4 rounded-xl border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={busy}
                        className="min-h-[44px] px-5 rounded-xl bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white text-sm font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-900"
                    >
                        {busy ? "Signing in…" : "Sign in"}
                    </button>
                </div>
            </form>
        </Dialog>
    );
}

/** Header control: shows who is signed in, or offers sign-in. */
function OperatorBadge({ operator, onSignIn, onSignOut }) {
    if (!operator) {
        return (
            <button
                type="button"
                onClick={onSignIn}
                className="min-h-[40px] px-3.5 rounded-full border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
            >
                Operator sign-in
            </button>
        );
    }
    return (
        <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-full bg-slate-100 border border-slate-300 text-xs font-semibold text-slate-800">
                {operator.display_name}
            </span>
            <button
                type="button"
                onClick={onSignOut}
                className="min-h-[40px] px-3 rounded-full border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
            >
                Sign out
            </button>
        </div>
    );
}

/** Session state, restored on load so a refresh does not sign you out. */
function useOperatorSession() {
    const [operator, setOperator] = useState(null);
    const [checked, setChecked] = useState(false);

    useEffect(() => {
        let cancelled = false;
        fetch("/api/auth/status", { credentials: "same-origin" })
            .then((response) => (response.ok ? response.json() : null))
            .then((body) => {
                if (cancelled || !body) return;
                setOperator(body.operator || null);
            })
            .catch(() => {})
            .finally(() => {
                if (!cancelled) setChecked(true);
            });
        return () => { cancelled = true; };
    }, []);

    const signOut = useCallback(async () => {
        try {
            await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
        } catch (_) {
            // Clearing local state is still correct if the request failed.
        }
        setOperator(null);
    }, []);

    return { operator, setOperator, signOut, checked };
}
