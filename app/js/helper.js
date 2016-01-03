
var __ = (function() {
    var me = {};

    me.q = function(query) { return document.querySelector(query); };

    /* call func for every node returned by the document node selectors in query */
    me.apply = function(query, func) {
        try {
            var nodes = document.querySelectorAll(query);
            for (var i = 0; i < nodes.length; i++)
                func(nodes[i]);
        } catch (error) {
            console.log('invalid query: ' + query);
        }
    };

    me.getFileExt = function(fileName) {
        return fileName.split('.').pop();
    };

    /* returns zhs or zht when meta is 2/3 letter chinese simp or trad identifier */
    function metaToLang(meta) {
        var cns = " cn cns zhs zs chi chs ";
        var cnt = " cnt zht zt cht ";
        var fmeta = ' ' + meta.toLowerCase() + ' ';
        var fmeta = (cns.indexOf(fmeta) > -1 ? 'zhs' : '') + (cnt.indexOf(fmeta) > -1 ? 'zht' : '');
        return fmeta ? fmeta : meta;
    }

    /* get name, lang, ext from filename name.lang.ext */
    me.getFileMeta = function(fileName) {
        var parts = fileName.split('.');
        var result = {name: '', lang: '', ext: ''};
        switch (parts.length) {
            case 1:
                result.name = parts[0];
                break;
            case 2:
                result.name = parts[0];
                result.ext = parts[1];
                break;
            case 3:
                result.name = parts[0];
                result.lang = metaToLang(parts[1]);
                result.ext = parts[2];
        }
        return result;
    };

    me.getMimeType = function(mime) {
        return mime.split('/').shift();
    };

    me.ajaxGet = function (url, cbDone) {
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.cbDone = cbDone;
        xmlhttp.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200)
                this.cbDone(this.responseText);
        }.bind(xmlhttp);
        xmlhttp.open("GET", url, true);
        xmlhttp.send();
    };

    me.readTextFile = function(fileName, cbData) {
        if (window.cordova) {
            window.resolveLocalFileSystemURL(
                cordova.file.applicationDirectory + 'www/' + fileName,
                function(fileEntry){
                    fileEntry.file(function(file) {

                        var reader = new FileReader();
                        reader.onloadend = function(event) {
                            cbData && cbData(event.target.result);
                        };
                        reader.readAsText(file, 'UTF-8');
                    });
                },
                function(fileError) {
                    console.log('error reading data file www/' + fileName, fileError);
                }
            )
        } else
            __.ajaxGet(fileName, cbData);
    };

    return me;
}.call(this));
