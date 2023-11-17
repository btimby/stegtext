import _debug from 'debug';

const debug = _debug('stegman');

// https://www.irongeek.com/homoglyph-attack-generator.php
const FORWARD = {
    ' ': ['\u2000', '\u2001', '\u2002', '\u2003', '\u2004', '\u2005', '\u2006', '\u2007', '\u2008', '\u3000'], //SPACE
    '!': ['\u01c3', '\uff01'], // !
    '.': ['\u0702'], // .
    ',': ['\u002c', '\u201a'], // ,
    '-': ['\u002d'], // -
    '0': ['\u0555'], // 0
    '1': ['\uff11'], // 1
    '2': ['\uff12'], // 2
    '3': ['\uff13'], // 3
    '4': ['\uff14'], // 4
    '5': ['\uff15'], // 5
    '6': ['\uff16'], // 6
    '7': [], // 7
    '8': ['\uff18'], // 8
    '9': ['\uff19'], // 9
    'a': ['\u0430', '\uff41'], // a
    'b': ['\uff42'], // b
    'c': ['\u03f2', '\u0441', '\u217d', '\uff43'], // c
    'd': ['\u0501', '\u217e', '\uff44'], // d
    'e': ['\u0435', '\uff45'], // e
    'f': ['\uff46'], // f
    'g': ['\u0261', '\uff47'], // g
    'h': ['\u04bb', '\uff48'], // h
    'i': ['\u0456', '\u2170', '\uff49'], // i
    'j': ['\u03f3', '\u0458', '\u0575', '\uff4a'], // j
    'k': ['\uff4b'], // k
    'l': ['\u0627', '\u217c', '\uff4c'], // l
    'm': ['\u217f', '\uff4d'], // m
    'n': ['\uff4e'], // n
    'o': ['\u03bf', '\u043e', '\uff4f'], // o
    'p': ['\u0440', '\uff50'], // p
    'q': ['\uff51'], // q
    'r': ['\uff52'], // r
    's': ['\u0455', '\uff53'], // s
    't': ['\uff54'], // t
    'u': ['\uff55'], // u
    'v': ['\u03bd', '\u2174', '\uff56'], // v
    'w': ['\u0461', '\uff57'], // w
    'x': ['\u0445', '\u2179', '\uff58'], // x
    'y': ['\u028f', '\u03b3', '\u0443', '\uff59'], // y
    'z': ['\uff5a'], // z
};
const ALPHABET = Object.keys(FORWARD);
const REVERSE = {};
for (const [k, v] of Object.entries(FORWARD)) {
    REVERSE[k] = k;
    for (const h of v) {
        REVERSE[h] = k;
    }
}
// TODO: ordering is wrong, need to fix...
const BITS = {
    1: [0b0, 0b1],
    2: [0b10, 0b11, 0b01, 0b00,],
    3: [0b111, 0b110, 0b101, 0b100, 0b011, 0b010, 0b001, 0b000],
}

/*
Encoding method
---------------

The keys above in the homoglyphs dictionary represent the usable chars for
the secret message. Only these chars can be used.

This char set is < 64 chars so it can be encoded using a 6-bit integer,
each representing the offset of the char within the usable alphabet.

These 6-bit integers are packed into an array of bytes (8 bits) which is
the encoded secret message. This encoded message is then encyrpted using
any method desired.

Then a header is prepended to the encoded message. This packet is then
hidden in the cover message as follows...

The cover message is scanned for any character with known homoglyphs and
an array of the original char plus all known homoglyphs is used to encode
one or more bits, for example, a char with one known homoglyph is
considered base-2, the original char represents a 0 and the first homoglyph
represents 1. Additional homoglyphs allow us to use base-3, base-4 etc.
to represent multiple bits using that single char.

A char may be replaced in the cover message with one of it's homoglyphs.
If two possible substitutions appear adjacent to one another, the
following chars will be the same, this is done to increase readability of
the resulting steno message. For example, if the word 'good' is present
and the first homoglyph of 'o' is used, then the steno word would be
'gｏｏd' and never 'goｏd'.

To decode, the steno message is scanned for letters and homoglyphs and
the appropriate base is used to produce one or more bits. Adjacent chars
are skipped and the resulting bits are appended to a buffer. The buffer
can then be decrypted to retrieve the 6-bit encoded message which can be
converted to ascii by looking up each char in the alphabet.

A message header consists of a magic value, version number, encryption
method id, encryption key id, error correction code and finally a message
length.
*/

