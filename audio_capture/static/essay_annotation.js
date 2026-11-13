const MIN_LEN_TEST = JSON.parse(document.getElementById('lengths').textContent)[0]['min_len_test'];
const MAX_LEN_TEST = JSON.parse(document.getElementById('lengths').textContent)[0]['max_len_test'];
const ENDING_TEXT = JSON.parse(document.getElementById('end_text').textContent);
const RECORDING_COUNTDOWN_SECONDS = 3;

async function loadJson() {
	var response = await fetch('assign_questions/');
	if (!response.ok) {
		throw new Error('Unable to assign questions');
	}
	return response.json();
}

// The html-audio-response plugin only draws its page once the MediaRecorder
// fires "start". If the microphone stream has died since the mic test (device
// switched or slept, browser reclaimed it) that event never fires and the
// participant is stuck on the old, disabled Begin page. Check the stream and
// re-acquire it before the trial starts; the Begin click is a user gesture.
async function ensureMicrophoneReady() {
	var pluginAPI = window.jsPsych.pluginAPI;
	var recorder = pluginAPI.getMicrophoneRecorder();
	var tracks = recorder && recorder.stream ? recorder.stream.getAudioTracks() : [];
	var live = tracks.length > 0 && tracks.every(function (track) {
		return track.readyState === 'live';
	});

	if (live && recorder.state === 'inactive') {
		return;
	}

	if (recorder && recorder.state !== 'inactive') {
		try {
			recorder.stop();
		} catch (error) {
			console.warn('Unable to stop stale recorder:', error);
		}
	}

	var micTrials = window.jsPsych.data.get().filter({trial_type: 'initialize-microphone'}).values();
	var deviceId = micTrials.length ? micTrials[micTrials.length - 1].device_id : null;

	var stream;
	try {
		stream = await navigator.mediaDevices.getUserMedia({
			audio: deviceId ? {deviceId: {exact: deviceId}} : true,
		});
	} catch (error) {
		// The chosen device may be gone; fall back to the default microphone.
		stream = await navigator.mediaDevices.getUserMedia({audio: true});
	}
	pluginAPI.initializeMicrophoneRecorder(stream);
}

function createBeginTrial(stimulus) {
	return {
		type: jsPsychHtmlButtonResponse,
		stimulus: `
			${stimulus}
			<div class="recording" id="recording-countdown" hidden>
				<p class="recording-title">
					Recording will start in<strong><span id="countdown-clock">${RECORDING_COUNTDOWN_SECONDS}</span></strong>
				</p>
			</div>
		`,
		choices: ['Begin'],
		response_ends_trial: false,
		on_load: function () {
			var beginButton = document.querySelector('#jspsych-target .jspsych-btn');
			var countdown = document.getElementById('recording-countdown');
			var countdownClock = document.getElementById('countdown-clock');
			var started = false;

			if (!beginButton) {
				return;
			}

			// The plugin disables its buttons on any click, so re-enable on failure
			// to make sure the participant is never left with a dead button.
			function resetButton(message) {
				started = false;
				beginButton.disabled = false;
				beginButton.textContent = 'Begin';
				if (countdown) countdown.hidden = true;
				if (message) showError(message);
			}

			// If the recording page has not replaced this page shortly after the trial
			// ended, the recorder failed to start; give the participant a way out.
			function watchForStall() {
				setTimeout(function () {
					if (document.getElementById('countdown-clock')) {
						beginButton.disabled = false;
						beginButton.textContent = 'Reload page';
						beginButton.onclick = function () {
							window.location.reload();
						};
						showError('Recording could not start. Please reload the page; your progress is kept.');
					}
				}, 6000);
			}

			async function endTrial() {
				try {
					await ensureMicrophoneReady();
					window.jsPsych.finishTrial();
					watchForStall();
				} catch (error) {
					console.error('Unable to start recording:', error);
					resetButton('Your microphone could not be accessed. Please check that it is connected and allowed in your browser, then click Begin again.');
				}
			}

			beginButton.addEventListener('click', function () {
				if (started) {
					return;
				}
				started = true;
				showError('');

				beginButton.disabled = true;

				// Without the countdown elements, fall back to ending immediately.
				if (!countdown || !countdownClock) {
					endTrial();
					return;
				}

				var secondsRemaining = RECORDING_COUNTDOWN_SECONDS;
				beginButton.textContent = 'Starting...';
				countdown.hidden = false;
				countdownClock.textContent = secondsRemaining;

				var countdownInterval = setInterval(function () {
					secondsRemaining -= 1;

					if (secondsRemaining > 0) {
						countdownClock.textContent = secondsRemaining;
					} else {
						clearInterval(countdownInterval);
						endTrial();
					}
				}, 1000);
			});
		},
	};
}

