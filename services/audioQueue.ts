import { playBuffer } from './audioUtils';

type AudioTask = {
  buffer: AudioBuffer;
  id: string;
};

class AudioQueueService {
  private queue: AudioTask[] = [];
  private isPlaying: boolean = false;
  private audioContext: AudioContext | null = null;

  setAudioContext(ctx: AudioContext) {
    this.audioContext = ctx;
  }

  enqueue(buffer: AudioBuffer) {
    const id = Date.now().toString() + Math.random();
    this.queue.push({ buffer, id });
    this.processQueue();
  }

  private processQueue() {
    if (this.isPlaying || this.queue.length === 0 || !this.audioContext) {
      return;
    }

    const task = this.queue.shift();
    if (!task) return;

    this.isPlaying = true;

    playBuffer(this.audioContext, task.buffer, () => {
      this.isPlaying = false;
      // Slight delay between sentences for natural pacing
      setTimeout(() => this.processQueue(), 200);
    });
  }

  clear() {
    this.queue = [];
    this.isPlaying = false;
  }
}

export const audioQueue = new AudioQueueService();