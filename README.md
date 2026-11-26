# Chord

Chord is a practice desk for hearing chord progressions. Pick a loop, press Play, and the app synthesizes it in the browser. It is for ear training, not for playing recordings.

There is no account, no sample library, and no API key. Custom presets and settings stay in `localStorage` on the device.

## Run it

```bash
npm install
npm test
npm run dev
```

The dev server listens on port **47321** at [http://127.0.0.1:47321/Chord-training/](http://127.0.0.1:47321/Chord-training/). `npm run build` writes a static site to `dist/` with the same `/Chord-training/` base path used by GitHub Pages. `npm run preview` serves that build on the same port.

## Practice

- **Practice** shows the chord, the Roman numeral, the sounding pitches, the bass note, the right-hand notes, and a keyboard.
- **Listen** hides the names and the keyboard until you press Reveal. The next chord hides them again.
- **Quiz** plays a progression in a random key and asks which one it was. Triads, or the color examples as written. The correct choice is not marked until you answer.

Practice is in C. There is no key changer. 1645 is `I–vi–IV–V`, which is C–Am–F–G.

The progression menu is ordered as an **editorial starting point for Mandopop familiarity, not a measured frequency chart.** First is 1645 (`I–vi–IV–V`, also called 1 6 4 5). Second is the descending-bass Canon (`I–V6–vi–iii6–IV–I6–ii–V`), bass C–B–A–G–F–E–D–G. After those: 6415, 1564, the Royal Road and a longer form, the root-position Canon, ii–V–I, and minor loops in C minor such as `i–VI–III–VII`, `i–iv–V–i`, and `iiø–V–i`.

Color buttons add a color only where it is idiomatic. On 1645, 7 is C–Am7–F–G7. 9 colors vi and V (C–Am9–F–G9). 11 and 13 color V (G11, G13). Sus is one resolving pair, Gsus4 then G. Dim adds one passing dim7, F♯dim7 between F and G. The custom field is one text box; saved presets stay on this device. Play and Pause sit above the Practice, Listen, and Quiz tabs.

1645 is `I–vi–IV–V`. It is not 1564.

### The bass-walk example

`vi–IV–I–V6` in C is **Am–F–C–G/B**. `G/B` is G major with B in the bass: first inversion, because B is the 3rd.

The right hand is always smooth voice leading. The bass can still be inverted on its own. A slash note that is not a chord tone, such as `C/B` or `Am/G`, is labeled a **non-chord slash bass**. `Cmaj7/B` is a third inversion, because B is the 7th.

### Writing progressions

Separators are spaces, commas, hyphens, or dashes. These are the same loop:

- `vi–IV–I–V`
- `6-4-1-5`
- `Am F C G` in C major

`1564` with no separators is rejected. It is the nickname for `I–V–vi–IV`, not a chord.

| Grammar | 6 means | Slash bass means |
| --- | --- | --- |
| Roman numerals | First inversion (`V6`, `I64`, `V65`) | A scale degree (`V/7` in G puts F♯ under D) |
| Numbers | An added sixth (`16` is not two chords; write `1-6`) | A scale degree (`5/7`) |
| Chord symbols | An added sixth (`C6` is C E G A) | A note name (`D/F#`) |

`sis2` and `sis4` mean sus2 and sus4. Hyphen is not a minor sign: write `Cm7`, not `C-7`. Secondary dominants (`V/vi`) are rejected instead of being guessed.

Roman case chooses the triad. In C minor, `III` is E♭ major, `v` is G minor, and `V` is G major (B, not B♭). Numbers follow that same scale until you add a suffix (`5maj`). A flat or sharp before a number borrows a major triad: `b7` in C is B♭.

### Piano accompaniments

Tempo is the quarter note. The accompaniment chooses its own shape. There is no separate time-signature or beats-per-chord control.

- **Plain chord** — one attack, then the chord holds.
- **Block chords** — the whole chord together, twice in the bar.
- **Bass and chord** — bass on 1 and 3, chord on 2 and 4.
- **Swing shuffle** — swung eighths. Bass on 1 and 3, a short chord on the offbeat.
- **Boogie-woogie** — swung eighths. The left hand walks root, 3rd, 5th, 6th, and flat 7. Short chords on the and of 2 and 4.
- **Jump blues** — a driving shuffle. Left hand rocks root-and-fifth with root-and-sixth, and the right hand punches 2 and 4.
- **Bebop comp** — walking quarter-note bass into the next root. The right hand comps short rootless chords on swung offbeats.
- **Stride** — low bass on 1, the chord on 2, a higher bass note on 3, the chord again on 4.
- **Walking bass** — root, chord tone, fifth, then a step toward the next chord.
- **Pedal bass** — one bass note holds; the chord taps on 2 and 4.
- **Broken chord** — one note at a time, up and back. Each note ends before the next.
- **Alberti bass** — low, high, middle, high, with the bass on the beat.
- **Broken octaves** — the bass note and the octave above, back and forth.
- **Rolled arpeggio** — a slow upward roll; each new note keeps ringing.
- **Ballad roll** — the bass holds while the right hand rolls one note at a time.
- **Pop eighth notes** — the chord on every eighth note, bass on 1 and 3.
- **Rock octaves** — bass octaves on the strong beats, the chord on the offbeats.
- **Waltz** — bass, then chord, then chord.
- **Hymn** — long chord tones on 1 and 3, with a breath before the next chord.
- **Jazz comp** — bass on 1, right-hand jabs on the and of 2 and on 4.
- **Gospel chops** — bass on 1, then the chord on every offbeat.
- **Bossa nova** — bass on 1, a quiet chord just after 2, the fifth of the bass on 4.
- **March** — clipped bass, chord, bass, chord.
- **Tremolo** — the bass holds while two right-hand notes tremble.
- **3+3+2 ballad** — the chord lands on 1, the and of 2, and 4.

The keyboard lights only notes that are sounding, bass in amber and right hand in teal. The voicing line is the written piano layout. “Sounding now” is the notes in the air at that moment.

### What the voicing leaves out

Triads, 6ths, sus chords, and 7ths sound every chord tone. 9ths and 13ths leave out the 5th. A dominant 13 keeps the flat 7th, so C13 is not C6. 11ths leave out the 3rd and the 5th. Cdim7’s seventh is 9 semitones; Cm7♭5’s seventh is 10. A slash bass is still played when the right hand omits that pitch.

## Safari and other browsers

Sound uses the Web Audio oscillator synth only. There is no sample download. It starts after Play, Pause, Stop, or Restart, because browsers will not start audio without a gesture. On iPhone, Play also opens a playback audio session and a silent looping media element so the ring/silent switch does not mute the synth. Scheduling looks ahead on the audio clock, a little after the clock time once the context is running, and cancels voices when you stop or change the loop, so Play does not stack a second copy. If the tab is hidden, the phone locks, or iOS interrupts audio, Chord pauses and waits for Play again. If the context is still not running after a tap, the page says to tap Play again and check the silent switch and volume. The master level is capped and compressed.

Space plays or pauses when focus is not in a control. Escape stops.

## Tests

```bash
npm test
```

The unit tests cover pitch sets, major and minor scale spelling, transposition (including Em–C–G–D/F♯ from G to C), bass inversion versus right-hand inversion, non-chord slash bass, 6ths versus 13ths, diminished versus half-diminished sevenths, sus and 7sus4, per-chord quality, nickname parsing, piano-accompaniment note lifetimes, and the listen/quiz views that must not reveal an answer early.

## GitHub Pages

This project is a static Vite build with `base: '/Chord-training/'`, so asset URLs match the GitHub project site `https://itochang123-create.github.io/Chord-training/`. The workflow in `.github/workflows/pages.yml` installs, tests, builds, and deploys `dist/` with GitHub Actions.

The target repository is [itochang123-create/Chord-training](https://github.com/itochang123-create/Chord-training). Pages must use **GitHub Actions** as the source (`build_type: workflow`). The live URL is only that project site after a successful Actions deploy, not the local preview.
