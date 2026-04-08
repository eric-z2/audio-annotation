var timerInterval = null;
var aitaAudio = null;

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

function startTimer(min_len, max_len) {
    if (timerInterval) clearInterval(timerInterval);

    var wait_time = (min_len + 0.5) * 1000;
    var start_time = performance.now();
    var max_reached = false;

    setTimeout(() => {
        var btn = document.querySelector('#finish-trial');
        if (btn) btn.disabled = true;
    }, 100);
    
    setTimeout(() => {
        var init_minutes = Math.floor(wait_time /1000 /60);
        var init_seconds = Math.floor((wait_time % 60000) / 1000);

        var clock = document.querySelector('#clock');
        if (clock) {
            clock.innerHTML = init_minutes + ':' + init_seconds.toString().padStart(2,'0');
        }
    }, 100);
    
    timerInterval = setInterval(function () {
		var time_left = wait_time - (performance.now() - start_time);
		var minutes = Math.floor(time_left / 1000 /60);
        var seconds = Math.floor((time_left % 60000) / 1000);

		var clock = document.querySelector('#clock');
		if (clock) {
			clock.innerHTML = minutes + ':' + seconds.toString().padStart(2, '0');
        }

		if (time_left <= 0) {
			if (clock) clock.innerHTML = '0:00';
			var btn = document.querySelector('#finish-trial');
			if (btn) btn.disabled = false;

            if (!max_reached) {
                max_reached = true;                
                setTimeout(() => {
                    wait_time = (max_len - min_len + 0.5) * 1000;
                    start_time = performance.now();

                    init_minutes = Math.floor(wait_time /1000 /60);
                    init_seconds = Math.floor((wait_time % 60000) / 1000);

                    if (clock) {
                        var req = document.querySelector('#req');
                        req.innerHTML = "Duration remaining";
                        clock.innerHTML = init_minutes + ':' + init_seconds.toString().padStart(2,'0');
                    }
                }, 100);
            } else {
			    clearInterval(timerInterval);
            }
		}
	}, 250);
}