async function baseBefore(i, j, repetitions, trialData, trialJson) {
	var instruction_text = `
		<h2 class="section-label"> Part ${i + 1}: ${trialData['trial_name']} (Trial ${j + 1} of ${repetitions})</h2>
		<div class="section">
			<p class='instruction_emphasize'>
				${trialData['instructions']}
			</p>
		</div>
		<h2 class="section-label"> Prompt </h2>
		<p class='emphasize'>
			${trialJson['question']}
		</p>
		<br>
	`;

	var trial_text = `
		<h2 class="section-label"> Part ${i + 1}: ${trialData['trial_name']} (Trial ${j+1} of ${repetitions})</h2>
		<div class="section">
			<p class='instruction_emphasize'>
				${trialData['instructions']}
			</p>
		</div>
		<h2 class="section-label"> Prompt </h2>
		<p class='emphasize'>
			${trialJson['question']}
		</p>
		<br>
		<div class='recording'>
			<h2 class='recording-title'>Recording in Progress</h2>
			<p><span id="req">Required duration remaining</span>: <strong><span id="clock"></span></strong></p>
		</div>
	`;

	return {
		"instruction_text": instruction_text,
		"trial_text": trial_text
	};
}

async function baseAfter(i, j, repetitions, trialData, trialJson) {
	var instruction_text = `
		<h2 class="section-label"> Part ${i + 1}: ${trialData['trial_name']} (Trial ${j + 1} of ${repetitions})</h2>
		<div class="section">
			<p class='instruction_emphasize'>
				${trialData['instructions']}
			</p>
		</div>
	`;

	var trial_text = `
		<h2 class="section-label"> Part ${i + 1}: ${trialData['trial_name']} (Trial ${j + 1} of ${repetitions})</h2>
		<div class="section">
			<p class='instruction_emphasize'>
				${trialData['instructions']}
			</p>
		</div>
		<h2 class="section-label"> Prompt </h2>
		<p class='emphasize'>
			${trialJson['question']}
		</p>
		<br>
		<div class='recording'>
			<h2 class='recording-title'>Recording in Progress</h2>
			<p><span id="req">Required duration remaining</span>: <strong><span id="clock"></span></strong></p>
		</div>
	`;

	return {
		instruction_text: instruction_text,
		trial_text: trial_text,
	};
}

async function mcBefore(i, j, repetitions, trialData, trialJson) {
	var instruction_text = `
		<h2 class="section-label"> Part ${i + 1}: ${trialData['trial_name']} (Trial ${j + 1} of ${repetitions})</h2>
		<div class="section">
			<p class='instruction_emphasize'>
				${trialData['instructions']}
			</p>
		</div>
		<h2 class="section-label"> Prompt </h2>
		<p class="emphasize">
			${trialJson['question']}
		</p>
		<br>
	`;

	var trial_text = `
		<h2 class="section-label"> Part ${i + 1}: ${trialData['trial_name']} (Trial ${j + 1} of ${repetitions})</h2>
		<div class="section">
			<p class='instruction_emphasize'>
				${trialData['instructions']}
			</p>
		</div>
		<h2 class="section-label"> Prompt </h2>
		<p class="emphasize">
			${trialJson['question']}
		</p>
		<br>
		<div class='recording'>
			<h2 class='recording-title'>Recording in Progress</h2>
            <p><span id="req">Required duration remaining</span>: <strong><span id="clock"></span></strong></p>
		</div>
	`;

	return {
		instruction_text: instruction_text,
		trial_text: trial_text,
	};
}

