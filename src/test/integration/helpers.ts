import * as vscode from 'vscode';

/** Opens a C# document with `content`, placing the cursor at the '|' marker. */
export async function openCSharp(content: string, language = 'csharp'): Promise<vscode.TextEditor> {
    const offset = content.indexOf('|');
    const document = await vscode.workspace.openTextDocument({ language, content: content.replace('|', '') });
    const editor = await vscode.window.showTextDocument(document);
    const position = document.positionAt(offset);
    editor.selection = new vscode.Selection(position, position);
    return editor;
}

/** Returns the editor text with a '|' marker at the cursor. */
export function textWithCursor(editor: vscode.TextEditor): string {
    const text = editor.document.getText();
    const offset = editor.document.offsetAt(editor.selection.active);
    return text.slice(0, offset) + '|' + text.slice(offset);
}

export function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/** Waits until `condition` holds or `timeout` ms pass; returns whether it held. */
export async function waitFor(condition: () => boolean, timeout = 2000): Promise<boolean> {
    const end = Date.now() + timeout;
    while (!condition()) {
        if (Date.now() > end) return false;
        await delay(20);
    }
    return true;
}

/** Closes every editor, discarding changes so no save prompt shows up. */
export async function closeAllEditors(): Promise<void> {
    for (let i = 0; i < 50 && vscode.window.visibleTextEditors.length > 0; i++) {
        await vscode.commands.executeCommand('workbench.action.revertAndCloseActiveEditor');
    }
}
