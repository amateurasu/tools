'use strict';
((d, w, ed) => {
    //region declare
    const input = $('#input');
    const output = $('#output');
    const btn = {
        clear: $("#clear"),
        go: $("#go"),
        copy: $("#copy")
    };
    const nav = {
        div: $("#side-nav"),
        open: $(".open-nav"),
        close: $(".close-nav"),
        overlay: $(".overlay")
    };
    const notification = $("#notify");

    const standards = ed.standards;
    const sync = {left: !1, right: !1};
    let encode = {
        id: "detect",
        prefix: "en_",
        div: $("#encrypt"),
        list: standards,
        autoDetect: !0
    };
    let decode = {
        id: "txt",
        prefix: "de_",
        list: standards,
        div: $("#decrypt")
    };
    let drop = {
        div: $("#drop-ctn"),
        all: $("#all-crypt"),
        recent: $("#recent-crypt"),
        close: $("#drop-close"),
        ed: "",
        init: !1
    };
    //endregion declare

    // region translating
    const convert = () => {
        const result = process(input.val().trim());
        resetCrypt(encode, result.id);
        resetCrypt(decode, decode.id);
        checkOutput(result.txt);
    };

    const process = input => {
        if (!encode.autoDetect) {
            return {id: encode.id, txt: ed.decode(ed[encode.id], input)};
        }

        let list = ed.order;
        for (let i of list) {
            const txt = ed.decode(ed[i], input);
            if (txt !== null) return {id: ed[i].id, txt};
        }
    };

    const translate = input => ed.encode(ed[decode.id], input);

    const checkOutput = out => {
        if (out === "") {
            hide(btn.copy, notification)
        } else if (out) {
            out = translate(out);
            const nospace = out.replace(/\s/g, "");
            show(btn.copy, btn.clear);
            hide(notification);
            if (ed.uri.validUrl(nospace)) {
                out = nospace;
                btn.go.removeClass("hidden")
            } else {
                hide(btn.go)
            }
        } else {
            hide(btn.copy);
            notify("<strong>Error!</strong> Data was not properly encrypted!");
        }
        output.html(out);
    };

    const populate = ed => {
        ed.div.html("").append($("<a>", {
            id: `${ed.prefix}choose`, "class": `choose_crypt a-icon a-down`
        }).click(showCryptTable));

        if (ed === encode) {
            ed.div.append($("<a>", {id: "en_detect", "class": "active crypt_detect"})
                .text("AUTO DETECT").on("click", changeDetect));
        }
        ed.list.forEach(id => {
            let element = $("<a>", {id: ed.prefix + id, "class": `crypt_${id}`})
                .text(ed[id].name.toUpperCase()).on("click", changeCrypt);
            ed.div.append(element)
        });
        $(`#${ed.prefix}${ed.id}`).addClass("active")
    };

    const isOverflow = e => e.prop("scrollWidth") > e.prop("clientWidth") || e.prop("scrollHeight") > e.prop("clientHeight");

    const resetCrypt = (ed, id) => {
        id = id || ed.id;
        let idx = ed.list.indexOf(id);
        let overflow = isOverflow(ed.div);
        if (overflow) {
            (idx < 0) ? ed.list.pop() : ed.list.splice(idx, 1);
            ed.list.unshift(id);
            populate(ed);
        } else if (ed.list.indexOf(id) < 0) {
            ed.list.pop();
            ed.list.unshift(id);
            populate(ed);
        }

        ed.div.find(".active").removeClass("active");
        $(`#${ed.prefix}${id}`).addClass("active");

        if (ed === encode) $("#en_detect").css({"color": encode.autoDetect ? "#438dff" : "#666666"});
        localStorage.setItem(`${ed.prefix}list`, JSON.stringify(ed.list));
    };
    //endregion translating

    //region event handling
    const clear = () => {
        input.val("");
        output.val("");
        hide(btn.go, btn.clear, btn.copy);
    };
    input.on("input propertychange paste", convert)
        .on("dblclick", clear)
        .on("scroll", () => {
            if (!sync.left) {
                sync.right = !0;
                output.scrollTop(input[0].scrollTop);
            }
            sync.left = !1;
        });

    output.on("scroll", () => {
        if (!sync.right) {
            sync.left = !0;
            input.scrollTop(output[0].scrollTop);
        }
        sync.right = !1;
    });

    const changeDetect = e => {
        event(e);
        if ($(w).width() < 768) return showCryptTable(e);
        encode.autoDetect = !0;
        encode.div.find(".active").removeClass("active");
        $("#en_detect").addClass("active").css({"color": "#2572EB"});
        convert()
    };

    const changeCrypt = e => {
        event(e);
        if ($(w).width() < 768) return showCryptTable(e);
        let [ed, id] = e.target.id.split("_");
        if (ed === "en") {
            ed = encode;
            encode.autoDetect = !1;
            $("#en_detect").css({"color": "#666666"});
        } else {ed = decode;}
        ed["id"] = id;
        convert()
    };

    const showCryptTable = e => {
        event(e);

        if (!drop.init) {
            initializeDrop(drop.all, ed.decodeOrder().sort());
            drop.init = !0;
        }
        drop.ed = e.target.id.substr(0, 2);
        initializeDrop(drop.recent, ((drop.ed === "en") ? encode : decode).list);

        show(drop.div)
    };

    const initializeDrop = (dom, list) => {
        dom.html("");
        list.forEach(e => dom.append($(`<li>`, {id: `choice_${e}`, "class": "choice col-m-4 col-3"})
            .text(ed[e].name).click(makeChoiceCrypt)));
    };

    const makeChoiceCrypt = e => resetCrypt(drop.ed === "en" ? encode : decode, e.target.id.substr(7));

    drop.close.click(e => hide(drop.div));
    $(w).click(e => hide(drop.div));

    $("#swap").on("click", e => {
        let s = encode.id === "detect" ? "txt" : encode.id;
        encode.id = decode.id;
        encode.autoDetect = !1;
        decode.id = s;
        input.val(output.val());
        convert();
    });

    btn.copy.on("click", () => {
        output.select();
        document.execCommand('copy');
    });

    btn.clear.on("click", clear);

    nav.open.on("click", e => {
        event(e);
        nav.div.addClass("nav-show");
        show(nav.overlay);
        $("#container").addClass("off-canvas");
    });

    nav.close.on("click", e => {
        event(e);
        nav.div.removeClass("nav-show");
        hide(nav.overlay);
        $("#container").removeClass("off-canvas");
    });

    btn.go.on("click", e => {
        event(e);
        let link = output.val();
        if (!link.startsWith("http")) link = "http://" + link;
        w.open(link, '_blank')
    });

    $(".btn-close").click(e => {
        event(e);
        hide(notification);
    });

    const event = e => {
        e.stopPropagation();
        e.preventDefault();
    };

    const hide = (...ele) => ele.forEach(e => e.addClass("hidden"));
    const show = (...ele) => ele.forEach(e => e.removeClass("hidden"));

    const notify = msg => {
        show(notification);
        $("#msg-content").html(msg);
    };
    //endregion event handling

    //region initialization
    if (w.File && w.FileReader && w.FileList && w.Blob) {
        input.on("dragenter", e => {
            event(e);
            input.css({"border": "2px dashed blue"});
            e.originalEvent.dataTransfer.dropEffect = "copy";
        }).on("dragleave dragend mouseout drop", e => {
            event(e);
            input.css({"border": "none"});
            try {
                const files = e.originalEvent.dataTransfer.files;
                const reader = new FileReader();
                reader.onload = evt => {
                    input.val(evt.target.result);
                    convert();
                };
                reader.readAsText(files[0], "UTF-8");
            } catch (e) {}
        });
    } else {
        alert('The File APIs are not fully supported in this browser.');
    }

    if (typeof Storage !== "undefined") {
        encode.list = JSON.parse(localStorage.getItem("en_list")) || standards;
        decode.list = JSON.parse(localStorage.getItem("de_list")) || standards;
        encode.autoDetect = localStorage.getItem("autoDetect") || encode.autoDetect;
    }

    populate(encode);
    populate(decode);

    if (input.val()) show(btn.clear);

    let getParam = () => {
        let param = document.location.search;
        return !param ? null : param.substr(1).split('&').map(k => k.split('=')).reduce((m, o) => {
            if (o[0] && o[1]) m[ed.uri.de(o[0])] = ed.uri.de(o[1]);
            return m;
        }, {});
    };
    let params = getParam();
    if (params && params["q"]) {
        input.val(params["q"]);
        convert();
    }
    //endregion initialization
})(document, window, ED());
