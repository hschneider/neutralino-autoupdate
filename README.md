<p align="center">
<img src="https://marketmix.com/git-assets/neutralino-autoupdate/neutralino-autoupdate.jpg">
</p>

# neutralino-autoupdate

**An extended Auto-Updater for Neutralino**

This cross-platform auto-updater comes with the following features:
- Updates the complete app with all extra files, not only its resources.
- Downloads are secured with SHA256 checksums.
- Launches DMG-Files on macOS and executable installers on Windows and Linux.
- Displays a nice install dialog with app icon, version infos and release notes.
- Uses a single manifest for all platforms and CPU-architectures.
- Written in pure JS, no Neutralino Extensions or other dependencies required. 

<img src="https://marketmix.com/git-assets/neutralino-autoupdate/neutralino-autoupdate.gif">

## The update process

The update procedure in detail:

- When the app launches, the **manifest.json** file is fetched from the update server. You can either work with this file or with your own custom code, which returns the manifest as a JSON document.
- The manifest's app version is checked against the running app's version.
- If an update exists, the update dialog pops up.
- The user can read the release notes and decides to skip or install the update.
- If selected "Install", the update is fetched from the server and saved in the user's download folder.
- Next the app ID and the file's checksum are verified.
- The update is unpacked and the original ZIP-file is deleted.
- The starter file is executed and the Neutralino app is closed.

### Update package format

The following formats are recommended:

#### Windows

