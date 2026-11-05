# Other forks of ITzAkai/kai (reviewed 2026-11-05)

GitHub lists four forks of [ITzAkai/kai](https://github.com/ITzAkai/kai): this one and the three
below. None shares git history with current upstream (upstream rewrote its history in October
2026), so they were compared file by file. Nothing was run. All three are GPL-3.0, like upstream.

## cre4tr/stremio-kai-tizen
An older snapshot of the early Samsung port: Tizen key codes, profiles, English. Upstream already
contains all of it and more. One commit hard-codes personal LAN addresses as the default
streaming server; that must not be adopted. **Nothing to adopt.**

## afalarconm/stremio-kai-tizen
Also an older snapshot of the same port (Tizen keys, profiles, English, install guide, webOS
CSP fix). Upstream has all of it. **Nothing to adopt.**

## mthsrfm-byte/stremio-sera ("Seraflix")
A large, Portuguese-only remix (about 248 commits, roughly +10k / -4k lines against upstream). It
removes the English and Arabic translations, so it cannot be merged; ideas would have to be
ported one by one. Candidates, most relevant first:

1. **Debrid bandwidth learning** (`src/js/lib/streaminfo.js`, player): keeps a per-TV Mbps
   budget, lowers it after a stall, raises it after smooth playback, and prefers a lighter cached
   file. Debrid (HTTP) sources only; our torrent work does not cover this.
2. **Smart Choice ranking by budget**: files above the learned budget and Dolby Vision last.
3. **Idle repaint fix** (commit `ac0da6d`): the loading shimmer animates only on covers that are
   really loading, so a still screen does not repaint. Likely helps responsiveness on old TVs.
4. **Phone remote rewrite** (`remote/tv-service.js`): forwards keys to the TV's local WebSocket,
   6-digit PIN. Loads its phone page from a CDN at runtime, which would need a security review.
5. Player extras: Portuguese subtitle variant picking, frame-rate correction, intro/outro skip.
   This fork already has its own intro skip and next-episode prefetch.
6. Not relevant here: Fire TV port, adult catalog tab, screensaver, rebranding.

Items 1-3 are the ones worth evaluating for this fork. Each needs its own review and tests;
none has been ported yet.