async function mcAfter(i, j, repetitions, trialData, trialJson) {
	var instruction_text = `
		<h2 class="section-label"> Part ${i + 1}: ${trialData['trial_name']} (Trial ${j + 1} of ${repetitions})</h2>
		<div class="section">
			<p class='instruction_emphasize'>
				${trialData['instructions']}
			</p>
		</div>
	`;

	var trial_text = `
		<h2 class="section-label"> Part ${i + 1}: ${trialData['trial_name']} (Trial ${j + 1} of ${repetitions})</h2>
		<div class="section">
			<p class='instruction_emphasize'>
				${trialData['instructions']}
			</p>
		</div>
		<h2 class="section-label"> Prompt </h2>
		<p class="emphasize">
			${trialJson['question']}
		</p>
		<br>
		<div class='recording'>
			<h2 class='recording-title'>Recording in Progress</h2>
            <p><span id="req">Required duration remaining</span>: <strong><span id="clock"></span></strong></p>
		</div>
	`;

	return {
		instruction_text: instruction_text,
		trial_text: trial_text,
	};
}

// Source - https://stackoverflow.com/a/2450976
// Posted by ChristopheD, modified by community. See post 'Timeline' for change history
// Retrieved 2026-04-09, License - CC BY-SA 4.0
function shuffle(array) {
  let currentIndex = array.length;

  // While there remain elements to shuffle...
  while (currentIndex != 0) {

    // Pick a remaining element...
    let randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }

  return array;
}

