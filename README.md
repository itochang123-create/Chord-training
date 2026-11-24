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

The progression menu is ordered as an **editorial starting point for Mandopop familiarity, not a measured frequency chart.** It includes Canon (`I–V–vi–iii–IV–I–IV–V`), 6415 (`vi–IV–I–V`), 1564 (`I–V–vi–IV`), 1645 (`I–vi–IV–V`), the Royal Road (`IV–V–iii–vi`) and a longer form, ii–V–I, and minor loops such as `i–VI–III–VII`, `i–iv–V–i`, and `iiø–V–i`.

Color examples are labeled as examples, not frequency claims: `ii9–V13–Imaj9` (Dm9–G13–Cmaj9 in C), `I–#I°7–ii7–V7` (C–C♯dim7–Dm7–G7), and `V7sus4–V7–Imaj7` (G7sus4–G7–Cmaj7). A diminished chord is often passing or leading-tone color. A suspended chord usually resolves. The quality stays on that chord. You can edit one chord in the row, or type the whole line.

1645 is `I–vi–IV–V`. It is not 1564.

### The bass-walk example

`vi–IV–I–V6` in G is **Em–C–G–D/F♯**. `D/F♯` is D major with F♯ in the bass: first inversion, because F♯ is the 3rd. Move the key to C and the same numerals become **Am–F–C–G/B**.

The right hand can stay in root position while the bass is inverted. A slash note that is not a chord tone, such as `C/B` or `Am/G`, is labeled a **non-chord slash bass**. `Cmaj7/B` is a third inversion, because B is the 7th.

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
- **Broken chord** — one note at a time. Each note ends before the next.
- **Alberti bass** — low, high, middle, high, with the bass on the beat.
- **Waltz** — bass, then chord, then chord.
- **Ballad roll** — the bass holds while the right hand rolls.

The keyboard lights only notes that are sounding, bass in amber and right hand in teal. The voicing line is the written piano layout. “Sounding now” is the notes in the air at that moment.

### What the voicing leaves out

Triads, 6ths, sus chords, and 7ths sound every chord tone. 9ths and 13ths leave out the 5th. A dominant 13 keeps the flat 7th, so C13 is not C6. 11ths leave out the 3rd and the 5th. Cdim7’s seventh is 9 semitones; Cm7♭5’s seventh is 10. A slash bass is still played when the right hand omits that pitch.

## Safari and other browsers

Sound uses the Web Audio API only. It starts after Play, Pause, Stop, or Restart, because browsers will not start audio without a gesture. Scheduling looks ahead on the audio clock and cancels voices when you stop or change the loop, so Play does not stack a second copy. If the tab is hidden or the system interrupts audio, Chord pauses and waits for Play again. The master level is capped and compressed.

Space plays or pauses when focus is not in a control. Escape stops.

## Tests

```bash
npm test
```

The unit tests cover pitch sets, major and minor scale spelling, transposition (including Em–C–G–D/F♯ from G to C), bass inversion versus right-hand inversion, non-chord slash bass, 6ths versus 13ths, diminished versus half-diminished sevenths, sus and 7sus4, per-chord quality, nickname parsing, piano-accompaniment note lifetimes, and the listen/quiz views that must not reveal an answer early.

## GitHub Pages

This project is a static Vite build with `base: '/Chord-training/'`, so asset URLs match the GitHub project site `https://itochang123-create.github.io/Chord-training/`. The workflow in `.github/workflows/pages.yml` installs, tests, builds, and deploys `dist/` with GitHub Actions.

The target repository is [itochang123-create/Chord-training](https://github.com/itochang123-create/Chord-training). Pages must use **GitHub Actions** as the source (`build_type: workflow`). The live URL is only that project site after a successful Actions deploy, not the local preview.