Use a **zipped executable installer** like e.g. **[Innosetup](https://jrsoftware.org/isinfo.php)**. The installer is executed automatically.

#### macOS

An App bundle should be delivered as a **zipped DMG**. After the zip-file has been unpacked the user is prompted for the login password to mount the DMG. Next the user drags the new app to the Applications folder.

#### Linux

Use a **zipped folder** with e.g. an install.sh file, which does all setup tasks. The install.sh file is executed automatically.

## The manifest.json

The manifest contains all information required by the update process:

```json
{
  "enabled": true,
  "appId": "com.marketmix.neutralinoAutoupdateDemo",
  "appName": "Neutralino AutoUpdater Demo",
  "appVersion": "1.0.1",
  "appIcon": "icon.png",
  "updateWindowsX64":
    {
      "file": "AutoupdateDemo_win-x64.zip",
      "checksum": "123",
      "start": "setup.exe",
      "notes": "release-notes.html"
    },
  "updateDarwinX64":
    {
      "file": "AutoupdateDemo_macos-x64.zip",
      "start": "start.dmg",
      "checksum": "fc37472674da4e978ebec2eaf66abb5d1d9c1e033f3d11f1b1d2eec03e0eb612",
      "notes": "release-notes.html"
    },
  "updateDarwinARM64":
  {
    "file": "",
    "checksum": "",
    "start": "",
    "notes": ""
  },
  "updateDarwinUNIVERSAL":
  {
    "file": "",
    "checksum": "",
    "start": "",
    "notes": ""
  },
  "updateLinuxX64":
    {
      "file": "AutoupdateDemo_linux-x64.zip",
      "checksum": "231",
      "start": "AutoupdateDemo_linux-x64/install.sh",
      "notes": "release-notes.html"
    },
  "updateLinuxARM64":
  {
    "file": "",
    "checksum": "",
    "start": "",
    "notes": ""
  },
  "updateLinuxARMHF":
  {
    "file": "",
    "checksum": "",
    "notes": ""
  }
}

```

The fields in detail:

| Key        | Description                                                  |
| ---------- | ------------------------------------------------------------ |
| enabled    | Set this to false, to **lock client-side processing** while you upload new versions or change the manifest itself. Set it back to true, when you completed all changes. |
| appId      | The app ID, equal to the **applicationId** in the neutralino.config.json |
| appName    | The app-name, as displayed in the update dialog.             |
| appVersion | The current app-version. This is compared against the running app's version. |
| appIcon    | The icon as displayed in the update dialog. Allowed formats are **JPG, PNG or SVG**. The dimensions have to be square. |

Next we have a look on the **update keys** for the different platforms and CPU architectures. They are build up as folllows:

`update + Platform + ARCHITECTURE in uppercase`

So we find the update for macOS (Darwin) on ARM under this key:

`updateDarwinARM64`

The update keys point to the following fields:

| Key      | Description                                                 |
| -------- | ----------------------------------------------------------- |
| file     | The zip-file which contains the update.                     |
| start    | The file which is executed after the zip has been unpacked. |
| checksum | The zip-file's SHA256 checksum.                             |
| notes    | A HTML-file with the release notes.                         |

## Update-Server Setup

Copy all content from the **_server/demo** folder to your update server. Don't forget the **.htaccess-file.** The update zip-files are placed in the same folder as the manifest.

If you are already live with autoupdate-enabled apps in the wild, disable the manifest by setting

```json
"enabled": false,
```

Then first save the file. Now all clients downloading the manifest cannot process the file. This assures that they only get consitent updates.

Adapt the manifest's content and generate the **checksums** for each update-file:

```bash
# On macOS and Linux:
shasum -a 256 FILE.zip
# On Windows:
certutil -hashfile FILE.zip SHA256
```

Make sure, that the **.htaccess-file** is located in the same folder as the manifest as well. This is necessary to allow CORS-requests from the Neutralino app to the update server.

If you run a **NGINX** proxy server, you'll have to add this to your NGINX config:

```bash
location /path/to/your/update/folder {
	add_header 'Access-Control-Allow-Origin'  '*';
	add_header 'Access-Control-Allow-Methods' 'GET';
	add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization';
	add_header 'Access-Control-Expose-Headers' 'Content-Length';
}
```

After the setup of your update-repository is complete, enable your manifest with:

```json
"enabled": true,
```

Now all clients can process the manifest.

## Neutralino App Setup

Copy the **_install/PLATFORM/bin** folder to your app's **resources** folder. E.g.

`_install/macos/bin --> resources/bin`

If you are on **macOS** or **Linux**, make sure the binaries are executable:

```bash
chmod -R +x resources/bin
```

Add these lines to your **main.js** and adapt the manifest's URL to your own server:

```js
let AUTOUPDATE = new NeutralinoAutoupdate("https://autoupdate.test/demo/manifest.json", {lang: 'en', debug: true, arch='x64'});
(async () => {
    await AUTOUPDATE.check();
})();
```

Next copy the **js/neutralino-autoupdate folder** to your project. 

Then add this line to your **index.html**, right before the main.js script:

```html
 <script src="js/neutralino-autoupdate/autoupdate.js"></script>
```

That's it. If something goes wrong, you can track all actions in your app's dev-console, as long as the debug parameter is true.

## NeutralinoAutoupdate Class Overview

The class itself takes the **manifest's URL** and a dictionary of options as parameters. **Options** are:

| Key   | Description                                                  |
| ----- | ------------------------------------------------------------ |
| arch  | The app's CPU architecture. By default **'x64'**             |
| debug | Log all actions to the dev-console. This is **true** by default. |
| lang  | The GUI language. **'en'** for english by default. You can set it to 'de' for german. |

NeutralinoAutoupdate provides the following **methods**:

| Method                | Description                                                  |
| --------------------- | ------------------------------------------------------------ |
| addHeader(key, value) | Add an additional header to all fetch requests. This can be used for custom authentication, e.g. when you generate the manifest with a PHP script. |
| async check()         | Check the update manifest's version against the app's version. If an update exists, a dialog pops up. |
| async checkSilent()   | Does the same as .check() but without dialog. If an update exists, it returns true. |
| async update()        | Starts the update process. Returns false in case of an error or quits the app if the update was successful. This is either called from the dialog's install-button or manually if you use  .checkSilent(). |
| log(msg)              | The internal log function. msg can be a string or an object. This logs msg to the app's console. |

## More about Neutralino

- [NeutralinoJS Home](https://neutralino.js.org) 
- [Neutralino related blog posts at marketmix.com](https://marketmix.com/de/tag/neutralinojs/)



<img src="https://marketmix.com/git-assets/star-me-2.svg">

