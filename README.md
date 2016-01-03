
ZiXue player
============
This HTML5 video player is built to facilitate study of Standard Chinese and Chinese script. It accepts local
video and subtitle files and transcribes simplified or traditional Chinese subtitles to Pinyin and offers on
demand dictionary lookup of individual characters and words.

Live install
============
This player is available at [http://tuxbabe.eu/zixue.html](http://tuxbabe.eu/zixue.html)

Development install
===================
* install Git
  * Linux: use your package manager
  * Mac: http://git-scm.com/download
  * Windows: https://git-for-windows.github.io
* install npm
  * run installer from https://nodejs.org
* get project
  > git clone https://github.com/tuxyme/zixue.git
* install packages
  > npm install
* start local webserver
  > gulp serve
* open in browser
  * http://localhost:9900

License
=======
Eric 2016, GNU GPLv2 - see LICENSE 

The player dynamically loads the
[CC-CEDICT dictionary](https://www.mdbg.net/chindict/chindict.php?page=cedict) by MDBG. 
MDBG uses a Creative Commons Share-Alike license for this file.
