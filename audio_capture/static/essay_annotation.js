const MIN_LEN_TEST = JSON.parse(document.getElementById('lengths').textContent)[0]['min_len_test'];
const MAX_LEN_TEST = JSON.parse(document.getElementById('lengths').textContent)[0]['max_len_test'];
const ENDING_TEXT = JSON.parse(document.getElementById('end_text').textContent);

async function loadJson() {
	var response = await fetch('/static/questions.json');
	var json = await response.json();

	return json;
}

async function baseBefore(i, trialData, trialJson) {
	var instruction_text = `
		<h2 class="section-label"> Part ${i + 1}: ${trialData['trial_name']}</h2>
		<div class="section">
			<p>
				${trialData['instructions']}
			</p>
		</div>
		<h2 class="section-label"> Prompt </h2>
		<p class='emphasize'>
			${trialJson['question']}
		</p>
		<br>
		<p class='recording'>
			Clicking <strong>Begin</strong> will start the recording immediately. Please begin whenever you're ready.
		</p>
	`;

	var trial_text = `
			<h2 class="section-label"> Part ${i + 1}: ${trialData['trial_name']}</h2>
			<div class="section">
				<p>
					${trialData['instructions']}
				</p>
			</div>
			<h2 class="section-label"> Prompt </h2>
			<p class='emphasize'>
				${trialJson['question']}
			</p>
			<br>
			<div class='recording'>
				<h2 class='recording-title'>Recoring in Progress</h2>
				<p>Required duration remaining: <strong><span id="clock"></span></strong></p>
			</div>
	`;

	return {
		"instruction_text": instruction_text,
		"trial_text": trial_text
	};
}

async function baseAfter(i, trialData, trialJson) {
	var instruction_text = `
		<h2 class="section-label"> Part ${i + 1}: ${trialData['trial_name']}</h2>
		<div class="section">
			<p>
				${trialData['instructions']}
			</p>
		</div>
		<p class='recording'>
			Clicking <strong>Begin</strong> will start the recording immediately. Please begin whenever you're ready.
		</p>
	`;

	var trial_text = `
			<h2 class="section-label"> Part ${i + 1}: ${trialData['trial_name']}</h2>
			<div class="section">
				<p>
					${trialData['instructions']}
				</p>
			</div>
			<h2 class="section-label"> Prompt </h2>
			<p class='emphasize'>
				${trialJson['question']}
			</p>
			<br>
			<div class='recording'>
				<h2 class='recording-title'>Recoring in Progress</h2>
				<p>Required duration remaining: <strong><span id="clock"></span></strong></p>
			</div>
	`;

	return {
		"instruction_text": instruction_text,
		"trial_text": trial_text
	};
}

async function mcBefore(i, trialData, trialJson) {
	var instruction_text = `
		<h2 class="section-label"> Part ${i + 1}: ${trialData['trial_name']}</h2>
		<div class="section">
			<p>
				${trialData['instructions']}
			</p>
		</div>
		<h2 class="section-label"> Prompt </h2>
		<p class="emphasize">
			${trialJson['question']}
		</p>
		<br>
		<p class='recording'>
			Clicking <strong>Begin</strong> will start the recording immediately. Please begin whenever you're ready.
		</p>
	`;
	
	var trial_text = `
		<h2 class="section-label"> Part ${i + 1}: ${trialData['trial_name']}</h2>
		<div class="section">
			<p>
				${trialData['instructions']}
			</p>
		</div>
		<h2 class="section-label"> Prompt </h2>
		<p class="emphasize">
			${trialJson['question']}
		</p>
		<br>
		<div class='recording'>
			<h2 class='recording-title'>Recoring in Progress</h2>
			<p>Required duration remaining: <strong><span id="clock"></span></strong></p>
		</div>
	`;
	
	return {
		"instruction_text": instruction_text,
		"trial_text": trial_text
	};
}

async function mcAfter(i, trialData, trialJson) {
	var instruction_text = `
		<h2 class="section-label"> Part ${i + 1}: ${trialData['trial_name']}</h2>
		<div class="section">
			<p>
				${trialData['instructions']}
			</p>
		</div>

		<p class='recording'>
			Clicking <strong>Begin</strong> will start the recording immediately. Please begin whenever you're ready.
		</p>
	`;
	
	var trial_text = `
		<h2 class="section-label"> Part ${i + 1}: ${trialData['trial_name']}</h2>
		<div class="section">
			<p>
				${trialData['instructions']}
			</p>
		</div>
		<h2 class="section-label"> Prompt </h2>
		<p class="emphasize">
			${trialJson['question']}
		</p>
		<br>
		<div class='recording'>
			<h2 class='recording-title'>Recoring in Progress</h2>
			<p>Required duration remaining: <strong><span id="clock"></span></strong></p>
		</div>
	`;
	
	return {
		"instruction_text": instruction_text,
		"trial_text": trial_text
	}
}

