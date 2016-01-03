/*

 numberToMark:

 https://en.wikipedia.org/wiki/Pinyin#Numerals_in_place_of_tone_marks
 If there is an a or an e, it will take the tone mark.
 If there is an ou, then the o takes the tone mark.
 Otherwise, the second vowel takes the tone mark.

 1: high flat
 2: rising
 3: falling->rising
 4: falling
 5: neutral

 aāáǎàa
 eēéěèe
 iīíǐìi
 oōóǒòo
 uūúǔùu

 */

var _a = ['a','ā','á','ǎ','à','a'];
var _e = ['e','ē','é','ě','è','e'];
var _i = ['i','ī','í','ǐ','ì','i'];
var _o = ['o','ō','ó','ǒ','ò','o'];
var _u = ['u','ū','ú','ǔ','ù','u'];

function numberToMark(pinyin) {
    if (!pinyin || pinyin.length < 2)
        return pinyin;

    var txt = pinyin;
    var tone = Number(txt.substr(-1));
    txt = txt.substr(0,txt.length-1);
    if (isNaN(tone))
        return pinyin;

    if (tone == 5)
        return txt;

    var otxt = txt;
    txt = txt.replace(/a+?/, _a[tone]);
    if (txt != otxt) return txt;
    txt = txt.replace(/e+?/, _e[tone]);
    if (txt != otxt) return txt;
    txt = txt.replace(/(ou)+?/, _o[tone] + 'u');
    if (txt != otxt) return txt;
    txt = txt.replace(/[iou]+?/, function(match){
        switch (match) {
            case 'i' : return _i[tone];
            case 'o' : return _o[tone];
            case 'u' : return _u[tone];
        }
    });
    if (txt != otxt) return txt;

    return pinyin;
}

function numberToMarkLine(pinyin, sep) {
    return pinyin.split(' ').reduce(function(prev, word) {
        prev += prev != '' && sep ? sep : '';
        return prev + numberToMark(word);
    }, '');
}

function timeFormat(secs) {
    var h = Math.floor(secs / 3600);
    secs -= h * 3600;
    var m = Math.floor(secs / 60);
    secs -= m * 60;
    var s = Math.floor(secs);
    return (h>0?h+':':'')+(m<10?'0'+m:m)+':'+(s<10?'0'+s:s);
}

var subTransform = (function(){
    var st = {};

    st.srt2webvtt = function(data) {
        var srt = data.replace(/\r+/g, '');
        srt = srt.replace(/^\s+|\s+$/g, '');

        // get cues
        var cuelist = srt.split('\n\n');
        var result = "";

        if (cuelist.length > 0) {
            result += "WEBVTT\n\n";
            for (var i = 0; i < cuelist.length; i=i+1) {
                result += convertSrtCue(cuelist[i]);
            }
        }

        return result;
    };

    st.textToObjectURL = function(data) {
        var oData = [data];
        var blob = new Blob(oData, {type : 'text/html'});
        return URL.createObjectURL(blob);
    };

    function convertSrtCue(caption) {
        var cue = "";
        var s = caption.split(/\n/);
        var line = 0;

        // detect identifier
        if (!s[0].match(/\d+:\d+:\d+/) && s[1].match(/\d+:\d+:\d+/)) {
            cue += s[0].match(/\w/) + "\n";
            line += 1;
        }

        // get time strings
        if (s[line].match(/\d+:\d+:\d+/)) {
            // convert time string
            var m = s[1].match(/(\d+):(\d+):(\d+)(?:,(\d+))?\s*--?>\s*(\d+):(\d+):(\d+)(?:,(\d+))?/);
            if (m) {
                cue += m[1]+":"+m[2]+":"+m[3]+"."+m[4]+" --> "
                    +m[5]+":"+m[6]+":"+m[7]+"."+m[8]+"\n";
                line += 1;
            } else {
                return "";
            }
        } else {
            return "";
        }

        // get cue text
        if (s[line]) {
            cue += s[line] + "\n\n";
        }

        return cue;
    }

    return st;
}.call());

/*
 * translator.dictLoaded() : is dictionary loaded (not loaded on first start or browser data cleared)
 * translator.loadDict(): load dictionary if not present (only needed when isLoaded returns false)
 */
