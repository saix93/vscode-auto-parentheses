import * as assert from 'node:assert/strict';
import { isDelegateType, parameterType, skipReason } from '../../parens';

describe('parameterType', () => {
    it('removes the parameter name', () => {
        assert.equal(parameterType('', 'UnityAction<int> call'), 'UnityAction<int>');
        assert.equal(parameterType('', 'Func<int, bool> predicate'), 'Func<int, bool>');
        assert.equal(parameterType('', '(int a, int b) tuple'), '(int a, int b)');
    });

    it('removes modifiers and default values', () => {
        assert.equal(parameterType('', 'params object[] args'), 'object[]');
        assert.equal(parameterType('', 'out int value'), 'int');
        assert.equal(parameterType('', 'scoped ref Span<int> span'), 'Span<int>');
        assert.equal(parameterType('', 'Action callback = null'), 'Action');
    });

    it('reads labels given as offsets into the signature', () => {
        const signature = 'void AddListener(UnityAction call)';
        const start = signature.indexOf('UnityAction');
        assert.equal(parameterType(signature, [start, signature.length - 1]), 'UnityAction');
    });

    it('keeps labels without a name', () => {
        assert.equal(parameterType('', 'int'), 'int');
    });
});

describe('isDelegateType', () => {
    for (const type of ['Action', 'Action<int>', 'System.Action<int, string>', 'Func<bool>', 'Predicate<T>', 'UnityAction', 'UnityEngine.Events.UnityAction<float>', 'EventHandler', 'EventHandler<EventArgs>', 'AsyncCallback', 'MyCallback', 'OnHitDelegate', 'Delegate', 'Action?']) {
        it(`accepts ${type}`, () => assert.equal(isDelegateType(type), true));
    }

    for (const type of ['int', 'string', 'ActionResult', 'IAction', 'Function', 'HandlerFactory', 'List<Action>', 'GameObject']) {
        it(`rejects ${type}`, () => assert.equal(isDelegateType(type), false));
    }
});

describe('skipReason', () => {
    it('adds parens to a plain call', () => {
        assert.equal(skipReason('        player.', ''), undefined);
        assert.equal(skipReason('var x = ', ';'), undefined);
    });

    it('skips when parens or type arguments already follow', () => {
        assert.equal(skipReason('', '(1, 2);'), 'already followed by ( or <');
        assert.equal(skipReason('', '<int>();'), 'already followed by ( or <');
    });

    it('skips event subscriptions', () => {
        assert.equal(skipReason('button.onClick += ', ';'), 'event subscription');
        assert.equal(skipReason('OnDeath -= this.', ';'), 'event subscription');
    });

    it('skips nameof', () => {
        assert.equal(skipReason('Debug.Log(nameof(', '));'), 'nameof');
        assert.equal(skipReason('nameof( Player.', ')'), 'nameof');
    });

    it('skips comments', () => {
        assert.equal(skipReason('x = 1; // call ', ''), 'comment');
        assert.equal(skipReason('    /// <see cref="', '"/>'), 'comment');
        assert.equal(skipReason('     * ', ''), 'comment');
    });
});