async function createTimeline(allJson) {
	var timeline = [];

	var init_mic = {
		type: jsPsychInitializeMicrophone,
	};

	var mic_test = {
		type: jsPsychHtmlButtonResponse,
		stimulus: `
            <h2 class="section-label">Microphone Testing Instructions</h2>

            <div class="section">
                <p>
                    Before beginning the first trial, we ask all participants to complete a brief microphone self-test. A ten-second snippet of audio will be recorded and you will have the ability to play it back once time is up.
                    <br><br>
                    If the audio quality is satisfactory, feel free to begin the trials. If not, we recommend switching devices or attaching an external microphone. This is a self-diagnosed test; <strong>these ten seconds of audio will not be saved.</strong> The trials will operate identically to this test run, so take this opportunity to familiarize yourself with the environment!
                </p>
            </div>
            <p class='recording'>
                Clicking <strong>Begin</strong> will start the recording immediately. Please begin whenever you're ready.
            </p>
        `,
		choices: ['Begin'],
	};

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
                <h2 class='recording-title'>Recoring in Progress</h2>
                <p>Required duration remaining: <strong><span id="clock"></span></strong></p>
            </div>
            `,
		recording_duration: MAX_LEN_TEST * 1000,
		allow_playback: true,
		done_button_label: 'Finish',
		on_load: function () {
			startTimer(MIN_LEN_TEST);

			document.addEventListener('click', function (e) {
				if (e.target.id == 'record-again') {
					startTimer(MIN_LEN_TEST);
				}
			});
		},
	};

	timeline.push(init_mic);
	timeline.push(mic_test);
	timeline.push(mic_test_trial);

	for (let i = 0; i < allJson.length; i++) {
		let randEntry = Math.floor(Math.random() * allJson[i]['questions'].length);
		const trialJson = allJson[i]['questions'][randEntry];
		const trialData = allJson[i];

		if (allJson[i].hasOwnProperty("mc_options")) {
			var text = {}
			if (allJson[i].hasOwnProperty("display")) {
				if (allJson[i]["display"] == "before") {
					text = await mcBefore(i, trialData, trialJson);
				} else if (allJson[i]["display"] == "after") {
					text = await mcAfter(i, trialData, trialJson);
				}
				else {
					text = await mcBefore(i, trialData, trialJson);	
				}
			} else {
				text = await mcBefore(i, trialData, trialJson);	
			}

			var instruction = {
				type: jsPsychHtmlButtonResponse,
				stimulus: text["instruction_text"],
				choices: ['Begin'],
			};

			var trial = {
				type: jsPsychHtmlAudioResponse,
				stimulus: text["trial_text"],
				recording_duration: trialData['max_time'] * 1000,
				allow_playback: true,
				done_button_label: 'Finish',
				on_load: function () {
					var minTime = trialData['min_time'];
					startTimer(minTime);

					document.addEventListener('click', function (e) {
						if (e.target.id == 'record-again') {
							startTimer(minTime);
						}
					});
				},
				on_finish: function (data) {
					if (timerInterval) {
						clearInterval(timerInterval);
					}
					trialAudio = data.response;
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
					fetch('/save_audio/', {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							'X-CSRFToken': getCookie('csrftoken'),
						},
						body: JSON.stringify({
							audio_base64: trialAudio,
							label: data.response.label,
							trial_name: trialData['trial_name'],
							trial_id: trialJson['id'],
						}),
					});
					trialAudio = null;
				},
			};

			timeline.push(instruction);
			timeline.push(trial);
			timeline.push(choice);
		} else {
			var text = {};
			if (allJson[i].hasOwnProperty('display')) {
				if (allJson[i]['display'] == 'before') {
					text = await baseBefore(i, trialData, trialJson);
				} else if (allJson[i]['display'] == 'after') {
					text = await baseAfter(i, trialData, trialJson);
				} else {
					text = await baseBefore(i, trialData, trialJson);
				}
			} else {
				text = await baseBefore(i, trialData, trialJson);
			}

			var instruction = {
				type: jsPsychHtmlButtonResponse,
				stimulus: text["instruction_text"],
				choices: ['Begin'],
			};

			var trial = {
				type: jsPsychHtmlAudioResponse,
				stimulus: text["trial_text"],
				recording_duration: trialData['max_time'] * 1000,
				allow_playback: true,
				done_button_label: 'Finish',
				on_load: function () {
					var minTime = trialData['min_time'];
					startTimer(minTime);

					document.addEventListener('click', function (e) {
						if (e.target.id == 'record-again') {
							startTimer(minTime);
						}
					});
				},
				on_finish: function (data) {
					if (timerInterval) {
						clearInterval(timerInterval);
					}

					fetch('/save_audio/', {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							'X-CSRFToken': getCookie('csrftoken'),
						},
						body: JSON.stringify({
							audio_base64: data.response,
							trial_name: trialData['trial_name'],
							trial_id: trialJson['id'],
						}),
					})
						.then((response) => {
							console.log('Response status:', response.status); // Debug log
							return response.json();
						})
						.then((data) => {
							console.log('Success:', data);
						})
						.catch((error) => {
							console.error('Error:', error);
						});
				},
			};	

			timeline.push(instruction);
			timeline.push(trial);
		}
	}

	var endscreen = {
		type: jsPsychInstructions,
		pages: [
			ENDING_TEXT,
		],
		show_clickable_nav: false,
	};

	timeline.push(endscreen);

	return timeline;
}