function encrypt(key, message) {
    // NOOP
    return message;
}

function decrypt(key, cipher) {
    // NOOP
    return cipher;
}

function divmod(x, y) {
    return [Math.floor(x / y), x % y];
}

function reverse(s) {
    return s.split('').reverse().join('');
}

function hex(i) {
    return i.toString(2).padStart(8, '0');
}

function hexDump(s, len) {
    let col = 0, row = 0, binary = [], number = [];

    for (let i = 0; i < len; i++) {
        binary.push(reverse(hex(s[i])));
        number.push(s[i]);
        if (col++ === 5 || i === len - 1) {
            debug(`${row * 5}: ${binary.join(' ')}, ${number.join(' ')}`);
            row++;
            binary = [];
            number = [];
        }
    }
}

function mask(start, end) {
    let mask = 0;

    for (let j = start; j < end; j++) {
        mask ^= 2 ** j;
    }

    return mask;
}

function to6Bit(s) {
    // Calculate length of 8-bit buffer necessary to contain our message.
    const len = Math.ceil(s.length * 6 / 8);
    const buffer = new Uint8Array(len);

    for (let i = 0; i < s.length; i++) {
        const alpha = ALPHABET.indexOf(s[i]);
        if (alpha === -1) {
            throw new Error(`Invalid char, only "${ALPHABET}" are supported`);
        }

        const [index, bit] = divmod(i * 6, 8);
        const value = alpha << bit;
        buffer[index] |= value;
        if (bit > 2) {
            // Set next array position with remaining bits.
            buffer[index + 1] = value >> 8;
        }
    }

    hexDump(buffer, len);

    return buffer;
}

function to8Bit(array) {
    let s = '', i = 0;

    while (true) {
        const [index, bit] = divmod(i++ * 6, 8);
        if (index === array.length -1 && bit > 2) {
            // Not enough data for another char.
            break;
        }
        // Mask the bits we need and shift to LSB.
        let value = array[index] & mask(bit, Math.min(8, bit + 6)) >> bit;
        const have = 8 - bit;
        if (have < 6) {
            // We need more bits, so mask them, shift them and OR them.
            value |= (array[index + 1] & mask(0, 6 - have)) << have;
        }
        const alpha = ALPHABET[value]
        if (alpha === undefined) {
            throw new Error(`Invalid char code ${value}, max ${ALPHABET.length - 1}`);
        }
        s += alpha;
    }

    return s;
}


function encodeHeader(encrypted) {
    /*
    header = {
        magic: 0110,    // 4 bits
        version: 01,    // 2 bits
        encryption: 01, // 2 bits
    }
    */
   const header = {
        magic: 0b0110,
        version: 0b1,
        encryption: (encrypted) ? 0b1 : 0b0,
   };
   let value = header.magic;
   value >>= 4;
   value |= header.version;
   value >>= 2;
   value |= header.encryption;
   return value;
}

function decodeHeader(buffer) {
    let value = buffer[0];
    const header = {
        encrypted: value & 0b11,
        version: (value << 2) && 0b11,
        magic: (value << 6),
    };
    return header;
}

