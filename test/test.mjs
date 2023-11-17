import assert from 'assert';
import { _test, steganographize } from "../src/index.js";

const {
    to6Bit, to8Bit, divmod, base2ToBaseN, baseNToBase2, hide, seek,
} = _test;


describe('stegman', () => {
    it ('can perform divmod', () => {
        assert.deepEqual(divmod(12, 10), [1, 2]);
        assert.deepEqual(divmod(2, 10), [0, 2])
    });

    it('should be able convert 8->6 bit', () => {
        assert.deepEqual(to6Bit('a'), new Uint8Array([15]));
        assert.deepEqual(to6Bit('aa'), new Uint8Array([207, 3]));
    });

    it('should be able to convert 6->8 bit', () => {
        assert.deepEqual(to8Bit([15]), 'a');
        assert.deepEqual(to8Bit([207, 3]), 'aa');
    });

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

    it('can hide bytes in a cover message', () => {
        const cover = hide([0b11011010, 0b11111111, 0b00000000], 'This is a cover message');
        assert.equal(cover, 'Thіѕ ⅰs а ⅽover message');
    });

    it('can seek bytes from a cover message', () => {
        const message = seek('Thіѕ ⅰs а ⅽover message');
        assert.deepEqual(message, [0b11011010, 0b11111111, 0b00000000]);
    });
});
