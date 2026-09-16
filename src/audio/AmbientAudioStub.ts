/**
 * Stub de audio ambiental.
 * Sustituye la ruta por un loop real en public/assets/audio/ambiente.mp3
 * (licencia libre + atribución en README).
 */
export class AmbientAudioStub {
  private ctx: AudioContext | null = null;
  private started = false;

  async tryStart(): Promise<void> {
    if (this.started) return;
    this.started = true;
    try {
      this.ctx = new AudioContext();
      // Oscilador muy suave como placeholder de “viento / valle”
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 110;
      gain.gain.value = 0.012;
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      // Silenciar tras demostrar el stub (o dejar ultra-bajo)
      setTimeout(() => {
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx!.currentTime + 1.5);
      }, 4000);
    } catch {
      // Autoplay / AudioContext bloqueado: ignorar
    }
  }

  dispose(): void {
    void this.ctx?.close();
    this.ctx = null;
  }
}
