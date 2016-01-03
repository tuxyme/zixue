var database = (function() {
    "use strict";

    var me = {};
    var db = null;

    var NAME = 'cin';
    var CHAR = 'character';
    var NVPAIR = 'nvpair';
    var version = 4;
    var data = null;

    me.CHAR = CHAR;
    me.NVPAIR = NVPAIR;

    me.initialized = function() {
        return db != null;
    };

    me.clear = function(cbToppie, cbFail) {
        var req = window.indexedDB.deleteDatabase(NAME);
        req.onsuccess = function () {
            cbToppie && cbToppie();
        };
        req.onerror = function (error) {
            cbFail && cbFail(error);
        };
        req.onblocked = function () {
            cbFail && cbFail('failed to delete database, operation blocked');
        };
    };

    me.initialize = function(cbReady, cbFail) {
        var openRequest = window.indexedDB.open(NAME, version);

        openRequest.onsuccess = function(e) {
            db = e.target.result;
            db.onerror = function(event) {
                console.log('database error', event.target);
            };
            cbReady && cbReady();
        };

        openRequest.onerror = function(event) {
            cbFail && cbFail(event.target.error);
        };

        openRequest.onupgradeneeded = function(e) {
            console.log('upgrading db ' + NAME + ' from ' + e.oldVersion + ' to ' + e.newVersion);
            var db = e.target.result;
            try {
                var c_store = db.createObjectStore(CHAR, { autoIncrement : true });
                c_store.createIndex("simp", "simp", { unique: false });
                c_store.createIndex("trad", "trad", { unique: false });
            } catch (e) {
                console.log('non-fatal error', e);
            }
            try { // unused
                var nv_store = db.createObjectStore(NVPAIR, { autoIncrement : true });
                nv_store.createIndex("name", "name", { unique: true });
            } catch (e) {
                console.log('non-fatal error', e);
            }
        }
    };

    /*
     * returns array of results from index(key)
     */
    me.retrieve = function(store, key, indexName, cbResult) {
        var singleKey = IDBKeyRange.only(key);
        var res = [];
        try {
            db.transaction(store).objectStore(store).index(indexName).openCursor(singleKey).onsuccess = function (event) {
                if (event.target.result) {
                    res.push(event.target.result.value);
                    event.target.result.continue();
                } else
                    cbResult && cbResult(res);
            };
        } catch (e) {
            console.log('error retrieving data', e);
        }
    };


    me.update = function(store, item, cbResult) {
        var req =  db.transaction(store, "readwrite").objectStore(store).put(item);
        req.onsuccess = function(event) {
            cbResult && cbResult();
        };
    };

    me.getCount = function(store, cbReady) {
        var store = db.transaction(store).objectStore(store);
        var cnt = 0;

        store.openCursor().onsuccess = function(event) {
            var cursor = event.target.result;
            if (cursor) {
                cnt++;
                cursor.continue();
            } else
                cbReady && cbReady(cnt);
        };
    };


    me.entryCount = function(store, cbReady) {
        var store = db.transaction(store).objectStore(store);
        var count = store.count();
        count.onsuccess = function() {
            console.log('db entries: ', count.result);
            cbReady && cbReady(count.result);
        };
    };

    me.deleteStore = function(store, cbReady) {
        var store = db.transaction(store).objectStore(store);
        var delaction = store.delete();
        delaction.onsuccess = function () {
            cbReady && cbReady(true);
        };
        delaction.onerror = function () {
            cbReady && cbReady(false);
        };
        delaction.onblocked = function () {
            cbReady && cbReady(false);
        };
    };

    me.loadData = function(fileName, store, cbReady) {
        if (store == CHAR)
            __.readTextFile(fileName, function(data){
                console.log("char length " + data.length);
                var lines = data.split('\n');
                var count = 0;
                var regex = /^([^\s]+)\s+([^\s]+)\s+\[([^\]]+)\]\s+\/(.*)\/\s*$/;
                var store = db.transaction(CHAR, "readwrite").objectStore(CHAR);
                /* regex matches
                 *  0: total match
                 *  1: traditional (1 or more chars)
                 *  2: simplified (1 or more chars)
                 *  3: pinyin with tone numbers, separated by space
                 *  4: translations, separated by /
                 */

                lines.forEach(function(line){
                    var matches = line.match(regex);
                    matches ? matches.splice(0,1) : '';
                    if (matches && matches.length != 4)
                        console.log(matches);
                    else if (matches) { // TODO matches[1].length < 4
                        if (matches[1].length <= 6) {
                            var data = {
                                trad: matches[0],
                                simp: matches[1],
                                piny: matches[2],
                                tran: matches[3].split('/')
                            };
                            //console.log(matches[1]);
                            store.add(data);
                            count ++;
                        }
                        else console.log('ignored 6+ char dict line', line);
                    }
                    else if (!matches)
                        console.log('ignored dict line', line);
                });
                console.log('DONE PARSING, character count: ' + count);
                cbReady && cbReady();
            });
    };

    return me;

}.call(this));
