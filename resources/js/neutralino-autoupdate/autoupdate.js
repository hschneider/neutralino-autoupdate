// NeutralinoAutoupdate
//
// An Auto-Updater for Neutralino.
//
// Requirements:
// - resources/bin/unzip (on Windows, only)
// - resources/bin/curl (on all platforms)
// - CORS disabled on the server for HTML- and JSON-documents.
//
// (c)2023 Harald Schneider - marketmix.com

class NeutralinoAutoupdate {
    constructor(urlManifest, opt= {}) {
        //
        // Constructor
        //
        // Params:
        // urlManifest: The manifest url
        // opt arch: Architecture, defaults to x64
        // opt debug: Toggle console debug output
        // opt lang: Dialog language, defaults to en

        this.version = '1.1.6';
        this.debug = opt.debug || true;

        this.urlManifest = urlManifest;     // Manifest URL
        this.manifest = undefined;          // Manifest object
        this.os = NL_OS;                    // OS platform
        this.arch = opt.arch || 'x64';      // CPU architecture
        this.token = opt.token || '';       // X-Auth-App token

        this.headers = new Headers();       // Custom request headers
        if(this.token !== '') {
            this.addHeader('X-Auth-App', this.token);
        }

        this.updKey = 'update' + this.os + this.arch.toUpperCase();     // Manifest update-key: updateOsARCH
        this.updating = false;              // True while .update() is running

        // Update target folder
        //
        if(NL_OS === 'Darwin' || NL_OS === 'Linux') {
            this.pathDownload = '~/Downloads/';
        }
        else {
            this.pathDownload = '%USERPROFILE%\\Downloads\\';
        }

        // Dialog language
        //
        this.lang = opt.lang || 'en';
        this.langStrings = {
            'en': {
                'txtNewVersion': 'A new version of {appName} is available.',
                'txtAskUpdate': 'You have version {versionCurrent}. Do you want to install version {versionUpdate}?',
                'btnCancel': 'Not yet',
                'btnOK': 'Install',
                'errorChecksum': "Ooops - Update failed: The download seems to be corrupted.<br>You can close this message and try to update again later.",
                'errorUnpack': 'Ooops - Update failed: Download cannot be unpacked<br>You can close this message and try to update again later.'
            },
            'de': {
                'txtNewVersion': 'Eine neue Version von {appName} ist verfügbar.',
                'txtAskUpdate': 'Sie haben Version {versionCurrent}. Möchten Sie Version {versionUpdate} installieren?',
                'btnCancel': 'Jetzt nicht',
                'btnOK': 'Installieren',
                'errorChecksum': "Ooops - Update Error: Der Download ist anscheinend defekt.<br>Du kannst diesen Dialog schließen und es später noch mal versuchen.",
                'errorUnpack': 'Ooops - Update Error: Der Download kann nicht entpackt werden.<br>Du kannst diesen Dialog schließen und es später noch mal versuchen.'
            }
        }

        // Dialog onClick handler
        //
        this.modalBtnClose = undefined;
        this.modalBtnOK = undefined;
        this.modalBtnCancel = undefined;
    }
    async _modalInit(){
        //
        // Initialize modal dialog.
        // Injects HTML, CSS and installs onCLick handler.

        let d = await Neutralino.filesystem.readFile(NL_PATH + '/resources/js/neutralino-autoupdate/styles.css');
        let e = document.createElement('style');
        e.appendChild(document.createTextNode(d));
        document.head.appendChild(e);

        d = await Neutralino.filesystem.readFile(NL_PATH + '/resources/js/neutralino-autoupdate/modal.html');

        // Expand variables
        //
        let s = this.urlManifest.replace(/manifest.*$/, this.manifest.appIcon)
        d = d.replace('{appIcon}', s);

        s = this.langStrings[this.lang]['txtNewVersion'];
        s = s.replace('{appName}', this.manifest.appName);
        d = d.replace('{txtNewVersion}', s);

        s = this.langStrings[this.lang]['txtAskUpdate'];
        s = s.replace('{versionCurrent}', NL_APPVERSION);
        s = s.replace('{versionUpdate}', this.manifest.appVersion);
        d = d.replace('{txtAskUpdate}', s);

        d = d.replace('{btnCancel}', this.langStrings[this.lang]['btnCancel']);
        d = d.replace('{btnOK}', this.langStrings[this.lang]['btnOK']);

        // Import Release notes
        //
        let url = this.urlManifest.replace(/manifest.*$/, this.manifest[this.updKey]['notes']);
        const response = await fetch(url, {
            method: 'GET',
            cache: 'no-store',
            headers: this.headers
        });
        let notes = await response.text();
        d = d.replace('{notes}', notes);

        // Build modal
        //
        e  = document.createElement('link')
        e.rel = 'stylesheet';
        e.type = 'text/css';
        e.href = 'js/neutralino-autoupdate/animate.min.css';
        document.head.appendChild(e);

        e = document.createElement('section')
        e.innerHTML = d;
        document.body.prepend(e);

        // Add event listeners
        //
        this.modalBtnClose = document.getElementById('_autoupdate_btnClose');
        this.modalBtnClose.addEventListener('click', () => {
            this._modalClose();
        });

        this.modalBtnOK = document.getElementById('#_autoupdate_btnOK');
        this.modalBtnOK.addEventListener('click', () => {
            this.update();
        });

        this.modalBtnCancel = document.getElementById('#_autoupdate_btnCancel');
        this.modalBtnCancel.addEventListener('click', () => {
            this._modalClose();
        });

        this.alertBtnClose = document.getElementById('_autoupdate_alert_btnClose');
        this.alertBtnClose.addEventListener('click', () => {
            this._alertClose();
        });
    }
    addHeader(key, val) {
        //
        // Add custom request-headers

        this.headers.append(key, val);
        console.log(this.headers)

    }
    _modalClose() {
        //
        // Close modal dialog.

        if(this.updating) {
            return;
        }

        let e = document.querySelector('._autoupdate_modal_inner');
        e.classList.add('animate__fadeOutUp');

        setTimeout( () => {
            e = document.querySelector('._autoupdate_modal');
            e.classList.add('animate__animated');
            e.classList.add('animate__fadeOut');
            e.classList.add('animate__faster');
            setTimeout( () => {
                e.style.opacity = '0';
                e.style.visibility = 'hidden';
            }, 500);
        }, 500);
    }
    _modalOpen() {
        //
        // Open modal dialog

        let e = document.querySelector('._autoupdate_modal');
        e.style.opacity = '1';
        e.style.visibility = 'visible';
    }
    _reportError(code) {
        var msg = this.langStrings[this.lang][code];
        this._modalClose();

        let e = document.getElementById('_autoupdate_alert_msg')
        e.innerHTML = msg;
        e = document.querySelector('._autoupdate_alert');
        e.style.opacity = '1';
        e.style.visibility = 'visible';
    }
    _alertClose() {
        //
        // Close alert dialog.

        let e = document.querySelector('._autoupdate_modal_inner');
        e.classList.add('animate__fadeOutUp');

        setTimeout( () => {
            e = document.querySelector('._autoupdate_alert');
            e.classList.add('animate__animated');
            e.classList.add('animate__fadeOut');
            e.classList.add('animate__faster');
            setTimeout( () => {
                e.style.opacity = '0';
                e.style.visibility = 'hidden';
            }, 500);
        }, 500);
    }
    async check() {
        //
        // Call .checkSilent and open a modal dialog,
        // if an update is available.

        let res = await this.checkSilent();
        if(res) {
            await this._modalInit();
            this._modalOpen();
        }
    }
    async checkSilent() {
        //
        // Get manifest and check, if an update is available.

        try {
            const response = await fetch(this.urlManifest, {
                method: 'GET',
                cache: 'no-store',
                headers: this.headers
            });
            if (!response.ok) {
                this.log('ERROR: check() response not OK.');
                return false;
            }

            this.manifest = await response.json();

            this.log('check(): Received manifest:');
            this.log(this.manifest);

            if(this.manifest.enabled === false) {
                this.log("check(): Manifest is disabled.");
                return false;
            }
            if(this.manifest.appId !== NL_APPID) {
                this.log("check(): App ID mismatch.");
                return false;
            }
            if(this.manifest.appVersion <= NL_APPVERSION) {
                this.log("check(): App version not higher.");
                return false;
            }

            this.log('check(): There is an update available.')
            return true;

        } catch (error) {
            console.error('ERROR in check(): ', error);
            return false;
        }
    }
    _loaderOn(){
        //
        // Show progress-wheel

        let e = document.querySelector('._autoupdate_loader');
        e.style.visibility = 'visible';
    }
    _loaderOff() {
        //
        // Hide progress-wheel

        let e = document.querySelector('._autoupdate_loader');
        e.style.visibility = 'hidden';
    }
    async update() {
        //
        // Download and install an update.

        this.updating = true;

        // -- Download
        //
        this._loaderOn();
        let cmd;
        let f = this.manifest[this.updKey]['file'];
        let url = this.urlManifest.replace(/manifest.*$/, f);
        this.log("Downloading update: " + url);

        if(NL_OS === 'Darwin' || NL_OS === 'Linux') {
            cmd = "rm " + this.pathDownload + f;
        }
        else {
            cmd = "del /Q " + this.pathDownload + f;
        }
        await Neutralino.os.execCommand(cmd);

        cmd = NL_PATH + '/resources/bin/curl -k -o ' + this.pathDownload + f + ' -JL ' + url;
        let res = await Neutralino.os.execCommand(cmd);

        // -- Validate
        //
        this.log('Validating ...');
        if(NL_OS === 'Darwin' || NL_OS === 'Linux') {
            cmd = "shasum -a 256 " + this.pathDownload + f + " | awk '{print $1}'"
        }
        else {
            cmd = "certutil -hashfile " + this.pathDownload + f + " SHA256 | findstr /R \"^[0-9a-fA-F]*$\""
        }
        res = await Neutralino.os.execCommand(cmd);
        let chkSum = res.stdOut.trim();

        if(chkSum !== this.manifest[this.updKey]['checksum']) {
            this.log('ERROR: Download checksum mismatch.');
            this._loaderOff();
            this.updating = false;
            this._reportError('errorChecksum');
            return false;
        }
        this.log('Checksum OK.')

        // -- Unpack
        //
        this._loaderOff();
        this.log('Unpacking ...');
        if(NL_OS === 'Darwin' || NL_OS === 'Linux') {
            cmd = "rm " + this.pathDownload + this.manifest[this.updKey]['start'];
        }
        else {
            cmd = "del /Q " + this.pathDownload + this.manifest[this.updKey]['start'];
        }
        await Neutralino.os.execCommand(cmd);

        if(NL_OS === 'Darwin' || NL_OS === 'Linux') {
            cmd = "unzip -o " + this.pathDownload + f + " -d " + this.pathDownload;
        }
        else {
            cmd = NL_PATH + "/resources/bin/unzip -o " + this.pathDownload + f + " -d " + this.pathDownload;
        }
        res = await Neutralino.os.execCommand(cmd);
        if(res.exitCode === 1) {
            this.log("Unpack failed.")
            this.updating = false;
            this._reportError('errorUnpack');
            return false;
        }

        // -- Launch
        //
        this.log('Launching ...');
        if(NL_OS === 'Darwin' || NL_OS === 'Linux') {
            cmd = "rm " + this.pathDownload + f;
        }
        else {
            cmd = "del /Q " + this.pathDownload + f;
        }
        await Neutralino.os.execCommand(cmd);

        if(NL_OS === 'Darwin') {
            cmd = "osascript -e 'do shell script \"open -a Finder " + this.pathDownload + this.manifest[this.updKey]['start'] + "\" with administrator privileges'";
            this.log(cmd);
            res = await Neutralino.os.execCommand(cmd);
            if(res.exitCode === 1) {
                this.log("Update cancelled by user.")
                this.updating = false;
                return false;
            }
        }
        if(NL_OS === 'Linux' || NL_OS === 'Windows') {
            cmd = this.pathDownload + this.manifest[this.updKey]['start'];
            this.log(cmd);
            res = await Neutralino.os.spawnProcess(cmd);
        }

        // -- Quit
        //
        this.updating = false;
        this.log('Quitting ...');
        Neutralino.app.exit(0);
    }
    log(msg) {
        //
        // Log to console, if debug is enabled

        if(!this.debug) {
            return;
        }
        if(typeof(msg) === "object") {
            msg = JSON.stringify(msg, null, 4);
        }
        console.log('AUTOUPDATE ' + msg);
    }
}
