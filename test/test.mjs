import assert from 'assert';
import { _internals, pack, unpack, hide, seek } from "../src/index.js";

const {
    divmod, reverse, base2ToBaseN, baseNToBase2, hideByte, seekN,
} = _internals;


describe('stegtext', () => {
    // utility functions.
    it('can perform divmod', () => {
        assert.deepEqual(divmod(12, 10), [1, 2]);
        assert.deepEqual(divmod(2, 10), [0, 2])
    });

    it('can reverse a string', () => {
        assert.deepEqual(reverse('foo'), 'oof');
        assert.deepEqual(reverse('barn yard'), 'dray nrab');
    });

    // 6 to 8 bit conversion.
    it('should be able convert 8->6 bit', () => {
        assert.deepEqual(pack('a'), [15]);
        assert.deepEqual(pack('aa'), [207, 3]);
    });

    it('should be able to convert 6->8 bit', () => {
        assert.deepEqual(unpack([15]), 'a');
        assert.deepEqual(unpack([207, 3]), 'aa');
    });

    // support functions.
    it('can encode bits as unicode homoglyph swaps', () => {
        // Should store first two bits as 4rd permutation of 'o'
        assert.deepEqual(base2ToBaseN(0b1111, 0, 'o'), [2, '\uff4f']);
        // Should store next three bits as 11th permutation of ' '
        assert.deepEqual(base2ToBaseN(0b1111, 2, ' '), [3, '\u3000']);
    });

    it('can decode bits from swapped homoglyphs', () => {
        // Should retrieve two bits 11
        assert.deepEqual(baseNToBase2('\uff4f'), [2, 0b11]);
        // Should retrieve three bits 011
        assert.deepEqual(baseNToBase2('\u3000'), [3, 0b011]);
    });

    it('can hide a byte in a cover message', () => {
        // Use a specially crafted cover message so that we can hide
        // one bit per char.
        const cover = '000000000000000000000000'.split('');
        assert.equal(hideByte(0b00000001, cover, 0), 8);
        assert.deepEqual(cover.slice(0, 8), ['\u0555', '0', '0', '0', '0', '0', '0', '0'])
        assert.equal(hideByte(0b10000000, cover, 8), 16);
        assert.deepEqual(cover.slice(8, 16), ['0', '0', '0', '0', '0', '0', '0', '\u0555'])
        assert.equal(hideByte(0b10100001, cover, 16), 24);
        assert.deepEqual(cover.slice(16, 24), ['\u0555', '0', '0', '0', '0', '\u0555', '0', '\u0555'])
    });

    it('can seek a byte in cover message', () => {
        assert.deepEqual(seekN('000000'), [0b00000000]);
        assert.deepEqual(seekN('\u05550000000'), [0b00000001])
        assert.deepEqual(seekN('0000000\u0555'), [0b10000000])
        assert.deepEqual(seekN('0\u05550\u05550\u05550\u0555'),
                              [0b10101010]);
        assert.deepEqual(seekN('\u0555\u05550\u0555\u0555\u05550\u0555'),
                              [0b10111011]);
        assert.deepEqual(seekN('\u0555\u0555\u0555\u0555\u0555\u0555\u0555\u0555'),
                              [0b11111111]);
    });

    // hide and seek
    it('can hide bytes in a cover message', () => {
        const cover = hide([0b11011010, 0b11111111, 0b00000000], 'This is a cover message. It provides cover.');
        assert.equal(cover, 'Tһⅰs iѕ a coⅴｅｒ ⅿеѕѕаɡе܂ It provides cover.');
    });

    it('throws when hiding too much', () => {
        try {
            hide([0b11011010, 0b11111111, 0b00000000], 'short');
        } catch (e) {
            // Error should provide information about necessary cover
            // message length;
            assert.equal(e.hidden, 0);
            assert.equal(e.needed, 5);
            assert.equal(e.message, 'cover message too short need space for 5 more bytes');
            return;
        }
        assert.fail('Error expected');
    });

    it('can seek bytes from a cover message', () => {
        const message = seek('Tһⅰs iѕ a coⅴｅｒ ⅿеѕѕаɡе܂ It provides cover.');
        assert.deepEqual(message, [0b11011010, 0b11111111, 0b00000000]);
    });

    it('throws if stego message has been truncated', () => {
        try {
            seek('Tһⅰs iѕ a');
        } catch (e) {
            // Error provides what has been seeked vs. needed.
            assert(e.message.startsWith('message truncated') === true, 'wrong error message');
            assert.equal(e.seeked, 1);
            assert.equal(e.needed, 3);
            return;
        }
        assert.fail('Error expected');
    });

    it('throws if stego message has been corrupted', () => {
        try {
            seek('Tһⅰs iѕ a coⅴｅr ⅿеѕѕаɡе܂ It provides cover.');
        } catch (e) {
            // Error provides what has been seeked vs. needed.
            assert(e.message.startsWith('message corrupted') === true, 'wrong error message');
            assert.equal(e.expected, 69);
            assert.equal(e.calculated, 10);
            return;
        }
        assert.fail('Error expected');
    });
});
