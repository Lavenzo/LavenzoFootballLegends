const DIFFICULTY_LEVELS = {
  easy: {
    cpuTackleCooldown: 2.0,
    cpuReactionDelay: 0.6,
    humanPossessionProtection: 0.9,
    passAssistance: 1.5,
    tackleRadius: 29,
    cpuChasingSpeed: 0.8,
    cpuTackleThresholdMod: 35,
    humanTackleThresholdMod: -40,
    cpuDribblingResistanceMod: 0.6,
    cpuAccelerationMod: 0.8,
    cpuSpeedMod: 0.85,
    humanAccelerationMod: 1.6,
    humanSpeedMod: 1.25,
    humanTackleCooldown: 0.1,
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
    cpuSpeedMod: 1.0,
    humanAccelerationMod: 1.35,
    humanSpeedMod: 1.0,
    humanTackleCooldown: 0.3,
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
    cpuSpeedMod: 1.0,
    humanAccelerationMod: 1.35,
    humanSpeedMod: 1.0,
    humanTackleCooldown: 0.3,
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
