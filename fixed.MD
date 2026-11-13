# Fixes applied

## Begin button stuck disabled
**File:** `audio_capture/static/essay_annotation.js` (`createBeginTrial`)

Cause: the html-button-response plugin disables its buttons on any click, and the trial only ends via our own countdown handler. If that handler was not attached or `finishTrial()` failed, the button stayed disabled forever.

- Button lookup is scoped to `#jspsych-target .jspsych-btn`.
- The handler is always attached; if the countdown elements are missing it ends the trial immediately instead of returning.
- `finishTrial()` is wrapped in try/catch; on failure the button is re-enabled and reset to "Begin".
- A `started` guard prevents double starts; the undeclared global `countdownStarted` was removed.

## Follow-up: Begin still stuck after deploy (root cause found)
**File:** `audio_capture/static/essay_annotation.js`

Reading the jsPsych plugin source showed the real cause. The `html-audio-response` plugin calls `recorder.start()` and only draws its page when the MediaRecorder fires a `start` event. If the microphone stream from the mic test has died (device switched or slept, browser reclaimed it, tab backgrounded for long), that event never fires. The old Begin page stays on screen with its button disabled ("Starting..."), and nothing can recover it. This is why it was random and why the first round of fixes did not remove it.

- `ensureMicrophoneReady()` runs at the end of the Begin countdown. It checks the recorder's stream is live and the recorder idle, and if not, re-acquires the microphone (same device, falling back to default) and re-initialises the recorder. The Begin click counts as the user gesture.
- If the microphone cannot be re-acquired, the button is re-enabled with a message so the participant can retry.
- `watchForStall()`: if the recording page has not replaced the Begin page 6s after the trial ended, the button becomes a "Reload page" button with an explanation. Progress is kept because question assignments persist for the lease period.

The console message "An AudioContext was prevented from starting automatically" is unrelated: jsPsych creates a Web Audio context when it initialises, before any click. It is harmless here because the task plays no jsPsych audio stimuli.

## Other fixes

| Issue | Fix |
|---|---|
| `shuffle` was `async` and returned nothing, so non-sequential trials crashed on `questions.length` | `shuffle` is now synchronous and returns the array; the `await` was removed (`essay_annotation.js`) |
| `createTimeline` not awaited | `await` added in `annotation.html` |
| Generic "microphone blocked" error for every failure | `annotation.html` now shows a mic-specific message only for mic errors, otherwise the real error message |
| Upload failures were silent (MC branch had no error handling) | New `uploadAudio()` in `utils.js` checks the response, retries once, and shows a visible error message if it still fails |
| MC branch used a shared global `trialAudio` that could be stale or `null` (and crashed on `.length`) | Audio is held in a per-question `pending` object; a missing recording shows an error instead of throwing. Debug size logging removed |
| `record-again` click listeners accumulated on `document`, restarting the timer with stale limits | New `bindRecordAgain()` in `utils.js` keeps exactly one listener |
| Timer: Finish button looked up once after a fixed 100ms, missing null checks, leftover intervals | `startTimer` rewritten: button/clock/label looked up on each use with null checks, all timers tracked and cleared by new `stopTimer()` |
| Mic-test trial never stopped the timer | Added `on_finish: stopTimer` |
| Duplicate `trial_name`s silently collided (assignments, counts and uploads are keyed by name) | `assign_questions` now returns a clear 500 error if names are not unique (`views.py`). The active config `questions_exemplar.json` already has unique names |
| `AudioStorage.trial_id` was an integer but question IDs can be strings | Changed to `CharField(max_length=100)`; migration `0004_alter_audiostorage_trial_id.py` added; `save_audio` stores `str(trial_id)` |
| Audio filenames not unique per question; unsanitised `trial_name` in path | Filename is now `date_trial_questionId_worker.webm` with all parts sanitised via new `safe_name()` |
| Feedback overwritten if submitted twice the same day | Feedback file is opened in append mode with a separator |
| Secure cookies forced on while `DEBUG = True`, breaking sessions/CSRF over `http://localhost` | `CSRF_COOKIE_SECURE` / `SESSION_COOKIE_SECURE` are now `not DEBUG` (`settings.py`). **Production must set `DEBUG = False`** |

## Deliberately not changed
- **HTML escaping of `question` / `instructions`:** the config is trusted and may intentionally contain markup, so it is still injected as HTML.
- **24h assignment lease:** this is a policy setting (`QUESTION_ASSIGNMENT_LEASE_HOURS`), not a bug. Participants who return after expiry get new questions by design.

## Not verified
Django and Node are not installed in this environment, so I could only run a Python syntax check (passed). I did not run the app, the JS, or the migration. Please run `python manage.py migrate` and test one full session (mic test, Begin, record, MC answer, feedback).
