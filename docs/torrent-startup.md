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

First/last MP4 header prefetch and bounded adaptive peer queues were subsequently implemented below. Persistent metadata caching and a new engine remain deferred. They may consume scarce TV memory/bandwidth or change peer behavior. Piece hash verification remains enabled for received payload; unverified blocks are never streamed to the player.

## Follow-up acceleration candidates

Ranked after inspecting actual TV Range traces and the current cache/scheduler:

1. **Pin validated MP4 header pieces across start/tail seeks.** The current ensureWindow removes all cached pieces outside the new window. In the Joy trace the reader fetched the beginning, sought to moov at the end, then requested the beginning again. Preserving those small header regions can avoid a repeated 4 MiB piece transfer. Reserve their bytes from the 48 MiB cache budget; do not simply increase total retention. Requires a regression test that a tail seek does not evict the cached first piece, plus a bounded-memory test.
2. **Bounded first/last piece prefetch for MP4/M4V.** [qBittorrent's official API](https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-%28qBittorrent-5.0%29) exposes first/last piece priority. Applied per selected file (not whole season torrent), this could overlap moov acquisition with startup data acquisition. Prefer format-aware prefetch; MKV often has its header at the beginning, so always fetching the tail can waste bandwidth. Measure same-file head/tail time and bytes before enabling globally.
3. **Adaptive block pipeline.** The vendored engine uses MAX_REQUESTS=5 and 16 KiB blocks (80 KiB outstanding per peer). [Modern WebTorrent](https://github.com/webtorrent/webtorrent/blob/master/lib/torrent.js) calculates block pipeline length from peer throughput and 0.5–1 second target durations. Increasing requests blindly can add memory/queue pressure; adapt with minimum/maximum bounds and compare fast-peer and slow-peer fixtures.
4. **Recover slow urgent blocks using measured deadlines.** [libtorrent streaming](https://libtorrent.org/streaming.html) estimates peer queue times and adaptively retries late critical blocks. Our engine has speed ranking and hotswap already, so first instrument urgent-block age and the peers holding reservations. Avoid duplicate requests by default; retransmissions consume scarce bandwidth.
5. **Limited next-episode prefetch near the end.** Warm-engine reuse is now implemented for identical hashes. Once measured, the next selected file's header/first piece could be prefetched near the episode end under a separate small budget. Cancel on user navigation and avoid starving current playback.

### Measurement protocol

Use the same hash, file index, TV network, and resume position. Record engine-reused flag, metadata latency, first delivered byte, moov delivered, first playing, total downloaded bytes, and peak cached bytes. Compare cold starts separately from warm episode transitions; run multiple trials because peer discovery and remote throughput vary. Do not claim an expected number of seconds or percentage before TV measurements.

The best next implementation target is header cache retention, followed by format-aware head/tail prefetch. A new native engine, more connections, and disabling verification are not supported as first-line changes by the current evidence.

## Implemented acceleration package

The four requested follow-ups are now implemented:

- MP4/M4V/MOV first and last pieces are selected together at session creation, pinned across Range window changes, and deselected when the session detaches. Pin slots are deducted from the 48 MiB verified-cache window budget. Large pieces reduce look-ahead/back-buffer slots; a piece larger than the entire cache is rejected explicitly. MKV does not receive speculative tail requests.
- Per-peer pipelines adapt to 0.75 seconds of measured throughput, clamped to 2–16 outstanding blocks (5 before a speed estimate). Total active block requests are capped at 256 × 16 KiB = 4 MiB per engine. This is an outstanding-request cap, not a claim that total process memory is 4 or 48 MiB.
- Urgent blocks outstanding for a speed-dependent 4–15 seconds may be cancelled and re-requested from a faster, unchoked peer with that piece and spare queue capacity. A block gets one such recovery attempt before completion. The policy never deliberately requests the same block twice from one peer.
- Existing hotswap now cancels the actual outstanding wire requests, uses the correct BLOCK_LENGTH constant, and prevents late error callbacks from freeing an already handed-off reservation again.

Verification includes pipeline limits, recovery eligibility/retry bounds, active-request accounting, cancellation ownership, header pinning, parallel header selections, and cache-window slot budgets for 16 KiB–32 MiB pieces. The controlled loopback fixture in `tools/tests/fixtures/torrent-startup-node4.cjs` executes the built engine under Node 4.4.3 with a local synthetic seeder: it preloads only the first/last 4 MiB pieces of a 64 MiB synthetic MP4, serves HTTP head/tail/head requests, verifies payload, and confirms no repeated download of the first piece. This tests real TCP/BitTorrent/HTTP behavior without public media or a TV connection. It is not a TV startup benchmark.

Next: compare cold-start Joy and ViETNAM runs on the actual TV at the same resume position. Diagnostics expose pinned header indices, active block count and critical retry count. Next-episode speculative prefetch remains outside this four-part package; warm-engine reuse is already implemented.

## Cold MKV startup follow-up

The latest TV trace took about 42 seconds including torrent setup and resuming at 480.5s.
The 416 MB file used 2 MiB pieces: after the local URL was assigned, no payload arrived for
about 14 seconds, and only 1.4 MB had arrived after 26 seconds. First video data appeared
around 30 seconds; the resume seek completed afterward. This proves a slow initial swarm
ramp, but does not by itself prove the bandwidth was spent on read-ahead.

Following the playhead-first principle in [libtorrent streaming](https://libtorrent.org/streaming.html)
and [WebTorrent selections](https://webtorrent.io/docs), cold sessions now restrict the initial
read-ahead selection to the first requested piece until that piece is verified. MP4 tail
prefetch remains enabled. Normal read-ahead resumes on subsequent reads. Already cached
first pieces bypass this restriction, preserving warm-start behavior.

MKV/WebM first pieces are now pinned across tail/index and resume seeks, within the existing
48 MiB cache budget. Their tails are not speculatively fetched. A regression checks initial
selection concentration, header retention, resumed read-ahead and warm-cache behavior.
All 62 local tests pass; the Node 4.4.3 synthetic BitTorrent/HTTP fixture also passes.
Actual TV startup improvement remains to be measured after restarting the updated service.

## Independent startup work in parallel

TV service probes already run concurrently. A ready 8097 torrent service now returns immediately
without waiting for legacy 8095/8096 timeouts (up to 600 ms). When starting the service is needed,
legacy fallback discovery does not block startup or polling. Concurrent checks share one promise.
Add-on subtitle discovery now starts alongside local playback URL preparation, with generation
guards to discard obsolete responses. This overlaps subtitle latency with torrent metadata;
it does not increase torrent peer throughput. Torrent tracker/DHT discovery, add-on stream
requests, and MP4 head/tail selections were already concurrent. Their existing request/cache
budgets are preserved. Regressions cover a ready service with both legacy probes unresolved,
and subtitle discovery while the playback preparation promise remains pending.

## Critical path review: playback start versus buffering

A reported 13.2 GB, ~1 h 50 min source reached the first decoded data and then `readyState=4`
about 15 seconds later, with the download peaking near 1.3 MB/s against an average file need of
about 2 MB/s. The service cannot hand the player unverified bytes, so the playback piece must
finish before any of it is delivered. Speculatively fetching an estimated resume piece was not
adopted: the time-to-byte estimate is unreliable for variable bitrate files, and the extra
piece would share the bandwidth the header and first playable piece need.

Two player-side waits were found in code instead:

1. The player relied only on `autoplay`. In Chromium's
   [html_media_element.cc](https://chromium.googlesource.com/chromium/src/+/refs/heads/main/third_party/blink/renderer/core/html/media/html_media_element.cc)
   autoplay-by-attribute runs only on the transition to `kHaveEnoughData`, while `canplay`
   fires at `kHaveFutureData`. In
   [web_media_player_impl.cc](https://chromium.googlesource.com/chromium/src/+/refs/heads/main/third_party/blink/renderer/platform/media/web_media_player_impl.cc)
   the step from future to enough data requires `CanPlayThrough()`, a download-rate estimate,
   when the `kSpecCompliantCanPlayThrough` feature is enabled. A torrent slower than the file
   bitrate may not satisfy it early. Whether the TV's engine has that feature is unknown; without
   it both states arrive together and this change makes no difference. An explicit `play()` at
   `canplay` now starts playback as soon as the decoder has data, unless the user paused during
   loading.
2. The 15-second stall watchdog reopened torrent playback even while data kept arriving,
   discarding the player's buffer. It now treats recent received bytes from the local
   torrent-status endpoint as buffering.

Whether the reported 15 seconds was spent between `canplay` and `canplaythrough` is not yet
established: the previous diagnostics did not log either event. The player now logs both, plus
a one-line startup timeline, so the next TV run shows how much of the wait was piece delivery
and how much was the browser's own buffering threshold. No startup gain is claimed until then.

## Per-peer request queue with long round trips

The TV reported 0.1-0.2 MB/s. The adaptive pipeline was `max(2, ceil(0.75 s x rate / 16 KiB))`,
capped at 16 blocks. Because a peer's measured rate is itself limited by its queue
(`blocks x 16 KiB / RTT`), a peer whose round trip exceeds 0.75 s shrinks to 2 blocks (32 KiB
per round trip) and cannot grow again: five such peers at 1 s RTT give about 0.15 MB/s. The
formula now follows [WebTorrent's getBlockPipelineLength](https://github.com/webtorrent/webtorrent/blob/master/lib/torrent.js)
(`2 + ceil(duration x rate / 16 KiB)`, the fixed +2 lets a queue grow) with libtorrent's default
[request_queue_time](https://github.com/arvidn/libtorrent/blob/RC_2_0/src/settings_pack.cpp) of 3 s,
capped at 64 blocks per peer and at a peer's BEP 10 `reqq`. The engine-wide cap of 256 active
blocks (4 MiB) is unchanged, so outstanding-request memory is not increased.

Whether this was the cause of the TV's low rate is not established: no TV log of per-peer rates
was available, and swarm size or peer upload limits can produce the same numbers. Local tests
cover queue growth at 0.3-2.5 s RTT and reqq limits; the Node 4.4.3 loopback fixture still passes.

## TV trace after the queue change (13.2 GB MKV, 4 MiB pieces, resume at 125 s)

Startup timeline from the TV: local URL 1.4 s, metadata 10.7 s, resume seek done 27.6 s,
`canplay` and playing 35.5 s. `canplay` and `canplaythrough` arrived together at `readyState=4`,
so this TV's browser did not hold back playback after data was available; the earlier
`canplay` change makes no difference here. The service trace shows the resume piece (piece 61)
requested at about 9 s and first delivered about 17 s later, while about 17 MB arrived from 12
peers, most of it for the 32 MiB read-ahead window. The file averages about 2 MB/s and the swarm
delivered about 1 MB/s, so later stalls (for example 25 s at 152 s) match the deficit.

Two changes follow from this and from [libtorrent's time-critical piece picker](https://libtorrent.org/streaming.html),
which sends playhead requests to peers with the lowest estimated queue time and stops queueing
on a peer once its queue exceeds two seconds:

- A peer may hold at most two seconds of its measured rate in playhead (critical) blocks;
  its remaining queue serves read-ahead. Faster peers, and hotswap from slower ones, take the
  rest. Before a peer's rate is known the starting pipeline of 5 applies unchanged.
- The service reports `aheadBytes` (verified RAM contiguous with the reader) for diagnostics.
  The browser's buffered ranges are byte-based estimates on the TV and showed 0 s even while
  paused; the buffer figure was removed from the player at the user's request.

Reviewed and not adopted: [anacrolix/torrent's responsive reader](https://github.com/anacrolix/torrent/blob/master/reader.go)
returns chunks before the piece is verified; it would break the verified-payload rule. Duplicate
"busy" requests from libtorrent are already covered by the one-time urgent-block recovery.
Whether these changes shorten the resume wait is not measured yet.

## Second TV trace after a full restart (same file, resume at 355 s): 66 s

- 0-13 s: no peers (cold service after the restart; tracker/DHT discovery).
- 13-28 s: first 4 MiB piece at a slow swarm ramp.
- 28-42 s: the browser read ~6 MiB (piece 1), the moov at the end, then piece 1 again. The tail
  jump had evicted piece 1, so it was downloaded twice (~5 s here, ~2 s in the first trace).
  Fixed: one reserved cache slot keeps the last piece read before a jump (budget-checked).
- 44-48 s: the resume piece arrived about 4 s after the seek (17 s in the first trace; a single
  run, not a controlled comparison).
- 48-66 s: about 20 MB were delivered from the resume piece before `canplay`. That is consistent
  with decoding from the preceding keyframe to the exact resume time (x264's default keyint of
  250 frames is ~10 s); Chromium has no `fastSeek`. Not changed.

Also from this trace: after the first piece, the engine downloaded the normal 32 MiB read-ahead
from the start of the file (pieces 1-8) although playback resumed at 355 s. Sessions opened with
`resume` (player resume point over two minutes) now select only the pieces actually read until
the first read outside the start (first three pieces) and the end region (last two pieces);
that read is the resume position and gets the normal window. Older services ignore the flag.

## Diagnostics and peer hints (next round)

The second trace showed metadata within 2 s but zero connected peers for the next 13 s; the logs
could not say why. The service now keeps per-engine counters (time to first peer, connection,
unchoke and payload block; connections opened/closed with lifetime and payload of the last
eight; timeouts, chokes, hash failures, hotswaps; request-to-verify time of the last ten
pieces) and a per-connection rate summary. The player logs them compactly (no addresses, names
or URLs) while starting, every 10 s while playing, at each rebuffer, and in a closing summary.

Peers that delivered payload are returned over the loopback status endpoint and stored by the
app (localStorage, which survives TV restarts unlike the service's /tmp), then sent as `peer:`
hints on the next open of the same torrent. This follows libtorrent, which writes known peers
into resume data ([write_resume_data.cpp](https://github.com/arvidn/libtorrent/blob/RC_2_0/src/write_resume_data.cpp),
`add_torrent_params::peers`). Hints only add connection attempts; discovery is unchanged.
Whether this shortens a cold start depends on the remembered peers still being online.

## Third trace: 80 MB before playback (season pack, 16 MiB pieces, resume at 86 s)

The file starts inside piece 209 and ends in piece 250. The browser read the start (piece 209),
8.5 KB at the end (piece 250, which must still be downloaded whole to verify it), then the start
again. With 16 MiB pieces the 48 MiB cache has three slots, so header pinning and the return
slot were both disabled and piece 209 was downloaded twice. Because the resume point (86 s) was
under the two-minute threshold, piece 210 was also fetched as start read-ahead and never used.
Roughly 80 MB arrived before playback; about 32 MB of it was avoidable.

- The return slot now applies whenever at least two other window slots remain (16 MiB pieces:
  window of two pieces plus the return piece = 48 MiB).
- Every resume (any position) opens with `resume`; the player calls the new local
  `/torrent-resumed/<id>` endpoint at the resume seek, which releases the normal read-ahead. The
  index-based heuristic remains as a fallback for older apps.

The previous attempt in the same trace failed with error 4 exactly 30 s after the local URL was
assigned, with no bytes delivered, while the engine kept downloading; the piece was verified 3 s
later. An earlier HIMYM trace showed the same 30 s pattern. The player now reopens the same URL
when the engine has received more data since the previous attempt (at most three times).

## Fourth trace: same episode after these changes (resume at 472 s)

Peers were found in 0.2 s, the first payload block arrived at 2.3 s. Piece 209 took 9.7 s,
piece 250 (8.5 KB needed) 8.5 s, the resume piece 224 12.8 s, at about 2 MB/s. The re-read of the
start (14 MB) was served from RAM. Playback at the resume position began about 34 s after the
local URL with 51.6 MB received, against 50 s and about 80 MB for the same episode before. One
run each on a live swarm, so this is an observation, not a controlled comparison.

Still avoidable: after reading the header the browser continued into piece 210 before issuing the
resume seek, so a few MB went to a piece playback did not use. The remote log also lost a 14 s
batch; failed batches are now kept and retried in order instead of being dropped.

## Episode skipped to the next one mid-way (TV trace)

At 544.7 s of a 1303 s episode the swarm dropped to 3-10 KB/s (only five of 59 discovered peers
ever connected; one delivered almost everything) and piece 227 took 44.7 s. The browser's next
range request received nothing for 20 s, the service's reader stall closed the response, and
the TV's player reported `ended` with the position at 1303.1 s. The player then started the next
episode.

- The service keeps a stalled response open once the session has delivered video; the 20 s
  close remains only before any video reached the player (so start failures are still reported).
- The player tracks the position reached by playback or its own seeks. An `ended` event more
  than 20 s before the duration from that position is treated as a cut stream: reconnect there
  (three attempts, then the existing stall error). Progress saving and the up-next countdown
  ignore the jump.

