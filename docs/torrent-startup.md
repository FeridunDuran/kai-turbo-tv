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