var translator = (function(){
    "use strict";
    var trans = {};

    var cbReady = null;  // ready callback (moment dictLoaded() is valid)
    var dbReady = false; // dictLoaded is valid
    var dictLoaded = false; // dictionary loaded in indexedDb
    var script = 'simp'; // simp or trad, matching index name in cin db

    /* set script to zhs (simplified chinese, default) or zht (traditional) */
    trans.setScript = function(scr) {
        script = scr == 'zht' ? 'trad' : 'simp';
    };

    trans.dictLoaded = function(){
        return dictLoaded;
    };

    trans.onReady = function(cbFunc) {
        if (dbReady)
            cbFunc && cbFunc();
        else
            cbReady = cbFunc;
    };

    /* return ,?! on match, undefined otherwise */
    var findSpecialChar = function(ch) {
        if (ch == '，')
            return ',';
        if (ch == '…')
            return '...';
        if (ch == '?')
            return '?';
        if (ch == '!')
            return '!';
        if (ch == ' ')
            return ' ';
    };

    /*
     * take the biggest word from beginning of a line of text
     * parameter line: the line of text
     * parameter wordLength: max word length, integer >= 0
     * calls cbResult with { word: [found word], remaining: [remaining part of line] }
     *
     * */
    trans.findWord = function(line, wordLength, cbResult) {
        if (wordLength == 1 && line.length > 0) {
            var ch = findSpecialChar(line.substring(0, 1));
            if (ch) {
                cbResult({word: [{piny: ch, tran: [ch]}], translated: line[0], remaining: line.substring(1)});
                return;
            }
        }
        wordLength = line.length < wordLength ? line.length : wordLength;
        if (line && wordLength > 0 && line.length >= wordLength)
            database.retrieve(database.CHAR, line.substring(0,wordLength), script, function(word) {
                if (word.length == 0)
                    trans.findWord(line, wordLength-1, cbResult);
                else
                    cbResult({word: word, translated: line.substring(0, wordLength), remaining: line.substring(wordLength)});
            });
        else cbResult({word: [], translated: '', remaining: line});
    };

    /* choose a reasonable translation from tran array */
    function chooseFromTran(tran) {
        var candidate = '';
        candidate = tran.length > 0 ? tran[0] : '';
        candidate = (candidate.indexOf('surname')>-1 && tran.length > 1) ? tran[1] : candidate;
        candidate = candidate.replace(/^(.+)\(.+\)(.*)/, '$1 $2');
        return candidate;
    }

    function chooseWord(words) {
        if (words.length == 0) return null;
        var word = words.reduce(function(prev, cur, idx){
            // skipping names and trans starting with: '(' 'old variant'
            if (!prev &&
                !(  cur.piny.substring(0, 1).toUpperCase() == cur.piny.substring(0, 1) ||
                    //cur.tran.length > 0 && cur.tran[0].substring(0,1) == '(' ||
                    cur.tran.length > 0 && cur.tran[0].indexOf('see ') == 0 ||
                    cur.tran.length > 0 && cur.tran[0].indexOf('variant') >= 0
                )) {
                return cur;
            } else
                return prev;
        }, null);

        return word ? word : words[0];
    }

    /* convert line to pinyin
     * call with line and cbResult, leave tr undefined
     */
    var processLine = function(line, cbResult, tr) {
        tr = !tr ? {pinyin: '', eng: '', succ: false} : tr;
        var word = trans.findWord(line, 6, function (result) {
            if (line.length == result.remaining.length) { // no word found
                tr.pinyin += '? ';
                line = line.substring(1);
            } else
                line = result.remaining;

            if (result.word && result.word.length > 0) {
                var selWord = chooseWord(result.word);
                tr.succ = true;
                tr.pinyin += numberToMarkLine(selWord.piny) + ' ';
                tr.eng += chooseFromTran(selWord.tran) + ' ';
            }

            if (line.length == 0) // done
                cbResult(tr);
            else
                processLine(line, cbResult, tr);
        });
    };

    trans.translate = function(line, cbDone) {
        processLine(line, cbDone);
    };

    //=== init ===//

    // load full dictionary
    trans.loadDict = function(cbFunc) {
        database.entryCount(database.CHAR, function(count) {
            if (count <= 100) {
                console.log('loading data into database, may take a while...');
                database.loadData('cedict_ts.u8', database.CHAR, function () {
                    console.log('... done loading data into database');
                    cbFunc && cbFunc();
                });
            } else {
                console.log('database already filled');
                cbFunc && cbFunc();
            }
        });
    };

    // load small demo dictionary
    trans.loadDemoDict = function(cbFunc) {
        database.entryCount(database.CHAR, function(count) {
            if (count <= 0) {
                console.log('loading demo data into database...');
                database.loadData('demo_ts.u8', database.CHAR, function () {
                    console.log('... done loading demo data into database');
                    cbFunc && cbFunc();
                });
            } else {
                console.log('database already contains data');
                cbFunc && cbFunc();
            }
        });
    };


    /*
        Get database ready (database operational, not corrupted, with or without data)

        - dictLoaded is set to true when number of entries > 100
        - if  100 < entries < 111000 (dict with words up to 6 chars) the database is considered corrupt and
          user will be prompted to allow reinitialization
    */

    function checkReady() {
        database.entryCount(database.CHAR, function(count) {
            // db error condition: more objects than demo database but less than full dict
            if (count > 100 && count < 111000) {
                var ok = confirm('previous database load was incomplete, attempt to reinitialize?');
                if (ok === true)
                    reinitialize();
            }
            dictLoaded = count > 100;
            dbReady = true;
            cbReady && cbReady();
        });
    }

    function reinitialize() {
        database.clear(function(){
            location.reload();
        }, function(){
            location.reload();
        });
    }

    // during dev / hot reload database is already initialized at this point
    if (database.initialized())
        checkReady();
    else
        database.initialize(checkReady, function(error) {
            var ok = confirm('database error, attempt to reinitialize?');
            if (ok === true)
                reinitialize();
        });

    return trans;
}.call());