async function createTimeline(allJson) {
	var timeline = [];

	var init_mic = {
		type: jsPsychInitializeMicrophone,
	};

	var mic_test = createBeginTrial(`
            <h2 class="section-label">Microphone Testing Instructions</h2>

            <div class="section">
                <p>
                    Before beginning the first trial, we ask all participants to complete a brief microphone self-test. A ten-second snippet of audio will be recorded and you will have the ability to play it back once time is up.
                    <br><br>
                    If the audio quality is satisfactory, feel free to begin the trials. If not, we recommend switching devices or attaching an external microphone. This is a self-diagnosed test; <strong>these ten seconds of audio will not be saved.</strong> The trials will operate identically to this test run, so take this opportunity to familiarize yourself with the environment!
                </p>
            </div>
        `);

	var mic_test_trial = {
		type: jsPsychHtmlAudioResponse,
		stimulus: `
            <h2 class="section-label">Microphone Testing Instructions</h2>

            <div class="section">
                <p>
                    Before beginning the first trial, we ask all participants to complete a brief microphone self-test. A ten-second snippet of audio will be recorded and you will have the ability to play it back once time is up.
                    <br><br>
                    If the audio quality is satisfactory, feel free to begin the trials. If not, we recommend switching devices or attaching an external microphone. This is a self-diagnosed test; <strong>these ten seconds of audio will not be saved.</strong> The trials will operate identically to this test run, so take this opportunity to familiarize yourself with the environment!
                </p>
            </div>
            <div class='recording'>
                <h2 class='recording-title'>Recording in Progress</h2>
                <p><span id="req">Required duration remaining</span>: <strong><span id="clock"></span></strong></p>
            </div>
            `,
		recording_duration: MAX_LEN_TEST * 1000 + 1000,
		allow_playback: true,
		done_button_label: 'Finish',
		on_load: function () {
			startTimer(MIN_LEN_TEST, MAX_LEN_TEST);
			bindRecordAgain(MIN_LEN_TEST, MAX_LEN_TEST);
		},
		on_finish: function () {
			stopTimer();
		},
	};

	timeline.push(init_mic);
	timeline.push(mic_test);
	timeline.push(mic_test_trial);

    for (let i = 0; i < allJson.length; i++) {
		const trialData = allJson[i];
		const { repetitions = 1, questions: rawQuestions = [] } = trialData;
		const questions = trialData.selection == 'sequential'
			? rawQuestions
			: shuffle([...rawQuestions]);

		for (let j = 0; j < Math.min(repetitions, questions.length); j++) {
			const trialJson = questions[j];

			if (trialData.hasOwnProperty('mc_options')) {
				const text = trialData.display == 'after'
					? await mcAfter(i, j, repetitions, trialData, trialJson)
					: await mcBefore(i, j, repetitions, trialData, trialJson);

				var instruction = createBeginTrial(text['instruction_text']);
				const pending = {audio: null};

				var trial = {
					type: jsPsychHtmlAudioResponse,
					stimulus: text['trial_text'],
					recording_duration: trialData['max_time'] * 1000 + 1000,
					allow_playback: true,
					done_button_label: 'Finish',
					on_load: function () {
						var minTime = trialData['min_time'];
						var maxTime = trialData['max_time'];
						startTimer(minTime, maxTime);
						bindRecordAgain(minTime, maxTime);
					},
					on_finish: function (data) {
						stopTimer();
						pending.audio = data.response;
					},
				};

				var choice = {
					type: jsPsychSurveyMultiChoice,
					questions: [
						{
							prompt: 'What was your final judgement?',
							name: 'label',
							options: trialData['mc_options'],
							required: true,
						},
					],
					on_finish: function (data) {
						var audio = pending.audio;
						pending.audio = null;
						if (!audio) {
							showError('No recording was captured for the last question, so it could not be saved.');
							return;
						}
						uploadAudio({
							audio_base64: audio,
							label: data.response.label,
							trial_name: trialData['trial_name'],
							trial_id: trialJson['id'],
							assignment_id: trialJson['assignment_id'],
						});
					},
				};

				timeline.push(instruction);
				timeline.push(trial);
				timeline.push(choice);
			} else {
				const text = trialData.display == 'after'
					? await baseAfter(i, j, repetitions, trialData, trialJson)
					: await baseBefore(i, j, repetitions, trialData, trialJson);

				var instruction = createBeginTrial(text['instruction_text']);

				var trial = {
					type: jsPsychHtmlAudioResponse,
					stimulus: text['trial_text'],
					recording_duration: trialData['max_time'] * 1000 + 1000,
					allow_playback: true,
					done_button_label: 'Finish',
					on_load: function () {
						var minTime = trialData['min_time'];
						var maxTime = trialData['max_time'];
						startTimer(minTime, maxTime);
						bindRecordAgain(minTime, maxTime);
					},
					on_finish: function (data) {
						stopTimer();
						uploadAudio({
							audio_base64: data.response,
							trial_name: trialData['trial_name'],
							trial_id: trialJson['id'],
							assignment_id: trialJson['assignment_id'],
						});
					},
				};

				timeline.push(instruction);
				timeline.push(trial);
			}
		}
	}

	var feedback = {
		type: jsPsychSurveyText,
		questions: [
			{prompt: '(Optional) Please share any additional thoughts you have about our task and anything you think we should do to improve it. Your feedback would be greatly appreciated!', rows: 8, columns: 60}
		],
		on_finish: function (data) {
			var feedbackText = '';
			if (Array.isArray(data.response)) {
				feedbackText = data.response[0] || '';
			} else if (data.response && typeof data.response === 'object') {
				feedbackText = Object.values(data.response).find(function (value) {
					return typeof value === 'string' && value.trim() !== '';
				}) || '';
			} else {
				feedbackText = data.response || '';
			}

			if (!feedbackText.trim()) {
				return;
			}

			fetch('save_feedback/', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-CSRFToken': getCookie('csrftoken'),
				},
				body: JSON.stringify({
					feedback_text: feedbackText,
				}),
			})
				.then(function (response) {
					console.log('Feedback response status:', response.status);
					return response.json();
				})
				.then(function (result) {
					console.log('Feedback save result:', result);
				})
				.catch(function (error) {
					console.error('Error saving feedback:', error);
				});
		},
	}

	var endscreen = {
		type: jsPsychInstructions,
		pages: [
			ENDING_TEXT,
		],
		show_clickable_nav: false,
	};

	timeline.push(feedback);
	timeline.push(endscreen);

	return timeline;
}
