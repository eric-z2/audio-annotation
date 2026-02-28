// Min and max lengths in minutes
MIN_LEN_TEST = 1/12
MAX_LEN_TEST = 1/6
MIN_LEN_ESSAY = 4
MAX_LEN_ESSAY = 6
MIN_LEN_AITA = 2
MAX_LEN_AITA = 4

async function loadEssayJson() {
    var response = await fetch('/static/json/essay_questions.json');
    var json = await response.json();
    var randEntry = Math.floor(Math.random() * json.length);

    return json[randEntry];
}

async function loadAitaJson() {
    var response = await fetch('/static/json/aita_questions.json');
    var json = await response.json();
    var randEntry = Math.floor(Math.random() * json.length);

    return json[randEntry];
}

async function createTimeline(essayJson, aitaJson) {
    var timeline = [];

    var init_mic = {
        type: jsPsychInitializeMicrophone,
    };

    var mic_test = {
        type: jsPsychHtmlButtonResponse,
        stimulus: `
            <h3>Microphone Testing Instructions</h3>
            <p class="trial-text">Before beginning the first trial, we ask all participants to complete a brief microphone self test. A ten second snippet of audio will be recorded and you will have the ability to play it back once time is up. If the audio quality is satisfactory, feel free to begin the trials. If not, we recommend switching devices or attaching an external microphone to improve sound quality. This is an self-diagnosed test; these ten seconds of audio will not be saved.</p>
            <p class="trial-text">The trials will operate similar to how this test runs. Take this opportunity to familiarize yourself with the environment!</p>
            <p class="trial-text">Clicking 'Begin.' will start the recording immediately. Please begin whenever you're ready. </p>
        `,
        choices: ['Begin.']  
    }

    var mic_test_trial = {
        type: jsPsychHtmlAudioResponse,
        stimulus: `
            <h3>Microphone Testing Instructions</h3>
            <p class="trial-text">Before beginning the first trial, we ask all participants to complete a brief microphone self test. A five second snippet of audio will be recorded and you will have the ability to play it back once time is up. If the audio quality is satisfactory, feel free to begin the trials. If not, we recommend switching devices, attaching an external microphone, or moving to a quieter environment. This is an self-diagnosed test so this audio snippet will not be saved.</p>
            <h3 class='recording'>Recording in Progress</h3>
            <p class='recording'>Required duration remaining: <span id="clock"></span></p>
            `,
        recording_duration: MAX_LEN_TEST * 60 * 1000,
        allow_playback: true,
        done_button_label: 'Finish.',
        on_load: function() {
            startTimer(MIN_LEN_TEST);
            
            document.addEventListener('click', function(e) {
                if (e.target.id == 'record-again') {
                    startTimer(MIN_LEN_TEST);
                }
            });
        },
    }

    // TODO
    var instruction_essay = {
        type: jsPsychHtmlButtonResponse,
        stimulus: `
            <h2> Part 1: Essay Question</h2>
            <p class="trial-text">The first trial involves a six minute response to an essay question. You will be asked to talk and reflect about your life. Please note that you will be unable to end the recording until the six minutes are up. After that, you will have an additional minute to wrap up your thoughts. We encourage you to try to speak for the entire duration, but feel free to take a pause to gather your thoughts. Brief periods with no sound are okay. </p>
            <h3> Prompt </h3>
            <p class="trial-text">${essayJson["text"]}</p>
            <p class="trial-text">Clicking 'Begin.' will start the recording immediately. Please begin whenever you're ready. </p>
        `,
        choices: ['Begin.']
    }

    var trial_essay = {
        type: jsPsychHtmlAudioResponse,
        stimulus: `
            <h2> Part 1: Essay Question</h2>
            <h3> Prompt </h3>
            <p class="trial-text">${essayJson["text"]}</p>
            <h3 class='recording'>Recoring in Progress</h3>
            <p class='recording'>Required duration remaining: <span id = "clock"></span></p>
            `,
        // recording_duration: 6 * 60 * 1000,
        recording_duration: MAX_LEN_ESSAY * 60 * 1000, // DEMO
        allow_playback: true,
        done_button_label: 'Finish.',
        on_load: function() {
            // startTimer(6);
            startTimer(MIN_LEN_ESSAY); // DEMO
            
            document.addEventListener('click', function(e) {
                if (e.target.id == 'record-again') {
                    // startTimer(6);
                    startTimer(MIN_LEN_ESSAY); // DEMO
                }
            });
        },
           on_finish: function(data) {
               if (essayTimerInterval) {
                   clearInterval(essayTimerInterval);
               }
            
               fetch('/save_audio_essay/', {
                   method: 'POST',
                   headers: {
                       'Content-Type': 'application/json',
                       'X-CSRFToken': getCookie('csrftoken')
                   },
                   body: JSON.stringify({
                       audio_base64: data.response,
                       essay_id: essayJson["id"]
                   })
               })
                .then(response => {
                    console.log('Response status:', response.status);  // Debug log
                    return response.json();
                })
                .then(data => {
                    console.log('Success:', data);
                })
                .catch(error => {
                    console.error('Error:', error);
                });
           }
    };

    var instruction_aita = {
        type: jsPsychHtmlButtonResponse,
        stimulus: `
            <h2> Part 2: AITA Annotation </h2>
            <h3> Instructions </h3>
            <p class="trial-text">Your task is to read and analyze a post from the Reddit forum r/AmITheAsshole. In this forum, each author describes a situation or interpersonal conflict that they were involved in and ask if they did something wrong or not, ie. AITA; "am I the asshole"? For each situation, answer the question "Is the author the asshole in this situation?". Here are the possible answers you may provide:</p>
            <ul class="trial-text">
                <li>NTA (Not the Asshole): The author did nothing wrong.</li>
                <li>YTA (You're the Asshole): The author did something wrong.</li>
                <li>ESH (Everyone sucks here): Everyone did something wrong.</li>
                <li>NAH (No Assholes): No one did anything wrong.</li>
            </ul>
            <p class="trial-text">Please limit your response to only one of these options.</p>
            <p class="trial-text">The post will be displayed after clicking "Begin." and you will have three minutes to speak and read. As you are reading the post, please speak your thoughts, reasoning, and your conclusion out loud. You will have an additional minute after the three minutes to wrap up your thoughts. </p> 

            <p class="trial-text">Clicking 'Begin.' will display the post and start the recording immediately. Please begin whenever you're ready. </p>
        `,
        choices: ['Begin.']
    }

    var trial_aita= {
        type: jsPsychHtmlAudioResponse,
        stimulus: `
            <h2> Part 2: AITA Annotation </h2>
            <h3> Prompt </h3>
            <p class="trial-text"><b>Overview of Situation:</b> ${aitaJson["situation"]}</p>
            <p class="trial-text">${aitaJson["post"]}</p>
            <p class="trial-text">Possible answers:</p>
            <ul class="trial-text">
                <li>NTA (Not the Asshole): The author did nothing wrong.</li>
                <li>YTA (You're the Asshole): The author did something wrong.</li>
                <li>ESH (Everyone sucks here): Everyone did something wrong.</li>
                <li>NAH (No Assholes): No one did anything wrong.</li>
            </ul>
            <h3 class='recording'> Recording in Progress </h3>
            <p class='recording'>Required duration remaining: <span id = "clock"></span></p>
            `,
        recording_duration: MAX_LEN_AITA * 60 * 1000,
        allow_playback: true,
        done_button_label: 'Finish.',
        on_load: function() {
            startTimer(MIN_LEN_AITA);
            
            document.addEventListener('click', function(e) {
                if (e.target.id == 'record-again') {
                    startTimer(MIN_LEN_AITA);
                }
            });
        },
        on_finish: function(data) {
            if (essayTimerInterval) {
                clearInterval(essayTimerInterval);
            }
            aitaAudio = data.response
        }
    };

    var aita_choice = {
        type: jsPsychSurveyMultiChoice,
        questions: [
            {
                prompt: 'What was your final judgement?', 
                name: 'aita_label', 
                options: ['NTA (Not the asshole)', 'YTA (You\'re the asshole)', 'ESH (Everyone sucks here)', 'NAH (No one\'s the asshole)'], 
                required: true
            }
        ], 
        on_finish: function(data) {
            fetch('/save_audio_aita/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                body: JSON.stringify({
                    audio_base64: aitaAudio,
                    label: data.response.aita_label,
                    aita_id: aitaJson['id']
                })
            })

            aitaAudio = null
        }
    }

    var endscreen = {
        type: jsPsychInstructions,
        pages: [
        'You have reached the end of the task, thank you for participating!'
        ],
        show_clickable_nav: false
    }

    timeline.push(init_mic);
    timeline.push(mic_test);
    timeline.push(mic_test_trial);
    timeline.push(instruction_essay);
    timeline.push(trial_essay);
    timeline.push(instruction_aita);
    timeline.push(trial_aita);
    timeline.push(aita_choice);
    timeline.push(endscreen);

    return timeline;
}