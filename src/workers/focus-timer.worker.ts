let interval: ReturnType<typeof setInterval> | null = null;
let timeLeft = 0;

self.onmessage = (e: MessageEvent) => {
  const { command, value } = e.data;

  if (command === 'START') {
    timeLeft = value;
    if (interval) clearInterval(interval);
    
    interval = setInterval(() => {
      timeLeft -= 1;
      
      if (timeLeft > 0) {
        self.postMessage({ type: 'TICK', timeLeft });
      } else {
        self.postMessage({ type: 'COMPLETE' });
        if (interval) clearInterval(interval);
      }
    }, 1000);
  } else if (command === 'PAUSE' || command === 'STOP') {
    if (interval) clearInterval(interval);
  } else if (command === 'SYNC') {
    timeLeft = value;
  }
};
