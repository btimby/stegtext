# stegtext
Steganographic method that hides text inside of text. The hidden message is limited to a small alphabet so that only 6 bits are used per character. This reduces the size of the hidden message, which means a smaller cover message is necessary. The cover message can be any text using ASCII characters.

## theory
This steganographic method uses homoglyphs, which are unicode symbols that are visually similar or identical to ASCII symbols. When a character in the cover text has available homoglyphs, a homoglyph representing the bits to be hidden replaces the original character.

For example, the english 'o' character has a homoglyph of 'о'. While these characters are visually identical, they use different unicode codes. Therefore, if we leave the 'o' untouched, this would represent a 0 bit and if we swap it that represents a 1 bit.

For characters with more than one homoglyph, we can encode more than one bit per character. For example, the 2nd homoglyph would represent two bits 0b10. The space charater has 12 homoglyphs, allowing up to 3 bits to be encoded in a single space character.

The resulting steganographic message is visually identical to the cover message, but a computer can easily pick out the special characters to perform encoding.

Any messaging system that allows unicode / utf8 characters without modification can be used as a medium for passing steganographic messages.

## usage
This module exposes 4 functions; `pack()`, `unpack()`, `hide()` and `seek()`.

`pack()` accepts a hidden message, validates that it uses the proper alphabet and returns it encoded in 6 bits per character.

`unpack()` accepts a packed hidden message and returns it as 8 bit ASCII characters.

`hide()` accepts a binary buffer (usually a packed message) and a cover message in ASCII. It performs the character swaps in order to encode the binary buffer into the cover message and returns a unicode steganograph message.

`seek()` accepts a unicode steganograph message as unicode and decodes the hidden bits by locating the character swaps. It returns a binary buffer.

### importing
```javascript
import stegtext from 'stegtext';
```

### packing and hiding
```javascript
let buff = stegtext.pack('This is my secret message');

const s = stegtext.hide('This is my cover message. It is quite a bit longer than the secret message in order to encapsulate it!', buff);
```

### seeking and unpacking
```javascript
buff = stegtext.seek(s);
const m = stegtext.unpack(buff);
console.log(m);
'This is my secret message'
```

Because `hide()` accepts a binary buffer, you can hide any data you wish as long as the cover message is long enough to accomodate it. This means that after packing, you can encrypt the secret message before hiding it.
