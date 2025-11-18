let audioContext: AudioContext | null = null;
let alarmInterval: number | null = null;

export function playAlarmSound() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }

  const beep = (frequency: number, duration: number) => {
    const oscillator = audioContext!.createOscillator();
    const gainNode = audioContext!.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext!.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext!.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext!.currentTime + duration);

    oscillator.start(audioContext!.currentTime);
    oscillator.stop(audioContext!.currentTime + duration);
  };

  let count = 0;
  const playBeeps = () => {
    if (count < 6) {
      beep(800, 0.2);
      setTimeout(() => beep(1000, 0.2), 200);
      count++;
    } else {
      stopAlarmSound();
    }
  };

  playBeeps();
  alarmInterval = window.setInterval(playBeeps, 800);
}

export function stopAlarmSound() {
  if (alarmInterval) {
    clearInterval(alarmInterval);
    alarmInterval = null;
  }
}
