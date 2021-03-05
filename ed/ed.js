if (typeof atob === "undefined") {
    atob = input => Buffer.from(input, "base64").toString("UTF-8");
    btoa = input => Buffer.from(input, "UTF-8").toString("base64");
}

function ED() {
    const order = ["bin", "hex", "b64", "uni", "uri", "txt"];

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
        //prettier-ignore
        switch (c) {
            case "0": case "1": case "2": case "3": case "4": case "5": case "6": case "7": case "8": case "9":
                return (value << 4) + code - 48;
            case "a": case "b": case "c": case "d": case "e": case "f":
                return (value << 4) + code - 87;
            case "A": case "B": case "C": case "D": case "E": case "F":
                return (value << 4) + code - 55;
            default:
                throw "Malformed \\uXXXX encoding.";
        }
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
        //prettier-ignore
        switch (code) {
            case " ":  return " ";
            case "\t": return "\\t";
            case "\n": return "\\n";
            case "\r": return "\\r";
            case "\f": return "\\f";
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
                let output = [];
                for (let i in input) {
                    output.push(input.charCodeAt(i).toString(2).padStart(8, "0"));
                }
                return output.join(" ");
            },
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
                input = decodeURIComponent(encodeURIComponent(input));
                let result = "";
                for (let i = 0; i < input.length; i++) {
                    result += input.charCodeAt(i).toString(16);
                }
                return result.toUpperCase();
            },
        },

        b64: {
            id: "b64",
            name: "Base 64",
            valid: input => /^(?:[\w+\/]{4})*(?:[\w+\/]{4}|[\w+\/]{3}=|[\w\/]{2}==)$/.test(input),
            decode: input => {
                try {
                    //prettier-ignore
                    return decodeURIComponent(
                        atob(input).split("").map(c => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)).join("")
                    );
                } catch (e) {
                    return null;
                }
            },
            encode: input =>
                btoa(encodeURIComponent(input).replace(/%([0-9A-F]{2})/g, (_, p1) => String.fromCharCode(`0x${p1}`))),
        },

        uri: {
            id: "uri",
            name: "URI",
            valid: input => uriDecode(input) !== null,
            decode: uriDecode,
            encode: input => encodeURIComponent(input).replace(/'/g, "%27").replace(/"/g, "%22"),
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
                        if (input.charAt(offset++) === "u") {
                            let value = 0;
                            for (let i = 0; i < 4; i++) {
                                value = fromChar(input.charAt(offset++), value);
                            }
                            out += String.fromCharCode(value);
                        } else {
                            out += unescape(c);
                        }
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
            },
        },

        txt: {id: "txt", name: "Text", valid: () => true, decode: input => input, encode: input => input},
    };

    const detect = (input, from) => {
        for (let i = from || 0; i < order.length; i++) {
            const value = order[i];
            if (core[value].valid(input)) return {index: i, value};
        }
    };

    const tryDecode = (buffer, index) => {
        const str = buffer.join(" ");
        while (true) {
            const type = order[index++];
            const decoded = core[type].decode(str);
            if (decoded) {
                return {type, value: decoded, url: isUrl(decodeURIComponent(decoded))};
            }
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
        let buffer = [];
        let previous;
        for (let i = index; i <= length; i++) {
            if (!/\s/.test(input.charAt(i))) continue;

            const str = input.substring(index, i);
            index = nextNonWhitespace(i);
            let current = detect(str);
            if (previous) {
                if (previous.index === current.index) {
                    buffer.push(str);
                } else {
                    const token = {buffer, type: previous};
                    buffer = [str];
                    yield token;
                }
            } else {
                buffer = [str];
            }
            previous = current;
        }
        buffer.push(input.substring(index, length + 1));
        yield {buffer, type: previous};
    };

    const auto = input => {
        const result = [];
        for (const {buffer, type} of tokenize(input)) {
            result.push(tryDecode(buffer, type.index));
        }
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

const ed = ED();
const bin = ed.encode("http://fb.com", "bin")[0].value;
const b64 = ed.encode("http://fb.com", "b64")[0].value;
const le = ed.encode("Lê", "b64")[0].value;
const hex = ed.encode("http://fb.com", "hex")[0].value;
const uri = ed.encode("http://fb.com", "uri")[0].value;
const uni = ed.encode("Lê Minh Đức", "uni")[0].value;

const src = `Một đoạn text bằng\r\ntiếng Việt ${bin} ${b64} ${hex} ${uni} ${le} TMOq ${uri}`;

const test = (src) => {
    console.log(src);
    for (const {type, value} of ed.decode(src)) {
        console.log(`${type} -> '${value}'`);
    }
}

test(src)
console.log("-----------------------------------------------");
test(`Một đoạn text bằng 
tiếng Việt 01101000 01110100 01110100 01110000 00111010 00101111 00101111 01100110 01100010 00101110 01100011 01101111 01101101 aHR0cDovL2ZiLmNvbQ== 687474703A2F2F66622E636F6D http://fb.com/\u0110\u1EE9c http%3A%2F%2Ffb%20.com`)