export const TIMEZONE_CONFIG = {
  "english_a_literature_sl": {
    "paper1": true,
    "paper2": false
  },
  "english_a_literature_hl": {
    "paper1": true,
    "paper2": false,
    "essay": false
  },
  // ...existing timezone config...
};

// Helper functions for timezone variants
export const hasTZVariants = (subjectId, paper, tzConfig) => {
  if (!tzConfig || !tzConfig[subjectId]) return false;
  
  const paperKey = paper.toLowerCase().replace(' ', '');
  if (!tzConfig[subjectId][paperKey]) {
    return false;
  }
  return tzConfig[subjectId][paperKey];
};

export const subjectHasTZVariants = (subjectId, tzConfig) => {
  if (!tzConfig || !tzConfig[subjectId]) {
    return false;
  }
  
  return Object.values(tzConfig[subjectId]).some(hasTZ => hasTZ === true);
};