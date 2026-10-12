const DIFFICULTY_LEVELS = {
  easy: {
    cpuTackleCooldown: 1.5,
    cpuReactionDelay: 0.5,
    humanPossessionProtection: 0.5,
    passAssistance: 1.5,
    tackleRadius: 29, // Increased ~30% from 22
    cpuChasingSpeed: 0.8,
    cpuTackleThresholdMod: 10,
    humanTackleThresholdMod: -30, // Much more forgiving
    cpuDribblingResistanceMod: 0.6, // Reduces CPU resistance
    cpuAccelerationMod: 0.85, // Slower CPU escaping
  },
  normal: {
    cpuTackleCooldown: 0.8,
    cpuReactionDelay: 0.2,
    humanPossessionProtection: 0.2,
    passAssistance: 1.0,
    tackleRadius: 16,
    cpuChasingSpeed: 1.0,
    cpuTackleThresholdMod: 0,
    humanTackleThresholdMod: -10,
    cpuDribblingResistanceMod: 0.85,
    cpuAccelerationMod: 0.95,
  },
  hard: {
    cpuTackleCooldown: 0.5,
    cpuReactionDelay: 0.05,
    humanPossessionProtection: 0.05,
    passAssistance: 0.7,
    tackleRadius: 10,
    cpuChasingSpeed: 1.2,
    cpuTackleThresholdMod: -10,
    humanTackleThresholdMod: 10,
    cpuDribblingResistanceMod: 1.0,
    cpuAccelerationMod: 1.0,
  }
};

let currentDifficulty = 'easy';

export function setDifficulty(level) {
  if (DIFFICULTY_LEVELS[level]) {
    currentDifficulty = level;
  }
}

export function getDifficulty() {
  return DIFFICULTY_LEVELS[currentDifficulty];
}

export function getDifficultyName() {
  return currentDifficulty;
}
