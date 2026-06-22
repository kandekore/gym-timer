# Sound files

The timer **synthesizes all sounds by default**, so it works with no files here.

To use your own audio, drop these files into this folder and they'll be picked
up automatically (no code changes needed):

- `bell.mp3` — boxing bell at the start/end of each round
- `knock.mp3` — subtle knock/beep at the 10-second warning
- `complete.mp3` — session completion sound

Any format the browser can decode works (mp3, wav, ogg) as long as the filename
matches. Voice cues ("Round 1", "Rest", "Ten seconds") use the browser's
SpeechSynthesis API and need no files.
