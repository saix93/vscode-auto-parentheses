import * as assert from 'node:assert/strict';
import * as vscode from 'vscode';
import { closeAllEditors, openCSharp, textWithCursor } from './helpers';

// Fake C# language server: a few members and the signatures of the methods that take arguments.
const MEMBERS: [string, vscode.CompletionItemKind][] = [
    ['Jump', vscode.CompletionItemKind.Method],
    ['TakeDamage', vscode.CompletionItemKind.Method],
    ['OnClick', vscode.CompletionItemKind.Method],
    ['position', vscode.CompletionItemKind.Property],
];

const SIGNATURES: Record<string, string[]> = {
    Jump: [],
    TakeDamage: ['int amount'],
    AddListener: ['UnityAction call'],
};

function provideSignatureHelp(document: vscode.TextDocument, position: vscode.Position): vscode.SignatureHelp | undefined {
    const before = document.lineAt(position.line).text.slice(0, position.character);
    const call = /(\w+)\([^()]*$/.exec(before);
    const parameters = call && SIGNATURES[call[1]];
    if (!call || !parameters) return undefined;

    const signature = new vscode.SignatureInformation(`void ${call[1]}(${parameters.join(', ')})`);
    signature.parameters = parameters.map(p => new vscode.ParameterInformation(p));
    const help = new vscode.SignatureHelp();
    help.signatures = [signature];
    help.activeSignature = 0;
    help.activeParameter = 0;
    return help;
}

suite('Auto Parens', () => {
    const providers: vscode.Disposable[] = [];

    suiteSetup(async () => {
        providers.push(
            vscode.languages.registerCompletionItemProvider('csharp', {
                provideCompletionItems: () => MEMBERS.map(([name, kind]) => new vscode.CompletionItem(name, kind)),
            }),
            vscode.languages.registerSignatureHelpProvider('csharp', { provideSignatureHelp }, '(', ','),
        );
        await vscode.extensions.getExtension('Saix93.csharp-auto-parens')!.activate();
    });

    suiteTeardown(() => providers.forEach(p => p.dispose()));

    teardown(closeAllEditors);

    // Runs the accept command with the name before the '|' marker as the accepted suggestion.
    async function accept(content: string): Promise<string> {
        const editor = await openCSharp(content);
        await vscode.commands.executeCommand('csharpAutoParens.acceptSuggestion');
        return textWithCursor(editor);
    }

    test('adds parentheses and leaves the cursor inside for methods with parameters', async () => {
        assert.equal(await accept('player.TakeDamage|'), 'player.TakeDamage(|)');
    });

    test('moves the cursor past the parentheses for methods without parameters', async () => {
        assert.equal(await accept('player.Jump|'), 'player.Jump()|');
    });

    test('does not add parentheses to properties', async () => {
        assert.equal(await accept('transform.position|'), 'transform.position|');
    });

    test('does not add parentheses to delegate arguments', async () => {
        assert.equal(await accept('button.AddListener(OnClick|)'), 'button.AddListener(OnClick|)');
    });

    test('does not add parentheses to event subscriptions', async () => {
        assert.equal(await accept('OnDeath += OnClick|'), 'OnDeath += OnClick|');
    });

    test('does not add parentheses inside nameof', async () => {
        assert.equal(await accept('nameof(Jump|)'), 'nameof(Jump|)');
    });

    test('does not add parentheses twice', async () => {
        assert.equal(await accept('player.Jump|()'), 'player.Jump|()');
    });
});
