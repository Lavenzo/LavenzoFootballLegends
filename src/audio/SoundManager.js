class SoundManager {
  constructor() {
    this.audioContextAllowed = false;

    // Default safe fallbacks for SSR/testing
    const _window = typeof window !== 'undefined' ? window : {};
    const _localStorage = typeof localStorage !== 'undefined' ? localStorage : { getItem: () => null, setItem: () => {} };
    const _document = typeof document !== 'undefined' ? document : { addEventListener: () => {}, removeEventListener: () => {} };
    const _Audio = typeof Audio !== 'undefined' ? Audio : class { cloneNode() { return this; } play() { return Promise.resolve(); } pause() {} };

    this.muted = _localStorage.getItem('lfl_muted') === 'true';
    this.masterVolume = parseFloat(_localStorage.getItem('lfl_volume') || '0.6');
    // Using import.meta.env handles local and github pages, but in node tests it may not be defined if not using vite's runner
    this.baseUrl = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL) ? import.meta.env.BASE_URL : '/';

    this.sounds = {
      ambience: new _Audio(`${this.baseUrl}sounds/stadium-ambience.mp3`),
      kick: new _Audio(`${this.baseUrl}sounds/ball-kick.mp3`),
      cheer: new _Audio(`${this.baseUrl}sounds/goal-cheer.mp3`),
      whistle: new _Audio(`${this.baseUrl}sounds/referee-whistle.mp3`),
      tackle: new _Audio(`${this.baseUrl}sounds/tackle.mp3`),
    };

    // Configure ambience
    this.sounds.ambience.loop = true;
    this.sounds.ambience.volume = this.muted ? 0 : this.masterVolume * 0.35; // Target around 25-35%

    // Allow autoplay after any interaction
    const unlockAudio = () => {
      this.audioContextAllowed = true;
      _document.removeEventListener('click', unlockAudio);
      _document.removeEventListener('keydown', unlockAudio);
      if (this.pendingAmbience) {
        this.pendingAmbience = false;
        // The game should be in playing state for this to resume properly
        // playAmbience without restart checks if it's paused.
        this.playAmbience();
      }
    };
    _document.addEventListener('click', unlockAudio);
    _document.addEventListener('keydown', unlockAudio);
  }

  setVolume(volume) {
    const _localStorage = typeof localStorage !== 'undefined' ? localStorage : { getItem: () => null, setItem: () => {} };
    this.masterVolume = Math.max(0, Math.min(1, volume));
    _localStorage.setItem('lfl_volume', String(this.masterVolume));
    this.updateVolumes();
  }

  toggleMute() {
    const _localStorage = typeof localStorage !== 'undefined' ? localStorage : { getItem: () => null, setItem: () => {} };
    this.muted = !this.muted;
    _localStorage.setItem('lfl_muted', String(this.muted));
    this.updateVolumes();
    return this.muted;
  }

  updateVolumes() {
    const vol = this.muted ? 0 : this.masterVolume;
    this.sounds.ambience.volume = vol * 0.35;
    // We update master volume multiplier, handled in playSound
  }

  playSound(name, volMultiplier = 1.0) {
    if (!this.audioContextAllowed || this.muted) return;
    try {
      const original = this.sounds[name];
      if (original) {
        const clone = original.cloneNode(true);
        clone.volume = this.masterVolume * volMultiplier;
        clone.play().catch(e => {
            // Ignore playback failures for sound effects
        });
      }
    } catch (e) {
      // Handle gracefully
    }
  }

  playAmbience(restart = false) {
    if (!this.audioContextAllowed) {
      this.pendingAmbience = true;
      return;
    }

    if (!restart && !this.sounds.ambience.paused) {
      // Already playing continuously, do not restart
      return;
    }

    try {
      if (restart) this.sounds.ambience.currentTime = 0;
      this.updateVolumes();
      this.sounds.ambience.play().catch(e => {
        // Browser might block autoplay temporarily
        this.pendingAmbience = true;
      });
    } catch(e) {}
  }

  pauseAmbience() {
    this.pendingAmbience = false;
    try {
      this.sounds.ambience.pause();
    } catch(e) {}
  }

  resumeAmbience() {
    if (!this.audioContextAllowed) {
      this.pendingAmbience = true;
      return;
    }
    try {
      this.updateVolumes();
      this.sounds.ambience.play().catch(e => {
        this.pendingAmbience = true;
      });
    } catch(e) {}
  }

  stopAmbience() {
    this.pendingAmbience = false;
    try {
      this.sounds.ambience.pause();
      this.sounds.ambience.currentTime = 0;
    } catch(e) {}
  }

  playKick() {
    this.playSound('kick', 0.8);
  }

  playWhistle() {
    this.playSound('whistle', 1.0);
  }

  playTackle() {
    this.playSound('tackle', 0.7);
  }

  playGoalCheer() {
    if (!this.audioContextAllowed || this.muted) return;

    this.playSound('cheer', 1.0);

    // Temporarily reduce ambience
    const vol = this.muted ? 0 : this.masterVolume;
    this.sounds.ambience.volume = vol * 0.1;

    if (this.cheerTimeout) {
      globalThis.clearTimeout(this.cheerTimeout);
    }

    // Restore ambience after 5 seconds (approx cheer length)
    this.cheerTimeout = globalThis.setTimeout(() => {
      if (this.sounds.ambience && !this.sounds.ambience.paused) {
        this.updateVolumes();
      }
      this.cheerTimeout = null;
    }, 5000);
  }
}

export const soundManager = new SoundManager();