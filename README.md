# Stremio Kai for Tizen (FeridunDuran fork)

Stremio for Samsung Tizen TVs, including older models (2017 and newer, Tizen 3.0+) that can't
run the official Stremio app. It runs as a [TizenBrew](https://github.com/reisxd/TizenBrew)
app module with the [Stremio Kai](https://github.com/allecsc/Stremio-Kai) look, fully
controlled with the Samsung remote.

This is a fork of [ITzAkai/kai](https://github.com/ITzAkai/kai). It follows upstream and adds
its own fixes and features, listed below. The app loads and updates itself from **this**
repository.

> **Unofficial.** Not affiliated with Stremio, Stremio Kai or Samsung. The app hosts no
> content: it only shows what the add-ons on **your** Stremio account provide.

![Stremio Kai home screen on a Samsung TV](docs/screenshots/home.jpg)

## What this fork adds

### Continue watching keeps your series
Upstream dropped a series from **Continue watching** as soon as you finished an episode. This
fork follows the official Stremio logic (stremio-core):
- When you leave an episode after 90% of it, the series moves on to the **next episode** and
  stays in the row, ready to play.
- Like Stremio, it doesn't jump from a regular season into specials (season 0) and skips
  episodes that haven't been released yet.
- A film, or the last episode of a series, leaves the row when finished.
- Progress saved on your phone or PC shows up as soon as the app starts, without switching tabs.

### Library sorting
A **Sort** button next to All / Movies / Series, remembered per profile:
- Last watched (default, as in Stremio), Recently added
- Name A-Z, Name Z-A, Most watched
- Release date (newest / oldest) and Rating (IMDb, highest)

Library items don't carry release dates or ratings, so the first time you pick those sorts the
app fetches them from your add-ons (two at a time, to spare the TV's memory) and keeps them on
the TV. Titles without the information go last.

### Home screen rows
**Settings → Add-ons → Home screen rows** lists every catalog row. Pick one to move it up, down,
to the top or the bottom, or to hide it. It works per profile and only changes this app, not
your Stremio account. Rows from a newly added add-on appear at the bottom; **Reset to add-on
order** brings back the default.

Without this, rows follow the order of the add-ons on your account (the newest add-on last),
which you can also change at web.stremio.com → Add-ons.

### Only sources the TV can play
Torrents play on the TV through a bundled Node 4 engine and rolling RAM cache, so a PC server is
optional. When both are available the PC server is preferred; without either, torrent sources
are hidden with a count per add-on.

The TV keeps a moving window of torrent pieces in memory instead of saving the whole video to
internal storage. Seeking outside that window fetches the needed pieces again.

Links that need extra request headers (Referer, User-Agent, Cookie...) work without a PC: the
app's small TizenBrew service on the TV fetches them and adds the headers, so the player gets a
normal local URL. They are tagged **Via TV**. If the TV service is not running they show as
**Direct · may fail**, the player tries them directly, and Smart Choice puts them last.

### Other changes
- The loader and in-app updater point to this repository, so the TV runs this fork's code.
- English is the default language; Samsung on-screen keyboard Done / Cancel work in text fields.

## Features from upstream

#### A home screen built for the TV
Rotating hero banner with the title's logo, rating, runtime and genres, and **Watch** /
**Details** one press away. Below it, every catalog from your Stremio add-ons as a row.

#### See all, without dead ends
Every row ends in a **See all** tile that opens the whole catalog as a grid. More titles load
on their own as you scroll down, so you never hit the end of a list.

| Row end | Full catalog |
|---|---|
| ![See all tile at the end of a row](docs/screenshots/see-all-row.jpg) | ![Full catalog grid](docs/screenshots/see-all-grid.jpg) |

#### Smart Choice
Press **Watch** and the app picks the best source and starts playing, no source list to scroll
through. It prefers direct (debrid) links, your add-ons' order, and files the TV plays well,
skipping Dolby Vision, REMUX and very high bitrates when there's anything else. If a source won't
start, it moves on to the next best one. **Sources** still shows the full list.

![Details page: Watch with Smart Choice, Sources, Trailer and Library](docs/screenshots/smart-choice.jpg)

#### Phone remote
Use your phone as the remote, no app to install. Scan the QR code in **Settings → Phone remote**
and your phone's browser opens a remote with a D-pad, OK, Back and playback buttons, subtitle
sync and volume buttons, a **Now playing** card (poster, title and a progress bar you can drag
to jump anywhere), **Search on the TV** (type, or speak with your keyboard's 🎤: the TV jumps to Search
from any screen), and a text box that types straight into the TV's search or sign-in fields. A PIN shown on the TV keeps
others on your Wi-Fi out. It runs as a small TizenBrew service on the TV, nothing leaves your
home network.

| On your phone | On the TV (Settings) |
|---|---|
| <img src="docs/screenshots/phone-remote.jpg" alt="Phone remote page" width="300"> | ![QR code and PIN in Settings](docs/screenshots/phone-remote-qr.jpg) |

**Browse on the phone:** the **Browse** tab shows your Continue watching, New episodes and
Library as posters; tap one and it opens on the TV, ready on that episode.

<img src="docs/screenshots/phone-browse.jpg" alt="Browse tab on the phone" width="300">

#### Search across all your add-ons
Results from every add-on that supports search, grouped by movies and series.

![Search results](docs/screenshots/search.jpg)

#### Release calendar: anime, series and movies
A week at a time, day by day:
- **Anime:** every episode airing that day, including Chinese and Korean titles, with air
  time, episode and score.
- **Series:** new episodes from streaming services worldwide and US TV, with the network.
- **Movies:** the day each film becomes available to stream at home (with a free
  [TMDB](https://www.themoviedb.org/settings/api) key in Settings).

| Anime | Series |
|---|---|
| ![Anime calendar](docs/screenshots/calendar-anime.jpg) | ![Series calendar](docs/screenshots/calendar-series.jpg) |

#### English and Arabic
The whole app in **English** or **Arabic** (Settings → Language / اللغة, or automatic from the
TV's language). Arabic switches to a right-to-left layout, while titles and synopses keep their
own direction.

| Home | Details |
|---|---|
| ![Arabic home screen](docs/screenshots/arabic-home.jpg) | ![Arabic details screen](docs/screenshots/arabic-details.jpg) |

#### Profiles and settings
"Who's watching?" profiles, each on its own Stremio account, plus language, Smart Choice,
theme, subtitle and streaming-server settings, all usable with the remote.

![Settings](docs/screenshots/settings.jpg)

#### Trailers and actor profiles
- **Trailer** on every film and series page plays the official trailer full screen. Back closes
  it, OK pauses, and left/right switch between trailers when there are several.
- Select anyone in the **cast** to open their profile: photo, age, birthplace, biography, and all
  their films and series, each one a press away.
- With a free [TMDB](https://www.themoviedb.org/settings/api) key in Settings, descriptions,
  titles and biographies appear **in Arabic** when the app is in Arabic (English when TMDB has
  no Arabic text).

![A trailer playing full screen](docs/screenshots/trailer.jpg)

#### New episodes
A home-screen row with the episodes released in the last 7 days for the series in your library,
skipping the ones you've watched. Each opens straight on that episode.

![New episodes row](docs/screenshots/new-episodes.jpg)

#### Watching
- **Skip intros automatically.** Intros and recaps are skipped on their own (IntroDB and
  AniSkip); at the credits the Up next card takes over. Settings → Skip intro can switch back to
  a button.
- **Watched markers.** Finished episodes get a ✓ and half-watched ones a progress bar.

![Episodes with watched markers](docs/screenshots/watched.jpg)

- **Up next.** Near the end of an episode (at the credits, when known) a card shows the next
  episode with a 10-second countdown: **Play now**, or **Cancel** / Back to stay.
- **Subtitle sync shortcut.** Subtitles out of time? While playing, press **Channel up/down**
  (or yellow/blue, or the phone remote's buttons) to move them later or earlier by 0.25 s. The
  setting is remembered for that episode or film.
- **Continue watching everywhere.** Progress syncs through your Stremio account: stop on the TV,
  carry on on your phone, PC or Fire TV, and the other way round.

#### Themes
Purple, gold, teal, red, blue or green: **Settings → Colour theme** recolours the whole app.

![Gold theme](docs/screenshots/theme-gold.jpg)

#### And more
- **Search by actor.** With a TMDB key, search shows matching actors and directors first; each
  opens their profile.
- **In-app updater.** Settings shows the installed and newest version; one press updates.
- **Your Stremio account.** Sign in with a code (on your phone at link.stremio.com) or by email.
  Add-ons, library and "Continue watching" come from your account, and progress syncs back.
- **Ratings.** IMDb out of the box; Rotten Tomatoes, Metacritic, Letterboxd and Trakt with a
  free [MDBList](https://mdblist.com) API key (Settings).
- **Smart source list.** Direct (debrid) links first, filter by add-on, and 4K, HDR,
  Dolby Vision and REMUX tags.
- **Player.** Uses the TV's hardware player (H.264, HEVC, HDR10), skips intros and outros
  (IntroDB and AniSkip), automatic subtitles, next episode on the same source, and reconnects
  if a video stalls.
- **Built for the Samsung remote.** Arrows, OK, Return, play/pause, fast-forward/rewind,
  colour and channel keys, and Samsung's on-screen keyboard. No pointer needed.
- **Light enough for old Tizen.** Plain JavaScript compiled down for the old web engine on
  Tizen 3.0 (Chromium 47); no WebAssembly required.

## Requirements

- A Samsung TV running **Tizen 3.0 or newer** (2017 onwards). Tested on a 2017 UA65MU8500 (Tizen 3.0).
- **TizenBrew** on the TV (installation steps below).
- For playback, **one** of:
  - a **debrid** service (Real-Debrid, AllDebrid, etc.) in your Stremio add-ons: plays directly
    on the TV, no PC needed;
  - the app's built-in TV torrent engine (no PC required), or [stremio-service](https://github.com/Stremio/stremio-service/releases)
    running on a PC on the same network. The PC server is preferred when configured and reachable.
- Links that only need request headers (Referer/User-Agent/Cookie) need neither: the app's
  TizenBrew service fetches them on the TV itself.

## Installing on a Samsung TV

You need a PC on the same Wi-Fi as the TV for steps 1 to 3. After that, the TV works on its own.

### 1. Turn on Developer Mode

1. Find your PC's IP address (on Windows: open Command Prompt and run `ipconfig`; look for
   **IPv4 Address**, e.g. `192.168.1.20`). The TV and PC must be on the same network.
2. On the TV, press **Home** and open **Apps**.
3. On the Apps screen, type **1 2 3 4 5** with the remote's number keys (or the on-screen
   keypad on remotes without numbers).
4. In the **Developer Mode** window, switch **Developer mode** to **On**, enter your PC's IP
   address under **Host PC IP**, and select **OK**.
5. **Restart the TV**: hold the remote's power button until the TV turns off and back on,
   or unplug it for 30 seconds. Developer Mode only starts after a full restart.

### 2. Download TizenBrew Installer

TizenBrew Installer is a small desktop app that puts TizenBrew on the TV.

1. On the PC, open the
   [TizenBrew Installer releases page](https://github.com/reisxd/TizenBrewInstaller/releases/latest).
2. Under **Assets**, download the file for your computer:

   | Computer | File |
   |---|---|
   | Windows | `TizenBrewInstaller-win-x64.exe` |
   | Mac (Apple Silicon, M1 or newer) | `TizenBrewInstaller-macos-arm64` |
   | Mac (Intel) | `TizenBrewInstaller-macos-x64` |
   | Linux | `TizenBrewInstaller-linux-x64` |

   Ignore `TizenBrewInstaller.wgt`, which is the TV version.
3. Run it:
   - **Windows:** double-click the `.exe`. If Windows SmartScreen says it "protected your PC",
     click **More info → Run anyway** (the installer isn't signed by Microsoft). If the firewall
     asks, allow it on **Private networks**.
   - **Mac / Linux:** open Terminal in the download folder, run
     `chmod +x TizenBrewInstaller-*`, then run the file (e.g. `./TizenBrewInstaller-macos-arm64`).
     On a Mac, if it's blocked, allow it in **System Settings → Privacy & Security**.

### 3. Install TizenBrew with the installer

1. Find the **TV's IP address**: on the TV, go to **Settings → General → Network →
   Network Status → IP Settings** and note the **IP Address** (e.g. `192.168.1.35`).
2. In TizenBrew Installer, type the TV's IP into the **TV IP** box and click **Connect to TV**.
   - *"Could not connect to the SDB Daemon"* means the TV is off, the IP is wrong, or the TV
     wasn't restarted after step 1.
3. Click **Install TizenBrew**. It shows *Fetching package → Installing package →
   Package installed*.
   - **Tizen 7 or newer (2023+ TVs):** it shows **Resigning required**. Click
     **Sign in to Samsung Account**, sign in, and follow its steps so it can sign TizenBrew
     for your TV. Older TVs skip this.
4. **TizenBrew** now appears in the TV's **Apps**. You can close the installer.

See the [TizenBrew install guide](https://github.com/reisxd/TizenBrew/blob/main/docs/README.md)
for other install methods.

### 4. Point Developer Mode at the TV itself

TizenBrew needs this to run:

1. On the TV, open **Apps** and type **1 2 3 4 5** again.
2. Keep **Developer mode** **On**, change **Host PC IP** to **127.0.0.1**, and select **OK**.
3. Restart the TV again.

Leave Developer Mode on from now on, or TizenBrew won't open.

### 5. Add Stremio Kai

1. Open **TizenBrew** and go to **Module Manager → Add module**.
2. Choose **GitHub** (not NPM) and enter:
   ```
   FeridunDuran/stremio-kai-tizen
   ```
3. **Stremio Kai** now appears in TizenBrew. Open it.

### 6. First launch

1. The setup asks for a **torrent server**. The TV can play torrents by itself. If you already
   run [stremio-service](https://github.com/Stremio/stremio-service/releases) on a PC on the
   same network, choose **Scan network** to use it first; otherwise choose **Skip**.
2. Sign in to your Stremio account: go to **link.stremio.com** on your phone and enter the code
   shown on the TV, or sign in with email.
3. Your add-ons and library load from your account. Pick something and play.

**Updating:** the app loads the newest commit of this repository each time it starts, so a full
restart is enough. Samsung keeps apps running in the background: if a new version doesn't show
up, hold the remote's power button until the TV restarts. **Settings → Updates** shows the
installed and newest version and can update from there too.

![Updates in Settings](docs/screenshots/updates.jpg)

### Troubleshooting

- **TizenBrew won't open:** check that Developer Mode is still **On** with Host PC IP
  **127.0.0.1**. A TV firmware update or factory reset turns it off.
- **The installer can't find the TV:** make sure the Host PC IP in step 1 is the PC's current IP,
  the TV was restarted afterwards, and both are on the same network (not a guest network).
- **A video won't play:** try a debrid (direct) source, or check that the TV torrent service or
  PC stremio-service is available for torrent sources. Header links should be tagged **Via TV**; if they say
  **Direct · may fail**, neither the TV header proxy nor the PC proxy was detected. The app
  tries to start its own loopback proxy using the same commit as the running app, even when
  TizenBrew has an older phone service cached. HTTP sources stop waiting after 120 seconds;
  Smart Choice then tries its next backup.
- **Audio track language is missing:** “Audio track N (language not provided)” means the
  source did not label the language; it does not mean that the file contains no sound.
  TizenBrew HLS playback uses a bundled HLS.js player through MediaSource. It reports multiplexed audio codecs and supports alternate audio tracks when provided. Installed Samsung apps can use AVPlay when available.
  Silent or unsupported source audio cannot be repaired by adding request headers alone.
- **Few or no sources:** torrents are hidden when neither the TV engine nor a PC server is
  available; each add-on shows how many were hidden. Header links are no longer hidden.
- **The Library tab or a new feature doesn't appear:** the TV is still running the old version;
  restart it fully (see Updating).

## Tizen integration

- Samsung **Return**, media, colour and channel keys, registered through the Tizen
  TVInputDevice API.
- Exits through the Tizen application API.
- Finds the TV's IP address (to scan the network for stremio-service) through Samsung's
  network API, with a WebRTC fallback.
- Shows the TV model in Settings through Samsung's product info API.
- Updates itself: a small loader asks GitHub for this repository's newest commit and loads that
  build from jsDelivr, falling back to the copy TizenBrew installed.

## Known limitations

- **Playback on TizenBrew** uses HLS.js for HLS streams when MediaSource is available;
  TizenBrew module pages do not have packaged-app AVPlay privileges. Other HTTP files
  keep using HTML video. Real PenguPlay VidFast vRapid/vBlaze streams were tested through
  the shipped proxy in desktop Chrome, including video/audio decoding, seek and source
  switching. Q70T hardware verification is still outstanding. Embedded subtitle switching through Samsung's
  API is not implemented; add-on subtitles still use the app's renderer.
- The AI enhancements of the PC version of Stremio Kai (SVP, VapourSynth, Anime4K) are not
  included: TVs can't run them.

## Building

Needs Node.js.

```
npm install
npm run build
```

The built app is written to `dist/`, which TizenBrew loads (`appPath` in `package.json`).
Commit `dist/` together with the source: the TV runs the built files straight from GitHub.

### Syncing with upstream

```
git remote add upstream https://github.com/ITzAkai/kai
git fetch upstream
git merge upstream/main
npm run build
```

Keep `REPO` in `src/static/loader.js` and `src/js/api/update.js` pointing to
`FeridunDuran/stremio-kai-tizen`, otherwise the TV loads upstream's code instead of this fork.

## Credits

- [Stremio Kai](https://github.com/allecsc/Stremio-Kai) by allecsc: the original design and features.
- [Stremio Kai Timeworn](https://github.com/creachec/Stremio-Kai-Timeworn) by binhoc: the
  lightweight TV build this Tizen version is based on.
- [ITzAkai/kai](https://github.com/ITzAkai/kai): the Tizen port this fork follows.
- [TizenBrew](https://github.com/reisxd/TizenBrew) by reisxd: runs this app on Samsung TVs.
- [stremio-core](https://github.com/Stremio/stremio-core): the Continue watching rules.
- [Stremio](https://www.stremio.com/).

## License

[GPL-3.0](LICENSE), the same as the projects it is based on.
