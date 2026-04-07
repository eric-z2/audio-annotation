var timerInterval = null;
var aitaAudio = null;

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

function startTimer(length) {
    if (timerInterval) clearInterval(timerInterval);

    var wait_time = length * 1000;
    var start_time = performance.now();

    setTimeout(() => {
        var btn = document.querySelector('#finish-trial');
        if (btn) btn.disabled = true;
    }, 100);
    
    setTimeout(() => {
        var init_minutes = Math.floor(wait_time / 1000 /60);
        var init_seconds = Math.floor((wait_time - init_minutes*1000)/1000);

        var clock = document.querySelector('#clock');
        if (clock) {
            clock.innerHTML = init_minutes + ':' + init_seconds.toString().padStart(2,'0');
        }
    }, 100);
    
    timerInterval = setInterval(function () {
		var time_left = wait_time - (performance.now() - start_time);
		var minutes = Math.floor(time_left / 1000 /60);
		var seconds = Math.floor((time_left - minutes * 1000) / 1000);

		var clock = document.querySelector('#clock');
		if (clock)
			clock.innerHTML =
				minutes + ':' + seconds.toString().padStart(2, '0');

		if (time_left <= 0) {
			if (clock) clock.innerHTML = '0:00';
			var btn = document.querySelector('#finish-trial');
			if (btn) btn.disabled = false;
			clearInterval(timerInterval);
		}
	}, 250);
}