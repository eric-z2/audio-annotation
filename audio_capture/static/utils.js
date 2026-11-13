var timerInterval = null;
var timerTimeouts = [];
var recordAgainHandler = null;

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

function showError(message) {
    var el = document.getElementById('error-message');
    if (el) el.textContent = message;
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    timerTimeouts.forEach(clearTimeout);
    timerTimeouts = [];
}

// Registers exactly one "record again" listener at a time, so listeners from
// earlier trials do not pile up and restart the timer with stale limits.
function bindRecordAgain(min_len, max_len) {
    if (recordAgainHandler) {
        document.removeEventListener('click', recordAgainHandler);
    }
    recordAgainHandler = function (e) {
        if (e.target && e.target.id == 'record-again') {
            startTimer(min_len, max_len);
        }
    };
    document.addEventListener('click', recordAgainHandler);
}

function startTimer(min_len, max_len) {
    stopTimer();

    var wait_time = (min_len + 0.5) * 1000;
    var start_time = performance.now();
    var max_reached = false;

    function formatTime(ms) {
        var total = Math.max(0, ms);
        var minutes = Math.floor(total / 1000 / 60);
        var seconds = Math.floor((total % 60000) / 1000);
        return minutes + ':' + seconds.toString().padStart(2, '0');
    }

    // Disable Finish until the minimum time has passed. Look the button up
    // each time rather than once, because it may not be in the DOM yet.
    function setFinishDisabled(disabled) {
        var btn = document.querySelector('#finish-trial');
        if (btn) btn.disabled = disabled;
    }
    setFinishDisabled(true);
    timerTimeouts.push(setTimeout(function () {
        if (!max_reached) setFinishDisabled(true);
    }, 100));

    var clock = document.querySelector('#clock');
    if (clock) clock.textContent = formatTime(wait_time);

    timerInterval = setInterval(function () {
        var time_left = wait_time - (performance.now() - start_time);

        var clock = document.querySelector('#clock');
        if (clock) clock.textContent = formatTime(time_left);

        if (time_left > 0) return;

        if (clock) clock.textContent = '0:00';
        setFinishDisabled(false);

        if (!max_reached) {
            max_reached = true;
            timerTimeouts.push(setTimeout(function () {
                wait_time = (max_len - min_len + 0.5) * 1000;
                start_time = performance.now();

                var req = document.querySelector('#req');
                if (req) req.textContent = 'Duration remaining';
                var clock = document.querySelector('#clock');
                if (clock) clock.textContent = formatTime(wait_time);
            }, 100));
        } else {
            clearInterval(timerInterval);
            timerInterval = null;
        }
    }, 250);
}

// Uploads a recording, retrying once, and tells the participant on failure.
async function uploadAudio(payload) {
    for (var attempt = 0; attempt < 2; attempt++) {
        try {
            var response = await fetch('save_audio/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken'),
                },
                body: JSON.stringify(payload),
            });
            var result = await response.json().catch(function () { return {}; });
            if (response.ok && result.status === 'success') {
                return true;
            }
            console.error('Upload failed:', response.status, result.message);
        } catch (error) {
            console.error('Upload error:', error);
        }
    }
    showError('Your last recording could not be saved. Please check your connection; if the problem continues, contact the researchers.');
    return false;
}
