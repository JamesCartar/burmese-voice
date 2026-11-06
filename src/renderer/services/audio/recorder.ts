export class MicrophoneRecorder {
  private stream?: MediaStream;
  private recorder?: MediaRecorder;
  private timer?: ReturnType<typeof setTimeout>;
  private cancelled = false;

  async open() {
    this.cancelled = false;
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
      },
      video: false,
    });
    if (this.cancelled) {
      stream.getTracks().forEach((track) => track.stop());
      throw new Error('Recording cancelled.');
    }
    this.stream = stream;
  }

  record(milliseconds: number): Promise<ArrayBuffer> {
    if (!this.stream)
      return Promise.reject(new Error('Microphone is not open.'));
    const mimeType = 'audio/webm;codecs=opus';
    if (!MediaRecorder.isTypeSupported(mimeType))
      return Promise.reject(
        new Error('This runtime cannot record WebM audio.'),
      );
    return new Promise((resolve, reject) => {
      const recorder = new MediaRecorder(this.stream!, {
        mimeType,
        audioBitsPerSecond: 64000,
      });
      this.recorder = recorder;
      const chunks: Blob[] = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunks.push(event.data);
      };
      recorder.onerror = () => {
        clearTimeout(this.timer);
        reject(new Error('Microphone recording failed.'));
      };
      recorder.onstop = () => {
        clearTimeout(this.timer);
        void new Blob(chunks, { type: mimeType })
          .arrayBuffer()
          .then(resolve, reject);
      };
      recorder.start();
      this.timer = setTimeout(() => this.stopSegment(), milliseconds);
    });
  }

  stopSegment() {
    clearTimeout(this.timer);
    if (this.recorder?.state === 'recording') this.recorder.stop();
  }

  close() {
    this.cancelled = true;
    this.stopSegment();
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = undefined;
  }
}
