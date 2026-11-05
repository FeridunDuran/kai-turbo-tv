# Torrent startup investigation (2026-11-05)

Measured on the user's Tizen 5.5 TV: Joy HEVC now plays with audio after correcting tail Range scheduling. The successful run took about 42 seconds including resuming at 902 seconds. This is a baseline, not a controlled speed comparison.

## Primary implementations reviewed

- [libtorrent streaming](https://libtorrent.org/streaming.html): sequential download alone is insufficient; playhead deadlines should outrank read-ahead and use available peers effectively.
- [WebTorrent API](https://github.com/webtorrent/webtorrent/blob/master/docs/api.md): file streams prioritize their required pieces; explicit selections have priorities.
- [Peerflix source](https://github.com/mafintosh/peerflix/blob/master/index.js): HTTP Range requests feed file streams. Its disk/file buffering model is not copied wholesale into the TV's bounded RAM store.
- [WebTorrent FAQ](https://github.com/webtorrent/webtorrent/blob/master/docs/faq.md): streaming fetches pieces in consumption order instead of using pure rarest-first selection.

## Applied changes

1. Keep already cached pieces behind the reader without downloading missing back-buffer pieces before the requested piece (8590a58, TV confirmed Joy playback).
2. New peers now probe the earliest piece in the highest-priority selection. Previously the validation pass scanned the lowest-priority selection backwards, spending initial requests on distant read-ahead data.
3. The currently requested piece gets priority 2; forward read-ahead remains priority 1. Priority rotation is restricted to equal priorities so read-ahead cannot rotate ahead of the playhead. The urgent selection advances with the reader and is removed on window changes/session cleanup.

## Verification and limits

Two scheduler regressions fail against the previous implementation and pass against the updated implementation. Range ownership, inactivity progress, and tail scheduling tests remain in the suite. TV startup improvement from changes 2–3 still requires a fresh log comparison on the same source and resume position; no percentage improvement is claimed.

First/last MP4 header prefetch, persistent metadata caching, larger peer queues and a new engine are deferred until the playhead-priority change is measured. They may consume scarce TV memory/bandwidth or change peer behavior. Piece hash verification remains enabled for received payload; unverified blocks are never streamed to the player.
