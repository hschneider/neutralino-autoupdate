
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

// Check for update
//
let opt = {
    lang: 'en',
    debug: true,
    arch: 'x64',
    token: 'hB9rV7cS3tD3bU1wA8vY3pQ5fO4qO6sP'
}
let AUTOUPDATE = new NeutralinoAutoupdate("https://autoupdate.test/demo/manifest.php", opt);

let langFR = {
    'txtNewVersion': 'Une nouvelle version de {appName} est disponible.',
    'txtAskUpdate': 'Vous disposez de la version {versionCurrent}. Voulez-vous installer la version {versionUpdate}?',
    'btnCancel': 'Pas maintenant',
    'btnOK': 'À installer',
    'errorChecksum': "Ooops - Erreur de mise à jour: le téléchargement semble être interrompu.<br>Vous pouvez fermer cette boîte de dialogue et réessayer plus tard.",
    'errorUnpack': 'Ooops - Erreur de mise à jour: le téléchargement ne peut pas être décompressé.<br>Vous pouvez fermer cette boîte de dialogue et réessayer plus tard.'
}
AUTOUPDATE.langStrings['fr'] = langFR;
AUTOUPDATE.lang = 'fr';

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