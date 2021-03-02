function ED() {
    const split = (input, i) => (input.search(" ") !== -1
        ? input.split(" ") : input.match(new RegExp(`.{${i}}`, "g"))) || [input];

    const standards = () => ["txt", "b64", "hex"];
    const order = () => ["bin", "hex", "b64", "uri", "uni", "txt"];
    const uriDecode = input => {
        try {
            return decodeURIComponent(input.replace(/\+/g, " "))
        } catch (e) {
            return null;
        }
    };

    const core = {
        bin: {
            id: "bin",
            name: "Binary",
            valid: input => /^(?:[01]{1,8}\s*)+$/.test(input.replace(/\s/g, "")),
            de: input => split(input, 8).reduce((e, a) => a + String.fromCharCode(parseInt(e, 2)), ""),
            en: input => {
                let output = "";
<<<<<<< HEAD
                for (let i in input) {
=======
                for (let i = 0; i < input.length; i++) {
>>>>>>> 95217cb9e01893a2fbfd0f75588caee134960d65
                    output += input[i].charCodeAt(0).toString(2).padStart(8, '0');
                }
                return output;
            }
        },

        hex: {
            id: "hex",
            name: "Hex",
            valid: input => /^(?:[0-9A-Fa-f]{2}\s*)+$/.test(input),
            de: input => {
                const s = split(input, 2);
                let str = "";
                for (let i = 0; i < s.length; i++) {
                    str += String.fromCharCode(parseInt(s[i], 16));
                }
                const esc = escape || encodeURIComponent;
                try {
                    return decodeURIComponent(esc(str));
                } catch (e) {
                    return null;
                }
            },
            en: input => {
                input = unescape(encodeURIComponent(input));
                let result = "";
                for (let i = 0; i < input.length; i++) {
                    result += input.charCodeAt(i).toString(16)
                }
                return result.toUpperCase();
            }
        },

        b64: {
            id: "b64",
            name: "Base 64",
            valid: input => /^(?:[\w+\/]{4})*(?:[\w+\/]{4}|[\w+\/]{3}=|[\w\/]{2}==)$/.test(input),
            de: input => {
                try {
                    let d = atob(input);
                    return decodeURIComponent(d.split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
                } catch (e) {
                    console.log(e);
                    return null;
                }
            },
            en: input => btoa(encodeURIComponent(input)
                .replace(/%([0-9A-F]{2})/g, (match, p1) => String.fromCharCode(`0x${p1}`)))
        },

        uri: {
            id: "uri",
            name: "URI",
            valid: input => uriDecode(input) !== null,
            validUrl: input => /^((https?|ftp):\/\/)?\w+([\-.]\w+)*\.[a-z0-9]{2,5}(:[0-9]{1,5})?(\/.*)?$/i.test(input),
            de: uriDecode,
            en: input => encodeURIComponent(input).replace(/'/g, "%27").replace(/"/g, "%22")
        },

        uni: {
            id: "txt",
            name: "Unicode",
            valid: input  => /^(?:(?:\\u[0-9a-fA-F]{4}|\w)?[ !'#$%&"()*+-.,\/\\:;<=>?@[\]^_`{|}~]?)*$/g.test(input),
            de: input => {
                let offset = 0;
                const len = input.length;
                let out = "";

                const fromCode = (c, value) => {
                    switch (c) {
                        case '0': case '1': case '2': case '3': case '4':
                        case '5': case '6': case '7': case '8': case '9':
                            return (value << 4) + code - 48;
                        case 'a': case 'b': case 'c': case 'd': case 'e': case 'f':
                            return (value << 4) + code - 87;
                        case 'A': case 'B': case 'C': case 'D': case 'E': case 'F':
                            return (value << 4) + code - 55;
                        default:
                            throw "Malformed \\uXXXX encoding.";
                    }
                };

                const fromUnicode = (input, offset) => {
                    let value = 0;
                    for (let i = 0; i < 4; i++) {
                        c = input.charAt(offset++);
                        let code = c.charCodeAt(0);
                        value = fromCode(c, value);
                    }
                    return value;
                };

                while (offset < len) {
                    let c = input.charAt(offset++);
                    if (c !== '\\') {
                        out += c;
                        continue;
                    }
                    c = input.charAt(offset++);
                    if (c === 'u') {
                        out += String.fromCharCode(fromUnicode(input, offset));
                    } else {
                        const unesc = c => {
                            switch (c) {
                                case 't': return '\t';
                                case 'r': return '\r';
                                case 'n': return '\n';
                                case 'f': return '\f';
                            }
                            return '';
                        }
                        out += unesc(c);
                    }
                }
                return out;
            },
            en: input => {
                const esc = code => {
                    const pad = "0000";
                    switch (code) {
                            case ' ': return " ";
                            case '\t': return "\\t";
                            case '\n': return "\\n";
                            case '\r': return "\\r";
                            case '\f': return "\\f";
                            case '=': case ':': case '#': case '!':
                                return "\\" + char;
                            default:
                                if (code < 0x0020 || code > 0x007e) {
                                    const s = code.toString(16).toUpperCase();
                                    return "\\u" + pad.substr(0, 4 - s.length) + s;
                                } else {
                                    return char;
                                }
                        }
                }
                let sb = "";
                try {
                    const len = input.length;
                    for (let i = 0; i < len; i++) {
                        const code = input.charCodeAt(i);
                        const char = input.charAt(i);
                        if (code > 61 && code < 127) {
                            sb += code === '\\' ? '\\\\' : char;
                        } else {
                            sb += esc(code)
                        }
                    }
                } catch (e) {}
                return sb;
            }
        },

        txt: {id: "txt", name: "Text", valid: () => true, de: input => input, en: input => input}
    };

    const decode = (input, type) => {
        if (!core[type].valid(input = input.trim())) return null;

        const result = core[type].de(input);
        return this.uri.valid(result) ? this.uri.de(result) : result
    };

    const encode = (input) => core.en(input.trim());

    return {encode, decode, ...core};
}

const Str = String.prototype;

Str.encode = function(type) {
    return ED().core[type].en(this)
};

Str.decode = function(type) {};

const s = "Một đoạn text bằng tiếng Việt 4C C3 AA 20 4D 69 6E 68 20 C4 90 E1 BB A9 63 TMOq L%C3%AA%20Minh%20%C4%90%E1%BB%A9c 1000 1000 0111 1011 1010 0101 100011 TMOqIE1pbmggxJDhu6lj"
const ed = new ED();
// console.log(ed.encode(s, ""));

function* wordsOf(s) {
    const length = s.length - 1;
    const isWhitespace = s => s === ' ' || s === '\t' || s === '\n';
    const nextNonWhitespace = start => {
        for (var i = start; i < length; i++) {
            if (!isWhitespace(s.charAt(i))) return i;
        }
        return -1;
    };
    var index = 0;
    for (var i = index = nextNonWhitespace(index); i <= length; i++) {
        // console.log(`${index} ${i}`);
        if (isWhitespace(s.charAt(i))) {
            const substr = s.substring(index, i);
            index = nextNonWhitespace(i)
            yield substr;
        }
    }
}

var iter = wordsOf(s);

let previous = "";
let buffer = []
const order = ["bin", "hex", "b64", "uri", "uni", "vie", "txt"];
for (const i of iter) {
    let current = '';
<<<<<<< HEAD
    for (let method in order) {
        const c = ed[order[method]];
=======
    for (let method of order) {
        const c = ed[method];
>>>>>>> 95217cb9e01893a2fbfd0f75588caee134960d65
        if (c.valid(i)) {
            current = method
            break;
        }
    }
    if (previous === current) {
        buffer.push(i);
    } else {
        if (previous) {
            const s = buffer.join(' ');
<<<<<<< HEAD
            let decoded = ed[order[previous]].de(s);
            if (decoded == null) {
                decoded = ed[order[++previous]].de(s);
            }
            
            console.log(`${previous} ${s} -> ${decoded}`);
=======
            const decoded = ed[previous].de(s);
            if (decoded == null) {

            } else {
                console.log(`${previous} ${s} -> ${decoded}`);
            }
>>>>>>> 95217cb9e01893a2fbfd0f75588caee134960d65
        }
        buffer = [i]
    }
    previous = current;
}

const val = buffer.join(' ');
<<<<<<< HEAD
console.log(`${order[previous]} ${val} -> ${ed[order[previous]].de(val)}`);
=======
console.log(`${previous} ${val} -> ${ed[previous].de(val)}`);
>>>>>>> 95217cb9e01893a2fbfd0f75588caee134960d65
