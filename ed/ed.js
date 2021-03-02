function ED() {
    const order = ["bin", "hex", "b64", "uri", "uni", "txt"];

    const split = (input, i) =>
        (input.search(" ") !== -1 ? input.split(" ") : input.match(new RegExp(`.{${i}}`, "g"))) || [input];

    const uriDecode = input => {
        try {
            return decodeURIComponent(input.replace(/\+/g, " "));
        } catch (e) {
            return null;
        }
    };

    const isUrl = input => /^((https?|ftp):\/\/)?\w+([\-.]\w+)*\.[a-z0-9]{2,5}(:[0-9]{1,5})?(\/.*)?$/i.test(input);

    const fromChar = (c, value) => {
        const code = c.charCodeAt(0);
        switch (c) {
            case "0":
            case "1":
            case "2":
            case "3":
            case "4":
            case "5":
            case "6":
            case "7":
            case "8":
            case "9":
                return (value << 4) + code - 48;
            case "a":
            case "b":
            case "c":
            case "d":
            case "e":
            case "f":
                return (value << 4) + code - 87;
            case "A":
            case "B":
            case "C":
            case "D":
            case "E":
            case "F":
                return (value << 4) + code - 55;
            default:
                throw "Malformed \\uXXXX encoding.";
        }
    };

    const fromUnicode = (input, offset) => {
        let value = 0;
        for (let i = 0; i < 4; i++) {
            value = fromChar(input.charAt(offset++), value);
        }
        return value;
    };

    const unescape = c => {
        switch (c) {
            case "t":
                return "\t";
            case "r":
                return "\r";
            case "n":
                return "\n";
            case "f":
                return "\f";
        }
        return "";
    };

    const escape = (code, char) => {
        switch (code) {
            case " ":
                return " ";
            case "\t":
                return "\\t";
            case "\n":
                return "\\n";
            case "\r":
                return "\\r";
            case "\f":
                return "\\f";
            case "=":
            case ":":
            case "#":
            case "!":
                return "\\" + char;
            default:
                return code < 0x0020 || code > 0x007e ? `\\u${code.toString(16).toUpperCase().padStart(4, "0")}` : char;
        }
    };

    const core = {
        bin: {
            id: "bin",
            name: "Binary",
            valid: input => /^(?:[01]{1,8}\s*)+$/.test(input.replace(/\s/g, "")),
            decode: input => split(input, 8).reduce((a, e) => a + String.fromCharCode(parseInt(e, 2)), ""),
            encode: input => {
                let output = "";
                for (let i in input) {
                    output += input.charCodeAt(i).toString(2).padStart(8, "0");
                }
                return output;
            }
        },

        hex: {
            id: "hex",
            name: "Hex",
            valid: input => /^(?:[0-9A-Fa-f]{2}\s*)+$/.test(input),
            decode: input => {
                const s = split(input, 2);
                let str = "";
                for (let i = 0; i < s.length; i++) {
                    str += String.fromCharCode(parseInt(s[i], 16));
                }
                try {
                    return decodeURIComponent(encodeURIComponent(str));
                } catch (e) {
                    return null;
                }
            },
            encode: input => {
                input = unescape(encodeURIComponent(input));
                let result = "";
                for (let i = 0; i < input.length; i++) {
                    result += input.charCodeAt(i).toString(16);
                }
                return result.toUpperCase();
            }
        },

        b64: {
            id: "b64",
            name: "Base 64",
            valid: input => /^(?:[\w+\/]{4})*(?:[\w+\/]{4}|[\w+\/]{3}=|[\w\/]{2}==)$/.test(input),
            decode: input => {
                try {
                    return decodeURIComponent(
                        atob(input)
                            .split("")
                            .map(c => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
                            .join("")
                    );
                } catch (e) {
                    return null;
                }
            },
            encode: input => btoa(encodeURIComponent(input).replace(/%([0-9A-F]{2})/g, (match, p1) => String.fromCharCode(`0x${p1}`)))
        },

        uri: {
            id: "uri",
            name: "URI",
            valid: input => uriDecode(input) !== null,
            decode: uriDecode,
            encode: input => encodeURIComponent(input).replace(/'/g, "%27").replace(/"/g, "%22")
        },

        uni: {
            id: "txt",
            name: "Unicode",
            valid: input => /^(?:(?:\\u[0-9a-fA-F]{4}|\w)?[ !'#$%&"()*+-.,\/\\:;<=>?@[\]^_`{|}~]?)*$/g.test(input),
            decode: input => {
                const len = input.length;
                let offset = 0;
                let out = "";
                while (offset < len) {
                    let c = input.charAt(offset++);
                    if (c === "\\") {
                        c = input.charAt(offset++);
                        out += c === "u" ? String.fromCharCode(fromUnicode(input, offset)) : unescape(c);
                    } else {
                        out += c;
                    }
                }
                return out;
            },
            encode: input => {
                let sb = "";
                try {
                    const len = input.length;
                    for (let i = 0; i < len; i++) {
                        const code = input.charCodeAt(i);
                        const char = input.charAt(i);
                        sb += code > 61 && code < 127 ? (code === "\\" ? "\\\\" : char) : escape(code, char);
                    }
                } catch (e) {}
                return sb;
            }
        },

        txt: {id: "txt", name: "Text", valid: () => true, decode: input => input, encode: input => input}
    };

    const detect = (input, from) => {
        for (let i = from || 0; i < order.length; i++) {
            const value = order[i];
            if (core[value].valid(input)) return {index: i, value};
        }
    };

    const tokenize = function* (input) {
        const length = input.length - 1;
        const nextNonWhitespace = start => {
            for (let i = start; i < length; i++) {
                if (!/\s/.test(input.charAt(i))) return i;
            }
            return -1;
        };
        let index = nextNonWhitespace(0);
        for (let i = index; i <= length; i++) {
            if (/\s/.test(input.charAt(i))) {
                const substr = input.substring(index, i);
                index = nextNonWhitespace(i);
                yield substr;
            }
        }
        yield input.substring(index, length + 1);
    };

    const tryDecode = (buffer, index) => {
        const str = buffer.join(" ");
        while (true) {
            const type = order[index++];
            const decoded = core[type].decode(str);
            if (decoded) {
                return {type, escape: core.uni.encode(decoded), value: decoded, url: isUrl(decodeURIComponent(decoded))};
            }
        }
    };

    const auto = input => {
        let previous;
        let buffer = [];
        const result = [];
        for (const token of tokenize(input)) {
            let current = detect(token);
            if (previous) {
                if (previous.index === current.index) {
                    buffer.push(token);
                    previous = current;
                    continue;
                }
                result.push(tryDecode(buffer, previous.index));
            }
            buffer = [token];
            previous = current;
        }
        result.push(tryDecode(buffer, previous.index));
        return result;
    };

    const decode = (input, type) => {
        if (!type) {
            return auto(input);
        }
        const decoder = core[type];
        const decoded = !decoder.valid((input = input.trim())) ? null : decoder.decode(input);
        return [{type, value: decoded, url: isUrl(decoded)}];
    };

    const encode = (input, type) => [{type, value: core[type].encode(input.trim())}];

    return {order, encode, decode, ...core};
}
