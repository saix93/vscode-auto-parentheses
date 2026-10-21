import * as vscode from 'vscode';
import { isDelegateType, parameterType, skipReason } from './parens';

let log: vscode.OutputChannel;

function labelText(label: string | vscode.CompletionItemLabel): string {
    return typeof label === 'string' ? label : label.label;
}

function signatureHelp(document: vscode.TextDocument, position: vscode.Position): Thenable<vscode.SignatureHelp | undefined> {
    return vscode.commands.executeCommand<vscode.SignatureHelp>('vscode.executeSignatureHelpProvider', document.uri, position);
}

// True if the argument being written at `position` is expected to be a delegate.
async function expectsDelegate(document: vscode.TextDocument, position: vscode.Position): Promise<boolean> {
    const help = await signatureHelp(document, position);
    if (!help || help.signatures.length === 0) return false;

    return help.signatures.some(signature => {
        const params = signature.parameters;
        if (params.length === 0) return false;
        const active = signature.activeParameter ?? help.activeParameter ?? 0;
        const type = parameterType(signature.label, params[Math.min(active, params.length - 1)].label);
        log.appendLine(`  parameter type: ${type}`);
        return isDelegateType(type);
    });
}

// True if every overload of the call at `position` takes no parameters.
async function hasNoParameters(document: vscode.TextDocument, position: vscode.Position): Promise<boolean> {
    const help = await signatureHelp(document, position);
    return !!help && help.signatures.length > 0 && help.signatures.every(s => s.parameters.length === 0);
}

async function completionKind(document: vscode.TextDocument, position: vscode.Position, word: string): Promise<vscode.CompletionItemKind | undefined> {
    const list = await vscode.commands.executeCommand<vscode.CompletionList>('vscode.executeCompletionItemProvider', document.uri, position);
    if (!list) return undefined;
    // Generic methods are listed as "Name<>", so they never match: the type argument comes first.
    const item = list.items.find(i => labelText(i.label) === word && i.kind === vscode.CompletionItemKind.Method)
        ?? list.items.find(i => labelText(i.label) === word);
    return item?.kind;
}

async function addParens(editor: vscode.TextEditor): Promise<void> {
    const document = editor.document;
    const version = document.version;
    const cursor = editor.selection.active;
    if (editor.selections.length !== 1 || !editor.selection.isEmpty) return;

    const wordRange = document.getWordRangeAtPosition(cursor, /@?[A-Za-z_]\w*/);
    if (!wordRange || !wordRange.end.isEqual(cursor)) return;
    const word = document.getText(wordRange);

    const line = document.lineAt(cursor.line).text;
    log.appendLine(`accepted "${word}"`);

    const reason = skipReason(line.slice(0, wordRange.start.character), line.slice(cursor.character));
    if (reason) return log.appendLine(`  skip: ${reason}`);

    const kind = await completionKind(document, cursor, word);
    log.appendLine(`  kind: ${kind === undefined ? 'not found' : vscode.CompletionItemKind[kind]}`);
    if (kind !== vscode.CompletionItemKind.Method) return;
    if (await expectsDelegate(document, cursor)) return log.appendLine('  skip: delegate argument');
    if (document.version !== version || vscode.window.activeTextEditor !== editor) return log.appendLine('  skip: document changed');

    // Typing '(' lets VS Code auto-close it and open the parameter hints.
    await vscode.commands.executeCommand('type', { text: '(' });
    log.appendLine('  added ()');

    const inside = editor.selection.active;
    if (document.lineAt(inside.line).text[inside.character] !== ')') return;
    if (await hasNoParameters(document, inside)) {
        const afterParens = inside.translate(0, 1);
        editor.selection = new vscode.Selection(afterParens, afterParens);
        await vscode.commands.executeCommand('closeParameterHints');
    }
}

async function acceptSuggestion(): Promise<void> {
    await vscode.commands.executeCommand('acceptSelectedSuggestion');
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document.languageId !== 'csharp') return;
    try {
        await addParens(editor);
    } catch (error) {
        log.appendLine(`error: ${error instanceof Error ? error.stack : error}`);
    }
}

export function activate(context: vscode.ExtensionContext): void {
    log = vscode.window.createOutputChannel('C# Auto Parens');
    context.subscriptions.push(log, vscode.commands.registerCommand('csharpAutoParens.acceptSuggestion', acceptSuggestion));
}

export function deactivate(): void {}
