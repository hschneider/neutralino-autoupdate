
function onWindowClose() {
    Neutralino.app.exit();
}

// Init Neutralino
//
Neutralino.init();
Neutralino.events.on("windowClose", onWindowClose);

// Set title
//
(async () => {
    await Neutralino.window.setTitle(`Neutralino Autoupdate ${NL_APPVERSION}`);
})();

/* Silent update example:

let AUTOUPDATE = new NeutralinoAutoupdate("https://autoupdate.test/demo/manifest.json");
AUTOUPDATE.checkSilent().then(res => {
    if(res) {
        // Do something then run the update:
        AUTOUPDATE.update();
    }
});

*/

let AUTOUPDATE = new NeutralinoAutoupdate("https://autoupdate.test/demo/manifest.json", {lang: 'en', debug: true});
(async () => {
    await AUTOUPDATE.check();
})();