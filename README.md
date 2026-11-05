# Kai Turbo TV

**Stremio for Samsung TVs that plays torrents on the TV itself: no PC, faster starts, steadier
playback.**

Kai Turbo TV runs on Samsung Tizen TVs, including older models (2017 and newer, Tizen 3.0+) that
can't run the official Stremio app. It runs as a [TizenBrew](https://github.com/reisxd/TizenBrew)
app module with the [Stremio Kai](https://github.com/allecsc/Stremio-Kai) look, fully
controlled with the Samsung remote.

This is a fork of [ITzAkai/kai](https://github.com/ITzAkai/kai) that plays **torrents on the TV
itself, without a PC**, and adds faster, steadier playback on top (see [Why this fork](#why-this-fork)).
It follows upstream and loads and updates itself from **this** repository.

> **Unofficial.** Not affiliated with Stremio, Stremio Kai or Samsung. The app hosts no
> content: it only shows what the add-ons on **your** Stremio account provide.

![Stremio Kai home screen on a Samsung TV](docs/screenshots/home.jpg)

## Why this fork

Upstream needs a PC running [stremio-service](https://github.com/Stremio/stremio-service) on the
same Wi-Fi for every torrent. **This fork plays torrents on the TV itself**, with no PC, and
then works on what happens after you press play: shorter waits, less wasted data, clearer
loading and error screens, and fewer surprises with the remote. Everything else from upstream
(home screen, Smart Choice, phone remote, calendar, themes...) is still here and kept in sync.

### At a glance

| | Upstream ([ITzAkai/kai](https://github.com/ITzAkai/kai)) | This fork |
|---|---|---|
| **Torrent sources** | Need stremio-service on a PC on the same network | Play on the TV: built-in engine, verified pieces, 48 MiB RAM cache, no PC |
| **Links that need Referer / User-Agent / Cookie** | PC proxy, otherwise tried directly | The TV's own service adds the headers (**Via TV**) |
| **HLS (.m3u8) and DASH (.mpd)** | TV's built-in player only | Bundled hls.js 1.7.4 and dash.js 4.7.4 players |
| **Continue watching** | A series leaves the row when an episode ends | Moves on to the next episode, following stremio-core rules |
| **Library** | One fixed order | Eight sort orders, remembered per profile |
| **Home screen rows** | Add-on order | Reorder or hide rows per profile |
| **Source list** | Filter by add-on | Also Direct / Via TV / Torrent filters, collapsible add-on groups, best quality / most seeds first |
| **Loading screen** | Spinner | The real step, total wait, peers and download rate. No fake percentages |
| **Playback errors** | Reported as an unsupported format or codec | Says whether peers, video data, the header or the decoder failed; **Try again** |
| **Next episode** | Sources looked up after the countdown | Looked up a minute early; the same torrent keeps its peers |
| **A stalled torrent mid-episode** | Not applicable (no TV torrent engine) | Buffers and continues where it stopped, never skips to the next episode |
| **Back while watching** | One press leaves when the controls are hidden | Asks for a second press |
| **Diagnostics** | Basic remote log | Adds a startup timeline, rebuffers, peer and piece timings |

### Measured on a real TV

Samsung Q70T (2020), Tizen 5.5, TizenBrew, torrents from public add-ons:

- An HEVC/AAC episode plays with picture and sound through the TV's own torrent engine. A cold
  start reached the player's "enough data" state in about 10 seconds.
- The same episode of a season pack (690 MB file, 16 MiB pieces), resumed about eight minutes
  in: **50 s and about 80 MB** before playback with an earlier build, **34 s and 51.6 MB**
  after the start-up changes below. The first peer answered in 0.2 s and data arrived after 2.3 s.

These are single runs on live swarms, so treat them as observations, not guarantees: speed
depends on the source's peers, the file and where you resume. Every change below has local
regression tests; TV checks are named where they were made.

## What this fork adds

### Torrents on the TV, no PC
- Torrents play through an engine inside the app's TizenBrew service. Pieces are verified
  before the player sees them, and only a moving 48 MiB window stays in RAM; nothing is written
  to the TV's storage. Seeking outside the window fetches the needed pieces again.
- Discovery uses UDP/DHT and HTTP trackers in parallel. **Ready** on the source screen means the
  engine is running, not that a particular source has reachable peers.
- If the engine is unavailable, torrent sources are hidden with a count per add-on.
- Errors say which step failed: peer discovery, handshake, metadata, missing video data, header
  or decoding. Missing data is never reported as an unsupported codec.
- After an update that changes the player service, fully restart the TV so TizenBrew loads it.

### Faster start, less wasted data
Ideas taken from [libtorrent](https://libtorrent.org/streaming.html), [WebTorrent](https://github.com/webtorrent/webtorrent),
Peerflix and qBittorrent, checked against their source code and the TV's own logs
([details](docs/torrent-startup.md)):
- **Playhead first.** The piece being played outranks read-ahead. A peer may hold at most two
  seconds of its own speed in playhead blocks, so a slow peer cannot hold up the piece you are
  waiting for, and slow blocks are re-requested from a faster peer.
- **Request queues that grow.** Each peer gets three seconds of its measured speed plus two
  blocks, up to 250 (about 4 MB in flight; libtorrent allows 500). A TV trace showed the one fast
  peer of a swarm stuck at the old 64-block limit, close to the file's bitrate.
- **Nothing downloaded twice.** MP4 headers at both ends of the file stay cached, and the piece
  read just before the jump to the end of the file is kept for the re-read that follows.
- **Nothing downloaded for nothing.** When resuming, only the pieces the player reads at the
  start and end of the file are fetched until it reaches the resume position.
- **Reachable like a desktop client.** The engine now listens for incoming peers (TCP, plus uTP)
  and asks the router to forward its port over UPnP, as libtorrent and WebTorrent do. Before, it
  announced a port it never opened. A peer that refuses TCP is tried once over uTP.
- **A warm DHT.** One DHT serves every torrent while the service runs, and the nodes it knew are
  saved by the app and used to start the next one, so a torrent opened after a TV restart does
  not wait only for the public bootstrap routers.
- **Peer exchange (PEX).** Connected peers can tell the TV about other peers in the swarm.
- **Silent peers lose their blocks.** A peer that sends nothing for 20 s while holding requests
  is snubbed, as in libtorrent: its blocks go to other peers and it keeps a single request (only
  while another peer is delivering, so a torrent with one slow source keeps it).
- **More peers that actually send.** A connected peer that has not unchoked us yet is kept 15 s
  (peers following libtorrent's defaults hand out uploads every 15 s) instead of being dropped
  after 5 s when many peers are waiting. Peers that failed to connect are retried a few at a time
  once untried peers run out, and peers that delivered data before are tried first the next time
  the same torrent opens.
- **Nothing waits for unrelated work.** Add-on requests, service checks and subtitle lookups run
  in parallel; the home screen no longer waits for the PC or TV service checks.
- **Slow is not broken.** A torrent that is still receiving data counts as buffering, not as a
  stall. The TV's player gives up after about 30 s without the first bytes; if data is still
  arriving, the app reopens the stream instead of showing an error. Right after a TV restart the
  engine waits 45 s (instead of 20 s) for the first torrent details, and a torrent that still
  finds no peers or details is retried once automatically before an error is shown.
- **A long episode keeps its connection.** The TV service no longer treats a stream that has
  been playing for minutes as idle; it used to remove it after about 3.5 minutes, so playback
  stopped and could not reconnect. If the service still loses a stream, the player opens the
  torrent again at the position played instead of showing an error.
- **A stall cannot skip an episode.** Once video has been delivered the stream stays open while
  waiting for peers. Before, the TV's player read a closed stream as the end of the file and
  jumped to the next episode (seen on the Q70T, now fixed).
- The player starts as soon as the browser can play (`canplay`). On the Q70T this arrives
  together with "enough data", so it only matters on engines that wait longer.

### Clearer loading and watching
- The loading screen shows the step in progress (starting the torrent player, getting the file
  list, waiting for data from peers, reading the video information, jumping to your position,
  buffering, finding the next episode) and the total time waited. Torrents also show peers,
  data received and current speed, and say when the download is slower than the file's average
  bitrate.
- With the controls visible, a small line in the top-right corner shows peers, download rate,
  "needs ~X MB/s" (the file's average bitrate, not a hard minimum) and the video height. It is
  never shown during full-screen viewing; **Hide stats / Show stats** turns it off.
- After an error, **Play** becomes **Try again** (same source, from the last position played),
  with **Sources** next to it.
- While a video is loaded, Back asks for a second press within three seconds; a held key or a
  repeated key event does not count. Loading or failed playback closes with one press. Stop
  always closes.

### Next episode without the wait
- At the credits, or 25 seconds before the end when credits are unknown, a 10-second countdown
  offers the next episode. Pausing pauses it, seeking away cancels it, Cancel or Back keeps the
  current episode. Unreleased episodes and a jump from regular seasons to specials are skipped.
- The next episode's sources are requested about a minute before, as stremio-core does. The
  player prefers the same torrent (its peers stay connected), then the same binge group from
  the same add-on; otherwise it opens the next episode's source list.
- Duplicate requests are ignored and the previous episode's fallback sources cannot carry over.
  Back from the player then shows the episode you were actually watching.

### Continue watching keeps your series
Upstream dropped a series from **Continue watching** as soon as you finished an episode. This
fork follows the official Stremio logic (stremio-core):
- When you leave an episode after 90% of it, the series moves on to the **next episode** and
  stays in the row, ready to play.
- It doesn't jump from a regular season into specials (season 0) and skips episodes that
  haven't been released yet.
- A film, or the last episode of a series, leaves the row when finished.
- Progress saved on your phone or PC shows up as soon as the app starts.

### Library sorting
A **Sort** button next to All / Movies / Series, remembered per profile: last watched (default),
recently added, name A-Z / Z-A, most watched, release date (newest / oldest) and rating (IMDb).
Release dates and ratings are fetched from your add-ons the first time (two at a time, to spare
the TV's memory) and kept on the TV. Titles without the information go last.

### Home screen rows
**Settings → Add-ons → Home screen rows** lists every catalog row: move it up, down, to the top
or the bottom, or hide it. It works per profile and only changes this app, not your Stremio
account. **Reset to add-on order** brings back the default.

### Better source list
- **Direct / Via TV / Torrent** filters and collapsible add-on groups. The highest-priority
  add-on that has sources opens by itself and focus starts on its best source, so playing it is
  one press.
- Within each add-on, HTTP sources are ordered by resolution and torrents by reported seeds
  (unknown counts last). Seed counts come from the add-on and are hints, not live checks.
- Links that need request headers are fetched by the TV's own service (**Via TV**). Without the
  service they show as **Direct · may fail** and Smart Choice puts them last.
- HLS and DASH streams play through the bundled hls.js / dash.js players, with their request
  headers carried through the TV service.

### Diagnostics when you need them
With **Settings → Remote log** pointed at `npm run logs` on a PC, the app sends a startup
timeline, a compact torrent state every few seconds (connections, peer speeds, discovery and
piece timings), each rebuffer with its duration and a summary when the player closes. Peer
addresses, tokens and signed links are not logged.

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

- A Samsung TV running **Tizen 3.0 or newer** (2017 onwards). Upstream was tested on a 2017
  UA65MU8500 (Tizen 3.0); this fork's torrent playback is tested on a 2020 Q70T (Tizen 5.5).
- **TizenBrew** on the TV (installation steps below).
- For playback, **one** of:
  - a **debrid** service (Real-Debrid, AllDebrid, etc.) in your Stremio add-ons: plays directly
    on the TV, no PC needed;
  - torrent add-ons such as Torrentio or Comet: the app runs their torrent streams on the TV,
    without stremio-service on a PC.
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

### 5. Add Kai Turbo TV

1. Open **TizenBrew** and go to **Module Manager → Add module**.
2. Choose **GitHub** (not NPM) and enter:
   ```
   FeridunDuran/kai-turbo-tv
   ```
3. **Kai Turbo TV** now appears in TizenBrew. Open it.

**Coming from `FeridunDuran/stremio-kai-tizen`?** That was this project's earlier name. Remove the
old module in TizenBrew, add `FeridunDuran/kai-turbo-tv`, then fully restart the TV (hold the
remote's power button). Your sign-in and settings stay on the TV.

### 6. First launch

1. The setup explains that torrent playback runs on the TV and does not need a PC server.
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
- **A video won't play:** try a debrid (direct) source, or check that the TV torrent player is
  ready for torrent sources. Header links should be tagged **Via TV**; if they say
  **Direct · may fail**, neither the TV header proxy nor the PC proxy was detected. The app
  tries to start its own loopback proxy using the same commit as the running app, even when
  TizenBrew has an older phone service cached. HTTP sources stop waiting after 120 seconds;
  Smart Choice then tries its next backup.
- **Audio track language is missing:** “Audio track N (language not provided)” means the
  source did not label the language; it does not mean that the file contains no sound.
  TizenBrew HLS playback uses a bundled HLS.js player through MediaSource. It reports multiplexed audio codecs and supports alternate audio tracks when provided. Installed Samsung apps can use AVPlay when available.
  Silent or unsupported source audio cannot be repaired by adding request headers alone.
- **Few or no sources:** torrents are hidden while the TV torrent player is unavailable; each
  add-on shows how many were hidden. Header links are no longer hidden.
- **A torrent is slow or keeps buffering:** press a key to show the controls and read the stats
  line. Few peers, or a download rate well below "needs ~X MB/s" for a long time, means the
  source itself is slow; pick a source with more seeds or a smaller file. After an update that
  changed the player service, restart the TV fully, otherwise the old engine keeps running.
- **Reporting a problem:** run `npm run logs` on a PC, set **Settings → Remote log** to the
  address it prints, and reproduce the problem. The log shows each loading step with timings.
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

- **Playback on TizenBrew** uses HLS.js for HLS and DASH.js for MPEG-DASH streams when MediaSource is available;
  TizenBrew module pages do not have packaged-app AVPlay privileges. Other HTTP files
  keep using HTML video. Real PenguPlay VidFast vRapid/vBlaze streams were tested through
  the shipped proxy in desktop Chrome, including video/audio decoding, seek and source
  switching. Q70T hardware verification is still outstanding. Embedded subtitle switching through Samsung's
  API is not implemented; add-on subtitles still use the app's renderer.
- Torrent speed is limited by the source's peers that the TV can reach. Incoming connections need
  a router with UPnP **and** a public IP address: behind carrier-grade NAT (an internet address in
  100.64.0.0/10, common on mobile and some fibre lines) other peers still cannot connect to the TV,
  and only outgoing connections are used. uTP is used only as a fallback for peers that refuse TCP. A whole piece must arrive and be verified before any of it plays,
  which makes sources with very large pieces (16 MiB and more) slower to start.
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
`FeridunDuran/kai-turbo-tv`, otherwise the TV loads upstream's code instead of this fork.

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

MovieBoxProviderIN DASH links require the DASH player as well as the header proxy.
A server type of `application/octet-stream` does not identify the media codec.
The MovieBox HEVC/AAC DASH source was verified in desktop Chrome with the TV proxy
code, including audio/video decoding. Q70T hardware verification remains pending.

### Remote debugging

Set **Settings → Remote log** to your log receiver URL (`npm run logs` starts the receiver;
default port 8099). General debug records are enabled while that address is configured:
runtime Git revision, screen transitions, shared HTTP request durations/statuses, uncaught
JavaScript/Promise errors, playback timelines, pause state and bounded torrent piece diagnostics.
URLs in logger output retain the origin while configuration paths and signed queries are
redacted. Disable Remote log when finished to stop sending diagnostic records.

Recent torrent improvements also keep bounded copies of verified media probe bytes for reopening
the same file, rotate long-idle nonproductive peers only when the connection pool is full, and
try a rate-limited uTP fallback after TCP connect timeouts. Recent measured transfer history
helps rank torrent sources; it expires after24hours and does not guarantee future speed.
Remote diagnostics expose probe-cache use and peer rotation counters for comparing TV trials.

Peer scheduling also considers queued work and observed block response time. Choked, snubbed
or queue-full peers cannot reserve preference over usable peers. The playhead piece's final
blocks can recover earlier when another eligible peer has a shorter estimated delivery time.
Remote diagnostics include bounded queue estimates and first-block response timings.

Torrent remote logs also include a discovery funnel: DHT/tracker signals, new versus duplicate
candidates, TCP/uTP and handshake results, queue/free-slot state, and actually productive peers
by discovery route. Counts contain no peer addresses or tracker configuration URLs.
