function Core() {
    const split = (input, i) => (input.search(" ") !== -1
        ? input.split(" ") : input.match(new RegExp(`.{${i}}`, "g"))) || [input];

    const maps = [
        ['kh', 'x'], ['nh', 'n\''], ['c(?!h)', 'k'], ['th', 'w'], ['q', 'k'], ['ngh?', 'q'], ['gh', 'g'],
        ['ph', 'f'], ['tr', 'c'], ['ch', 'c'], ['d', 'z'], ['gi', 'z'], ['r', 'z'], ['đ', 'd']
    ];

    this.standards = () => ["txt", "b64", "hex"];
    this.decodeOrder = () => ["bin", "hex", "b64", "uri", "uni", "vie", "txt"];

    this.bin = {
        id: "bin",
        name: "Binary",
        valid: input => /^(?:[01]{1,8}\s*)+$/.test(input.replace(/\s/g, "")),
        de: input => {
            const arr = split(input, 8);
            let finalStr = "";
            for (let i = 0; i < arr.length; i++) {
                finalStr += String.fromCharCode(parseInt(arr[i], 2));
            }
            return finalStr;
        },
        en: input => {
            let output = "";
            const pad = "00000000";
            for (let i = 0; i < input.length; i++) {
                const str = input[i].charCodeAt(0).toString(2);
                output += pad.substring(0, 8 - str.length) + str;
            }
            return output;
        }
    };

    this.hex = {
        id: "hex",
        name: "Hex",
        valid: input => /^(?:[0-9A-Fa-f]{2}\s*)+$/.test(input),
        de: input => {
            const s = split(input, 2);
            let str = "";
            for (let i = 0; i < s.length; i++) {
                str += String.fromCharCode(parseInt(s[i], 16));
            }
            const s_cape = window.escape || encodeURIComponent;
            try {
                return decodeURIComponent(s_cape(str));
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
    };

    this.b64 = {
        id: "b64",
        name: "Base 64",
        valid: input => /^(?:[\w+\/]{4})*(?:[\w+\/]{4}|[\w+\/]{3}=|[\w\/]{2}==)$/.test(input.replace(/\s/g, "")),
        de: input => {
            let d = atob(input);
            try {
                return decodeURIComponent(d.split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
            } catch (e) {
                console.log(`data:image/jpeg;base64,${input}`);
                return null;
            }
        },
        en: input => btoa(encodeURIComponent(input)
            .replace(/%([0-9A-F]{2})/g, (match, p1) => String.fromCharCode(`0x${p1}`)))
    };

    this.uri = {
        id: "uri",
        name: "URI",
        valid: input => !/\s/.test(input) && this.uri.de(input) !== null,
        validUrl: input => /^((https?|ftp):\/\/)?\w+([\-.]\w+)*\.[a-z0-9]{2,5}(:[0-9]{1,5})?(\/.*)?$/i.test(input),
        de: input => {
            try {
                return decodeURIComponent(input.replace(/\+/g, " "))
            } catch (e) {
                return null;
            }
        },
        en: input => encodeURIComponent(input).replace(/'/g, "%27").replace(/"/g, "%22")
    };

    this.vie = {
        id: "vie",
        name: "New Vietnamese",
        valid: () => true,
        // "Bạn đùa à? Cái thứ này thì dịch thế đ** nào được!"
        de: () => null,
        en: input => maps.reduce((result, map) => input.replace(new RegExp(map[0], 'g'), map[1])
            .replace(new RegExp(map[0].toUpperCase(), 'g'), map[1].toUpperCase()), input)
    };

    this.uni = {
        id: "txt",
        name: "Unicode",
        valid: input  => /^(?:(?:\\u[0-9a-fA-F]{4}|\w)?[ !'#$%&"()*+-.,\/\\:;<=>?@[\]^_`{|}~]?)*$/g.test(input),
        de: input => {
            let off = 0;
            const len = input.length;
            let out = "";

            while (off < len) {
                let c = input.charAt(off++);
                if (c !== '\\') {
                    out += c;
                    continue;
                }
                c = input.charAt(off++);
                if (c === 'u') {
                    let value = 0;
                    for (let i = 0; i < 4; i++) {
                        c = input.charAt(off++);
                        let code = c.charCodeAt(0);
                        switch (c) {
                            case '0':
                            case '1':
                            case '2':
                            case '3':
                            case '4':
                            case '5':
                            case '6':
                            case '7':
                            case '8':
                            case '9':
                                value = (value << 4) + code - 48;
                                break;
                            case 'a':
                            case 'b':
                            case 'c':
                            case 'd':
                            case 'e':
                            case 'f':
                                value = (value << 4) + 10 + code - 97;
                                break;
                            case 'A':
                            case 'B':
                            case 'C':
                            case 'D':
                            case 'E':
                            case 'F':
                                value = (value << 4) + 10 + code - 65;
                                break;
                            default:
                                throw "Malformed \\uXXXX encoding.";
                        }
                    }
                    out += String.fromCharCode(value);
                } else {
                    switch (c) {
                        case 't':
                            out += '\t';
                            break;
                        case 'r':
                            out += '\r';
                            break;
                        case 'n':
                            out += '\n';
                            break;
                        case 'f':
                            out += '\f';
                            break;
                    }
                }
            }
            return out;
        },
        en: input => {
            let sb = "";
            const pad = "0000";
            try {
                const len = input.length;
                for (let i = 0; i < len; i++) {
                    const code = input.charCodeAt(i);
                    const char = input.charAt(i);
                    if (code > 61 && code < 127) {
                        if (code === '\\') {
                            sb += '\\\\';
                            continue;
                        }
                        sb += char;
                        continue;
                    }
                    switch (code) {
                        case ' ':
                            sb += " ";
                            break;
                        case '\t':
                            sb += "\\t";
                            break;
                        case '\n':
                            sb += "\\n";
                            break;
                        case '\r':
                            sb += "\\r";
                            break;
                        case '\f':
                            sb += "\\f";
                            break;
                        case '=':
                        case ':':
                        case '#':
                        case '!':
                            sb += "\\" + char;
                            break;
                        default:
                            if (code < 0x0020 || code > 0x007e) {
                                const s = code.toString(16).toUpperCase();
                                sb += "\\u" + pad.substr(0, 4 - s.length) + s;
                            } else {
                                sb += char;
                            }
                    }
                }
            } catch (e) {}
            return sb;
        }
    };

    this.txt = {
        id: "txt",
        name: "Text",
        valid: () => true,
        de: input => input,
        en: input => input
    };

    this.decode = (core, input) => {
        if (!core.valid(input = input.trim())) return null;

        const result = core.de(input);
        return this.uri.valid(result) ? this.uri.de(result) : result
    };

    this.encode = (core, input) => core.en(input.trim());
}
