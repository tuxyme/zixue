
(function() {
    "use strict";

    var controls = (function(){
        var ctrl = {};
        var cmd = {};

        var video, play, volume, rate, progress, progressBar;
        var curTime, totTime;

        var vidConfig = {
            previewTime: 0.01,
            autopause: false,
            showsubs: false
        };

        var vidState = {
            preview: false, // video paused on previewTime
            lastTime: 0, // last currentTime value
            subTime: 0, // currentTime of last translation
            replayTime: 0 // currentTime of replay click
        };

        // workaround for missing oncuechange support (firefox)
        var cueChangeWorkaround = (function(){
            var me = {};
            var cueChangeHandler = null;
            var textTrack = null;
            var cueID = -1;

            // on subtitle change, changeHandler(track) will be called
            me.enable = function(changeHandler, track) {
                cueChangeHandler = changeHandler;
                textTrack = track;
                cueID = -1;
            };

            // disables this workaround
            me.disable = function() {
                cueChangeHandler = null;
                textTrack = null;
                cueID = -1;
            };

            // call to check for subtitle change and trigger cueChangeHandler if needed
            me.poll = function() {
                if (textTrack && textTrack.activeCues.length > 0 && cueID != textTrack.activeCues[0].id) {
                    cueID = textTrack.activeCues[0].id;
                    cueChangeHandler && cueChangeHandler(textTrack);
                }
            };

            return me;
        }.call());

        function playButton(playing) {
            play.className = playing ? 'playing' : '';
        }
        /*
            toggle between play and pause (pauseOption) or play and stop (!pauseOption)
         */
        function togglePlay(pauseOption) {
            if (isNaN(video.duration)) return;

            if (vidState.preview) { // start at beginning
                vidState.preview = false;
                video.currentTime = 0;
            }

            if ((video.paused || video.ended) && pauseOption) {
                video.play();
                playButton(true);
                vidState.replayTime = 0;
            } else if (pauseOption) {
                video.pause();
                playButton(false);
            } else if (!pauseOption) {
                video.pause();
                video.currentTime = 0;
                progress.value = 0;
                playButton(false);
            }
        }

        function doPlay() {
            if (isNaN(video.duration)) return;

            if (vidState.preview) { // start at beginning
                vidState.preview = false;
                video.currentTime = 0;
            }

            if (video.paused || video.ended) {
                video.play();
                playButton(true);
                vidState.replayTime = 0;
            }
        }

        function doPause() {
            video.pause();
            playButton(false);
        }

        ctrl.loadVideo = function(videoURL) {
            video.src = videoURL;
            video.pause();
            // allow some time to load, then set previewTime and check wether video was accepted
            window.setTimeout(function(){
                video.currentTime = vidConfig.previewTime;
                vidState.preview = true;
                if (video.networkState == HTMLMediaElement.NETWORK_NO_SOURCE)
                    alert('This video cannot be played in your browser. See info section "Browser Support"');
            }, 500);
        };

        ctrl.loadSubtitle = function(subURL, lang) {
            var track = document.createElement('track');
            track.setAttribute('kind', "subtitles");
            track.setAttribute('srclang', lang);
            video.appendChild(track);
            track.src = subURL;
            // allow some time to load, the set showing, triggering texttrack change event
            window.setTimeout(function(){
                for (var i = 0; i < video.textTracks.length; i++)
                    video.textTracks[i].mode = 'showing';
            }, 500);
        };

        ctrl.flushTracks = function() {
            // remove all tracks
            var tracks = video.getElementsByTagName('track');
            for (var i=0; i<tracks.length; i++)
                tracks[i].remove(); // TODO live collection, check
        };

        function init() {
            video = document.getElementById('video');
            volume = document.getElementById('volume');
            rate = document.getElementById('rate');
            play = document.getElementById('play');
            progress = document.getElementById('progress');
            progressBar = document.getElementById('progress-bar');
            curTime = document.getElementById('curTime');
            totTime = document.getElementById('totTime');

            // play demo
            document.getElementById('demoplay').addEventListener('click', function(){
                translator.loadDemoDict(function(){
                    ctrl.flushTracks();
                    ctrl.loadVideo('./numbers.mp4');
                    ctrl.loadSubtitle('./numbers.vtt', 'zhs');
                    introInfo.show(false);
                });
            });

            video.controls = false;

            __.apply('button', function(button){
                button.addEventListener('click', function(e){
                    cmd[e.target.id] && cmd[e.target.id](e.target);
                });
            });

            cmd.play = function(button) {
                togglePlay(true);
            };

            cmd.stop = function(button) {
                togglePlay(false);
            };

            cmd.autopause = function(button) {
                vidConfig.autopause = !vidConfig.autopause;
                button.className = vidConfig.autopause ? 'active' : '';
            };

            cmd.showsubs = function(button) {
                vidConfig.showsubs = !vidConfig.showsubs;
                button.className = vidConfig.showsubs ? 'active' : '';
                video.className = vidConfig.showsubs ? '' : 'nocue';
            };

            cmd.info = function(button) {
                introInfo.show(!introInfo.isVisible());
            };

            cmd.replay = function(button) {
                if (vidState.replayTime == 0)
                    vidState.replayTime = video.currentTime;
                video.currentTime = vidState.subTime - 1;
                if (video.paused || video.ended) {
                    video.play();
                    playButton(true);
                }
            };

            cmd.back05 = function(button) {
                video.currentTime = video.currentTime - 5;
            };

            cmd.back10 = function(button) {
                video.currentTime = video.currentTime - 10;
            };

            cmd.back30 = function(button) {
                video.currentTime = video.currentTime - 30;
            };

            cmd.speaker = function(button) {
                video.muted = !video.muted;
                button.className = video.muted ? 'muted' : '';
            };

            volume.value = Math.floor(video.volume * 100);
            volume.addEventListener('change', function(e) {
                video.volume = volume.value / 100;
            });

            rate.addEventListener('change', function(e) {
                video.playbackRate = e.target.value;
            });

            var alterVolume = function(dir) {
                var currentVolume = Math.floor(video.volume * 10) / 10;
                if (dir === '+') {
                    if (currentVolume < 1) video.volume += 0.1;
                }
                else if (dir === '-') {
                    if (currentVolume > 0) video.volume -= 0.1;
                }
            };

            video.addEventListener('error', function(error) {
                console.log('error', error);
            });

            video.addEventListener('loadedmetadata', function() {
                progress.setAttribute('max', video.duration);
                totTime.innerHTML = timeFormat(video.duration);
            });

            video.addEventListener('timeupdate', function() {
                progress.value = video.currentTime;
                curTime.innerHTML = timeFormat(video.currentTime);
                if (video.currentTime > vidState.replayTime && vidState.lastTime < vidState.replayTime)
                    doPause();
                vidState.lastTime = video.currentTime;
                progressBar.style.width = Math.floor((video.currentTime / video.duration) * 100) + '%';

                cueChangeWorkaround.poll();
            });

            video.addEventListener('ended', function() {
                playButton(false);
            });

            progress.addEventListener('click', function(e) {
                var pos = (e.pageX  - this.offsetLeft) / this.offsetWidth;
                video.currentTime = pos * video.duration;
            });

            progress.addEventListener('mousemove', function(e) {
                var pos = (e.pageX  - this.offsetLeft) / this.offsetWidth;
                progress.dataset.hovertime = timeFormat(pos * video.duration);
            });

            if (video.textTracks) {
                video.textTracks.onchange = function(e){
                    var activeTrack = null;
                    var len = e.target.length;
                    for (var i=0; i<len; i++) // all valid tracks, showing
                        activeTrack = e.target[i].language.indexOf('zh') == 0 ? e.target[i] : activeTrack;

                    if (activeTrack) {
                        translator.setScript(activeTrack.language);
                        console.log('transcribing track', activeTrack);

                        /* obj: oncuechange event or textTrack */
                        var ccHandler = function(obj) {
                            var track = obj instanceof Event ? obj.target : obj;
                            len = track.activeCues.length;
                            var line = '';
                            for (var i=0; i<len; i++) {
                                line = line != '' ? line + ' / ' : '';
                                line += track.activeCues[i].text;
                            }
                            translator.translate(line, function(tr){
                                if (tr.succ) {
                                    // do not change subTime when replay is active
                                    if (!vidState.replayTime)
                                        vidState.subTime = video.currentTime;
                                    var chin = '';
                                    for (var i=0; i<line.length; i++)
                                        chin += "<span>" + line[i] + "</span>";
                                    setLangFields(chin, tr.pinyin, tr.eng);
                                    if (vidState.replayTime == 0 && vidConfig.autopause)
                                        setTimeout(function(){
                                            doPause();
                                        }, 1200);
                                }
                            });
                        };

                        if ('oncuechange' in activeTrack) {
                            cueChangeWorkaround.disable();
                            activeTrack.oncuechange = ccHandler;
                        }
                        else
                            cueChangeWorkaround.enable(ccHandler, activeTrack);
                    }
                };
            }
        }

        document.addEventListener("DOMContentLoaded", init);

        return ctrl;
    }.call());

    var introInfo = (function() {
        var me = {};
        var intro = null;
        var button = null;
        var shown = false;

        me.show = function(visible) {
            if (intro == null) init();

            if (visible) {
                intro.classList.add('show');
                button.classList.add('active');
                shown = true;
            } else {
                intro.classList.remove('show');
                button.classList.remove('active');
                shown = false;
            }
        };

        me.isVisible = function() {
            return shown;
        };

        var init = function(){
            intro = document.querySelector('#intro_info');
            button = document.querySelector('#info');
        };

        return me;
    }.call());


    function introProcess(action) {
        var intro = document.querySelector('#intro_proc');
        switch(action) {
            case 'show' : intro.classList.add('show');
                break;
            case 'hide' : intro.classList.remove('show');
                break;
        }
    }

    var setLangFields = function(){}; // missing c++

    function onReady() {
        var fileInput = document.querySelector('input[type="file"]');
        var d_trbox = document.querySelector('#trbox');
        var d_cntext = document.querySelector('#cn_text .subtext');
        var d_pytext = document.querySelector('#py_text .subtext');
        var d_entext = document.querySelector('#en_text .subtext');

        translator.onReady(function(){
            if (!translator.dictLoaded())
                introInfo.show(true);
        });

        /* *
         * * video and subtitle file handling
         * */

        document.getElementById('files').addEventListener('click', function(e){
            fileInput.click();
        });

        /* read data from file, call cbData(data) when done.
         * encoding = character encoding, null results in binary read
         */
        function readFile(file, encoding, cbData) {
            var reader = new FileReader();
            reader.onload = function(e) {
                cbData && cbData(reader.result);
            };
            if (!encoding)
                reader.readAsBinaryString(file);
            else
                reader.readAsText(file, encoding);
        }

        function processFile(file) {
            if (__.getMimeType(file.type) == 'video')
                controls.loadVideo(URL.createObjectURL(file));

            // get file language and ext from file name, default language is zhs
            var meta = __.getFileMeta(file.name);

            if (meta.ext == 'vtt') {
                meta.lang = meta.lang ? meta.lang : 'zhs';
                controls.loadSubtitle(URL.createObjectURL(file), meta.lang);
            }

            if (meta.ext == 'srt') {
                meta.lang = meta.lang ? meta.lang : 'zhs';
                // read binary to sense encoding
                readFile(file, null, function(data){
                    var detcs = jschardet.detect(data);
                    var encoding = detcs.confidence > 0.4 ? detcs.encoding : 'UTF-8';
                    // read subtitles using detected encoding
                    readFile(file, encoding, function(text){
                        var subURL = subTransform.textToObjectURL(subTransform.srt2webvtt(text));
                        controls.loadSubtitle(subURL, meta.lang);
                    });
                });
            }

            return meta.lang;
        }

        fileInput.onchange = function(event){
            clearText();

            // flush tracks when user selected video
            [].forEach.call(event.target.files, function(file){
                if (__.getMimeType(file.type) == 'video') {
                    controls.flushTracks();
                    processFile(file);
                }
            });

            var cnLoaded = false;

            [].forEach.call(event.target.files, function(file){
                if (!(__.getMimeType(file.type) == 'video'))
                    cnLoaded = processFile(file).indexOf('zh') == 0 || cnLoaded;
            });

            if (cnLoaded && !translator.dictLoaded()) {
                setTimeout(function(){
                    introInfo.show(false);
                    introProcess('show');
                    translator.loadDict(function(){
                        introProcess('hide');
                    });
                }, 500);
            }
        };

        /* *
         * * Textboxes and translation
         * */

        function clearText() {
            d_cntext.innerHTML = '';
            d_pytext.innerHTML = '';
            d_entext.innerHTML = '';
        }

        setLangFields = function(chinese, pinyin, english) {
            d_cntext.innerHTML = chinese;
            d_pytext.innerHTML = pinyin;
            d_entext.innerHTML = english;
        };

        var dict = (function(){
            var me = {};
            var words = null;

            me.lookup = function(word, maxLength, cbResult) {
                words = {trlen: 0, all:[]};
                _lookup(word, maxLength, cbResult);
            };

            function _lookup(word, maxLength, cbResult) {
                translator.findWord(word, maxLength, function(tr){
                    words.all = words.all.concat(tr.word);
                    if (!words.trlen)
                        words.trlen = tr.translated.length;
                    if (tr.translated.length > 1)
                        _lookup(tr.translated, tr.translated.length-1, cbResult);
                    else
                        cbResult(words);
                });
            }

            return me;
        }.call());

        function getDictChars(element) {
            var line = element.innerHTML;
            element = element.nextSibling;
            while (line.length < 6  && element != null) {
                line += element.innerHTML;
                element = element.nextSibling;
            }
            return line;
        }

        function markDictChars(charbox, char, len) {
            for (var i=0; i<charbox.childNodes.length; i++)
                charbox.childNodes[i].className = '';
            var node = char;
            while (len>0 && node) {
                node.className='mark';
                node = node.nextSibling;
                len--;
            }
        }

        d_cntext.addEventListener('mouseover', function(e){
            if (e.target.tagName == 'SPAN') {
                d_trbox.className = 'show';
                var line = getDictChars(e.target);
                dict.lookup(line, line.length, function(words){
                    var txt = '';
                    markDictChars(d_cntext, e.target, words.trlen);
                    words.all.forEach(function(word){
                        txt += '<span class="py">' + numberToMarkLine(word.piny, ' ') + '</span>:';
                        txt += '<span class="en">' + word.tran.join(' / ') + '</span><br>';
                    });
                    d_trbox.innerHTML = txt;
                });
            }
        });

        var d_trboxTimer = null;

        d_cntext.addEventListener('mouseleave', function(e){
            if (d_trboxTimer) return;
            d_trboxTimer = setTimeout(function(){
                d_trbox.className = '';
                d_trboxTimer = null;
            }, 200);
        });

        d_trbox.addEventListener('mouseleave', function(e){
            if (d_trboxTimer) return;
            d_trboxTimer = setTimeout(function(){
                d_trbox.className = '';
                d_trboxTimer = null;
            }, 200);
        });

        d_trbox.addEventListener('mouseover', function(e){
            d_trbox.className = 'show';
            if (d_trboxTimer) {
                clearTimeout(d_trboxTimer);
                d_trboxTimer = null;
            }
        });
    }

    document.addEventListener("DOMContentLoaded", onReady);

}.call());


