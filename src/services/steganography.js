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
    for (const h of v) {
        REVERSE[h] = k;
    }
}
const BITS = [
    [0b111, 0b110, 0b101, 0b100, 0b011, 0b010, 0b001, 0b000],
    [0b10, 0b11, 0b01, 0b00],
    [0, 1],
]

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

function hexDump(s, len) {
    let col = 0, row = 0, binary = [], number = [];

    for (let i = 0; i < len; i++) {
        binary.push(reverse(s[i].toString(2).padStart(8, '0')));
        number.push(s[i]);
        if (col++ === 5 || i === len - 1) {
            console.debug(`${row * 5}: ${binary.join(' ')}, ${number.join(' ')}`);
            row++;
            binary = [];
            number = [];
        }
    }
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
        const shifted = alpha << bit;
        buffer[index] = buffer[index] | shifted;
        buffer[index + 1] = shifted >> 8;
    }

    hexDump(buffer, len);

    return buffer;
}

function to8Bit(s) {

}

function base2ToBaseN(bits, c) {
    const possible = [c];
    possible.push(...FORWARD[c]);
    const limit = possible.length;

    for (let i = 2; i >= 0; i--) {
        if (limit > 2 ** i -1) {
            continue;
        }
        let value = bits | (2 ** i * 2 - 1);
        let index = BITS[i].indexOf(value);
        if (index === -1 || index > 2 ** i - limit) {
            continue;
        }

        // Found it.
        return [i, possible[index - 2 ** (i - 1)]];
    }
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

function hide(buffer, cover) {
    let bytePos = 0, bitPos = 0;
    let value = buffer[bytePos];

    for (let i = 0; i < cover.length; i++) {
        const c = cover[i];
        const alpha = ALPHABET.indexOf(c);
        if (alpha === -1) {
            continue;
        }

        const [bitsStored, substitute] = base2ToBaseN(alpha, value);
        cover[i] = substitute;
        value >>= bitsStored;
        bitPos += bitsStored;
        if (bitPos >= 8) {
            bitPos = 0;
            value = buffer[++bytePos];
        }
    }
}

function baseNtoBase2(c, homoglyph) {
    const possible = [c];
    possible.push(...FORWARD[c]);
    const index = possible.indexOf(homoglyph);
    return BITS[index];
}

function seekN(m, length, start) {
    let prev = '', bufferPos = 0, bitPos = 0, value = 0;
    const buffer = new Uint8Array(length);

    for (let i = 0; i < m.length && bufferPos < length; i++) {
        const c = m[i];
        const alpha = REVERSE[c];
        if (!alpha) {
            continue;
        }
        if (alpha === prev) {
            continue;
        }
        prev = alpha;
        const bits = baseNtoBase2(alpha, c);

        for (let b = 0; b < bits.length; b++) {
            if (bits[b] === 1) {
                value = value | 2 ** bitPos;
            }
            if (bitPos++ === 8) {
                // Only retain bytes after start.
                if (bufferPos >= start) {
                    buffer[bufferPos++] = value;
                }
                bitPos = 0;
                value = 0;
            }
            if (bufferPos == length) {
                break;
            }
        }
    }

    return buffer;
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

function seek(m) {
    const header = decodeHeader(seekN(m, 1));
    return seekN(m, header.length, 1);
}

function steganographize(key, message, cover) {
    const encodedMessage = to6Bit(message);
    const encryptedMessage = encrypt(key, encodedMessage);
    return hide(encryptedMessage, cover);
}

function unsteganographize(stego) {
    const encryptedMessage = seek(stego);
    const encodeddMessage = decrypt(encryptedMessage);
    return to8Bit(encodedMessage);
}

export {
    encrypt,
    decrypt,
    steganographize,
    unsteganographize,
};
