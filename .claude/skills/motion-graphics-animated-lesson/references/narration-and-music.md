# Dialogue, measured timing and ducked background music

## ElevenLabs Eleven v4

Provider: [Fal Eleven v4 API](https://fal.ai/models/elevenlabs/tts/eleven-v4/api), verified 2026-09-30. Runtime class `Fal::Models::ElevenTts`, endpoint `elevenlabs/tts/eleven-v4`, output `mp3_44100_192`, `timestamps: true`. Uses the existing Fal credential, not a separate ElevenLabs API key. Returned alignment can be character chunks; the builder groups characters into words before shifting them onto the master. Fetch current schemas with `openapi:fetch` before production. Preserve model/voice identity; resolve unavailability instead of silently substituting.

Write `prompts/narration/sfx.yml` (starter is intentionally empty):

```yaml
sounds:
  p01: {tts: "A small change can explain a surprising result.", voice: George, stability: 0.45, seed: 11}
  d01: {tts: "Let me test that.", voice: Liam, stability: 0.5, seed: 41}
cues: []
```

These illustrate the default cast. Author relevant text, spelling names/numbers as they should be spoken; p5 can show their exact written forms. `config/cast.json` is the authoring reference, not automatic per-line expansion. Repeat selected voice settings on each sound. Keep line IDs stable and seeds consistent; provider reproducibility is best effort. Only change a voice at user request or agreed substitution.

MCP `run_task`: task `sfx:gen`, options `{"SFX":"narration"}`. Per-line WAV and JSON (alignment, voice settings, request ID) are cached under `output/narration/sounds/`. `ONLY=p01` restricts generation to that line; `FORCE=1` refreshes it. An unchanged provider input resumes its receipt; `NEW_REQUEST=1` means a genuinely new paid take.

Place turns with `prompts/narration/narration.yml`:

```yaml
sfx: narration
lead_in: 1.6
gap: 0.4
tail: 45  # replace with the planned ending's actual duration
trim_db: -45
target_db: -20
lines:
  - {sound: p01, speaker: prof}
  - {sound: d01, speaker: dev, gap: 0.2}
# Explicit at: fixes a start on the master; overlap: permits an intentional interruption.
```

Local Ruby tasks `narration:build` → `audio:analyze[audio/source.wav,audio]` create `audio/song.wav`, per-speaker aligned stems, `audio/words.json` (`w,s,e,speaker,line`) and `audio/lines.json`. Listen before freezing. Derive scene frame boundaries and H3 windows from actual output, not word-count estimates. Tail-only extension must preserve existing word times; compare JSON before/after.

For a scene beginning at frame A, a line at master S uses `audio_at = S - A/24`. Set `audio: audio/stems/prof.wav` or `dev.wav`, plus a little pre-roll; the clip service adds the section offset once. H3 windows are 5–15 s; split longer speeches and hide the cut with an insert or snap zoom. Never speed-change visible speech. Use `media:mouth` plus watched/listened playback to review sync.

## Background beds

The original five tracks are bundled in `assets/lesson/music/`: `intro`, `class`, `blackboard`, `devroom`, `titles` (MP3, 192 kbps CBR, re-encoded from the original WAVs). Starter `music.yml` uses `file: .skill/assets/lesson/music/<name>.mp3`; fill its measured `segments` and run `music:bed` locally, with no provider call. Reuse intro for the opening and titles for curtain/credits by default. `FORCE` never regenerates a `file:` track. SHA-256 hashes are in the asset manifest. Sidecar metadata preserves original prompt, duration and request ID. The following generated-track recipe is optional when different music is requested.


Provider: [Fal ElevenLabs Music v2.5 API](https://fal.ai/models/elevenlabs/music/v2.5/api). `Fal::Models::ElevenMusic` defaults to instrumental output. Use `music:gen` directly through MCP (now allow-listed); `sfx:gen` is reserved for TTS/SFX. Do not carry forward the source project's workaround that routed music through `sfx:gen`.

`prompts/finish-music/music.yml`:

```yaml
source: output/clean.mp4
out: output/clean_music.mp4
voice: audio/song.wav
base_db: -30
duck_db: -9
attack: 0.06
release: 0.45
hold: 0.25
lookahead: 0.12
tracks:
  class: {prompt: "Playful pizzicato, marimba and bassoon, instrumental, no vocals", seconds: 60}
  titles: {prompt: "Warm upbeat ragtime piano, clarinet and tuba, instrumental", seconds: 60}
segments:
  - {from: 0, to: 100, track: class, fade_out: 0.05}
  # 100..103 is an example intentional joke pause/iris; use measured times instead.
  - {from: 103, to: 140, track: titles, duck: false, gain_db: 6, fade_in: 0.8}
```

These numbers are illustrative, not a preset lesson duration. `music:gen`, options `{"SFX":"finish-music"}`, creates missing/stale tracks; only prompt and seconds are generation inputs (no music seed support). Local `SFX=finish-music ... music:bed` loops/crossfades, follows the voice envelope, mixes and muxes picture unchanged. `report.json` records bed levels, voice-to-bed margin, peaks and limiter gain. Start around -30 dBFS bed RMS with -9 dB ducking, then listen; the source lesson kept speech around 14–17 dB above its bed. Preserve the silence after the last joke line.

Segments support `restart`, `tape_stop`, `tape_start`, `fade_in/out`, `duck` and `gain_db`. Use these for the optional rewind bridge. Voice remains the master; if a separate sidechain is supplied it must be the complete intended narration, since this mixer uses it as the output voice too.

## Assembly and SFX

`media:preview[output/clean.mp4,s01,s02,...]` validates contiguous exact frame ranges, joins picture and muxes a single narration master. Then `music:bed` creates `clean_music.mp4`; SFX config uses that as `source`, output `with-sfx.mp4`.

Use sparse chalk, pointer, keyboard, stamp, transition, tada and curtain sounds. `sfx:gen` caches Stable Audio SFX; `sfx:mix` levels them against underlying audio and reports cue peaks. Start `rel_db: -8`, `peak_db: -6`, `max_gain_db: 12`; tune by listening. Silent stretches use a -30 dB floor, so tada may need a higher relative level. Don't allow snips/stamps to mask syllables. Music ends on the final joke; tada begins after the deliberate pause.

Probe all versions: identical frame count, duration and picture; no last-frame loss from decoded AAC. Retain master, speaker stems, words/lines, cue files, level reports and model metadata for revisions and accurate credits.
