# C# Auto Parens

Adds `()` automatically when you accept a **method** from the C# completion list, like Rider does. It leaves them out when the method is used as a value rather than called.

```csharp
player.TakeDamage        // accept "TakeDamage" with Enter/Tab
player.TakeDamage(|)     // parameter hints open with the cursor inside

player.Jump              // method without parameters
player.Jump()|           // the cursor skips past the parentheses
```

## When parentheses are not added

| Situation | Example |
| --- | --- |
| The argument expects a delegate (`Action`, `Func`, `Predicate`, `UnityAction`, `EventHandler`, `*Callback`, `*Delegate`, `*Handler`…) | `button.onClick.AddListener(OnClick)` |
| Event subscription | `OnDeath += HandleDeath` |
| Inside `nameof()` | `nameof(Update)` |
| Already followed by `(` or `<` | `Foo|(1, 2)` |
| Inside a comment | `// call Foo` |
| The accepted item is not a method (property, field, type…) | `transform.position` |

## How it works

The extension takes over **Enter** and **Tab** while the suggestion list is open in a C# file. It first accepts the suggestion as usual, then:

1. Asks the completion provider whether the accepted word is a method.
2. Asks the signature help provider whether the current argument is a delegate type.
3. If it should be a call, types `(`, so VS Code auto-closes it and shows parameter hints. If no overload takes parameters, the cursor moves past `)`.

The **C# Auto Parens** output channel logs each decision, for troubleshooting.

## Requirements

A C# language extension that provides completions and signature help, such as [C#](https://marketplace.visualstudio.com/items?itemName=ms-dotnettools.csharp) or [C# Dev Kit](https://marketplace.visualstudio.com/items?itemName=ms-dotnettools.csdevkit).

## Related extensions

- [C# Auto Suggest](https://github.com/saix93/vscode-auto-suggest): opens the completion list as soon as you start typing an identifier.
- [C# Smart Semicolon](https://github.com/saix93/vscode-smart-semicolon): typing `;` inside parentheses moves it to the end of the line.

## Development

```sh
npm install
npm test          # compile, then run the unit and integration tests
npm run package   # build the .vsix
```

The integration tests download a separate copy of VS Code into `.vscode-test/` and run inside it.

Press <kbd>F5</kbd> in VS Code to launch an Extension Development Host.

## License

[MIT](LICENSE)
