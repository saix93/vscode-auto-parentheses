// Pure logic of the extension, kept free of the `vscode` module so it can be unit tested.

// Parameter types that receive a method group instead of a method call.
const DELEGATE_TYPE = /(^|\.)(Action|Func|Predicate|Comparison|Converter|UnityAction|AsyncCallback|Delegate|MulticastDelegate)\b|(Callback|Delegate|Handler)\s*(<|\?|$)/;

/** True if `type` is a delegate type, so the argument expects a method group. */
export function isDelegateType(type: string): boolean {
    return DELEGATE_TYPE.test(type);
}

/**
 * Returns the type part of a signature help parameter label such as "UnityAction<int> call".
 * The label is either the text itself or its [start, end) offsets inside `signatureLabel`.
 */
export function parameterType(signatureLabel: string, parameterLabel: string | [number, number]): string {
    let label = typeof parameterLabel === 'string' ? parameterLabel : signatureLabel.slice(parameterLabel[0], parameterLabel[1]);
    label = label.replace(/\s*=.*$/, '').trim();
    label = label.replace(/^((params|ref|in|out|this|scoped|readonly)\s+)+/, '');
    const lastSpace = label.lastIndexOf(' ');
    return lastSpace === -1 ? label : label.slice(0, lastSpace).trim();
}

/**
 * Returns why '()' must not be added after an accepted method name, or undefined if it must.
 * `before` is the line text before the name and `after` the line text after it.
 */
export function skipReason(before: string, after: string): string | undefined {
    if (/^\s*[(<]/.test(after)) return 'already followed by ( or <';
    if (/(\+=|-=)\s*([\w.]*\.)?$/.test(before)) return 'event subscription';
    if (/\bnameof\s*\(\s*([\w.]*\.)?$/.test(before)) return 'nameof';
    if (/\/\/|^\s*\*/.test(before)) return 'comment';
    return undefined;
}