function base2ToBaseN(bits, bit, c) {
    const possible = [c];
    try {
        possible.push(...FORWARD[c]);
    } catch (e) {
        return [0, null];
    }

    // Try to store 3 bits, then 2, then 1.
    for (let i = 3; i > 0; i--) {
        // i == number of bits we are searching.
        let value = (bits & mask(bit, bit + i)) >> bit;
        debug('base2ToBaseN: Searching for %i bit solutions for %s', i, hex(value));
        let index = BITS[i].indexOf(value);
        if (index === -1) {
            // Try to hide less bits.
            debug('base2ToBaseN: No solution');
            continue;
        }
        for (let ii = i - 1; ii > 0; ii--) {
            // Extend index by all smaller bit sequences.
            index += 2 ** ii;
        }
        if (index > possible.length - 1) {
            debug('base2ToBaseN: Not enough permutations to cover solution');
            continue;
        }
        debug('base2ToBaseN: Found solution at index %i', index);

        const permutation = possible[index];

        // Found bit sequence
        return [i, permutation];
    }
}
function baseNToBase2(c) {
    debug('baseNToBase2: c: %s(%i)', c, c.charCodeAt(0));
    const alpha = REVERSE[c];
    if (alpha === undefined) {
        return [0, null];
    }
    debug('baseNToBase2: alpha: %s(%i)', alpha, alpha.charCodeAt(0));
    const possible = [alpha];
    possible.push(...FORWARD[alpha]);
    let index = possible.indexOf(c);
    debug('baseNToBase2: Permutation %i of %s', index, alpha);

    for (let i = 1; i <= 3; i++) {
        debug('baseNToBase2: Searching for %i bit solution', i);
        if (BITS[i].length - 1 < index) {
            index -= BITS[i].length;
            continue;
        }

        debug('baseNToBase2: Found solution at %i of %i bits', index, i);
        return [i, BITS[i][index]];
    }

    return [0, null];
}

function hideByte(byte, cover, cursor) {
    let hidden = 0;
    // Consume as many chars in cover as are necessary to hide the
    // given byte.

    while (hidden < 8) {
        const orig = cover[cursor];
        const [num, swap] = base2ToBaseN(byte, 8 - hidden, orig);
        if (num) {
            debug('hideByte: hid %i bit(s)', num);
            debug('hideByte: Swapping %s->%s', cover[cursor], swap);
            cover[cursor] = swap;
        }
        cursor++;
        hidden += num;
    }

    return cursor;
}

function hide(buffer, cover) {
    let cursor = 0;

    cover = cover.split('');
    for (let i = 0; i < buffer.length; i++) {
        cursor = hideByte(buffer[i], cover, cursor)
    }

    return cover.join('');
}

function seek(m) {
    const values = [];
    let i = 0, pos = 0, temp = 0;

    while (true) {
        const c = m[i];
        let [num, bits] = baseNToBase2(c);
        debug('seek: Extracted %i bits from char %s', num, c);
        if (num > 0) {
            bits <<= pos;
            debug('seek: ORing bits %s into %s', hex(bits), hex(temp));
            temp |= bits;
            debug('seek: temp is now %s', hex(temp));
            pos += num;
        }

        i++;
        if (pos >= 8) {
            const value = temp & 0x00ff;
            debug('seek: Pushing value %s to result', hex(value));
            pos -= 8;
            values.push(value);
            temp >>= 8;
            debug('seek: temp shifted by 8, is now: %s', hex(temp));
        } else if (i === m.length) {
            debug('seek: Pushing value %s to result', hex(temp));
            values.push(temp);
            break;
        }
    }

    return values;
}

export function steganographize(key, message, cover) {
    const encodedMessage = to6Bit(message);
    const encryptedMessage = encrypt(key, encodedMessage);
    return hide(encryptedMessage, cover);
}

export function unsteganographize(stego) {
    const encryptedMessage = seek(stego);
    const encodeddMessage = decrypt(encryptedMessage);
    return to8Bit(encodedMessage);
}

export const _test = (process.env.NODE_ENV === 'test') ? {
    encrypt,
    decrypt,
    divmod,
    reverse,
    to6Bit,
    to8Bit,
    base2ToBaseN,
    baseNToBase2,
    hide,
    seek,
} : void 0;
