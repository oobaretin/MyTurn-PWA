export type AlarmSoundHandle = {
  /** Stop looping — call only when the kid dismisses the alarm. */
  stop: () => void;
  /** Unblock audio after browser autoplay policy (does not stop the alarm). */
  nudge: () => void;
};

/** Repeating tone + vibration until `stop()` is called. */
export function startAlarmSound(): AlarmSoundHandle {
  let stopped = false;
  let ctx: AudioContext | null = null;
  let intervalId: ReturnType<typeof setInterval> | null = null;
  let activeOsc: OscillatorNode | null = null;

  function beep() {
    if (stopped) return;
    try {
      ctx ??= new AudioContext();
      void ctx.resume();
      try {
        activeOsc?.stop();
      } catch {
        /* already stopped */
      }
      activeOsc = ctx.createOscillator();
      activeOsc.type = "triangle";
      activeOsc.frequency.value = 880;
      activeOsc.connect(ctx.destination);
      activeOsc.start();
      activeOsc.stop(ctx.currentTime + 0.35);
      if ("vibrate" in navigator) {
        navigator.vibrate([300, 120, 300]);
      }
    } catch {
      /* autoplay blocked until nudge */
    }
  }

  beep();
  intervalId = setInterval(beep, 900);

  return {
    stop() {
      stopped = true;
      if (intervalId) clearInterval(intervalId);
      intervalId = null;
      try {
        activeOsc?.stop();
      } catch {
        /* already stopped */
      }
      activeOsc = null;
      void ctx?.close();
      ctx = null;
    },
    nudge() {
      beep();
    },
  };
}
