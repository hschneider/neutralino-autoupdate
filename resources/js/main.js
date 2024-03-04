
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
    await Neutralino.window.show();
})();

// Check for update
//
let opt = {
    lang: 'en',
    debug: true,
    arch: 'x64',
    token: 'hB9rV7cS3tD3bU1wA8vY3pQ5fO4qO6sP'
}
let AUTOUPDATE = new NeutralinoAutoupdate("https://autoupdate.test/demo/manifest.php", opt);

(async () => {
    await AUTOUPDATE.check();
})();

/* Silent update example:

let AUTOUPDATE = new NeutralinoAutoupdate("https://autoupdate.test/demo/manifest.json", opt);
AUTOUPDATE.checkSilent().then(updateAvailable => {
    if(updateAvailable) {
        //
        // YOUR CUSTOM CODE HERE:
        // Communicate the available update to the user
        // and launch the update-process:
        //
        AUTOUPDATE.update();
    }
});

*/