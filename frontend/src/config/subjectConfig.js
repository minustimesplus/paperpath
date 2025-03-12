export const availableSubjects = [
  // Group 1: Studies in Language and Literature
  { id: 'english_a_literature_sl', name: 'English A Literature SL', group: 1 },
  { id: 'english_a_literature_hl', name: 'English A Literature HL', group: 1 },
  { id: 'english_a_language_literature_sl', name: 'English A Language & Literature SL', group: 1 },
  { id: 'english_a_language_literature_hl', name: 'English A Language & Literature HL', group: 1 },
  { id: 'german_a_sl', name: 'German A Literature SL', group: 1 },
  { id: 'german_a_hl', name: 'German A Literature HL', group: 1 },

  // Group 2: Language Acquisition
  { id: 'english_b_sl', name: 'English B SL', group: 2 },
  { id: 'english_b_hl', name: 'English B HL', group: 2 },
  { id: 'french_b_sl', name: 'French B SL', group: 2 },
  { id: 'french_b_hl', name: 'French B HL', group: 2 },
  { id: 'spanish_b_sl', name: 'Spanish B SL', group: 2 },
  { id: 'spanish_b_hl', name: 'Spanish B HL', group: 2 },
  { id: 'german_b_sl', name: 'German B SL', group: 2 },
  { id: 'german_b_hl', name: 'German B HL', group: 2 },

  // Group 3: Individuals and Societies
  { id: 'history_sl', name: 'History SL', group: 3 },
  { id: 'history_hl', name: 'History HL', group: 3 },
  { id: 'geography_sl', name: 'Geography SL', group: 3 },
  { id: 'geography_hl', name: 'Geography HL', group: 3 },
  { id: 'economics_sl', name: 'Economics SL', group: 3 },
  { id: 'economics_hl', name: 'Economics HL', group: 3 },
  { id: 'psychology_sl', name: 'Psychology SL', group: 3 },
  { id: 'psychology_hl', name: 'Psychology HL', group: 3 },
  { id: 'business_sl', name: 'Business Management SL', group: 3 },
  { id: 'business_hl', name: 'Business Management HL', group: 3 },
  { id: 'philosophy_sl', name: 'Philosophy SL', group: 3 },
  { id: 'philosophy_hl', name: 'Philosophy HL', group: 3 },

  // Group 4: Sciences
  { id: 'biology_sl', name: 'Biology SL', group: 4 },
  { id: 'biology_hl', name: 'Biology HL', group: 4 },
  { id: 'chemistry_sl', name: 'Chemistry SL', group: 4 },
  { id: 'chemistry_hl', name: 'Chemistry HL', group: 4 },
  { id: 'physics_sl', name: 'Physics SL', group: 4 },
  { id: 'physics_hl', name: 'Physics HL', group: 4 },
  { id: 'computer_science_sl', name: 'Computer Science SL', group: 4 },
  { id: 'computer_science_hl', name: 'Computer Science HL', group: 4 },
  { id: 'ess_sl', name: 'Environmental Systems & Societies SL', group: 4 },

  // Group 5: Mathematics
  { id: 'math_aa_sl', name: 'Mathematics: Analysis & Approaches SL', group: 5 },
  { id: 'math_aa_hl', name: 'Mathematics: Analysis & Approaches HL', group: 5 },
  { id: 'math_ai_sl', name: 'Mathematics: Applications & Interpretation SL', group: 5 },
  { id: 'math_ai_hl', name: 'Mathematics: Applications & Interpretation HL', group: 5 },

  // Group 6: The Arts
  { id: 'visual_arts_sl', name: 'Visual Arts SL', group: 6 },
  { id: 'visual_arts_hl', name: 'Visual Arts HL', group: 6 },
  { id: 'music_sl', name: 'Music SL', group: 6 },
  { id: 'music_hl', name: 'Music HL', group: 6 },
  { id: 'theatre_sl', name: 'Theatre SL', group: 6 },
  { id: 'theatre_hl', name: 'Theatre HL', group: 6 }
];

export const getSubjectName = (subjectId) => {
  const subject = availableSubjects.find(s => s.id === subjectId);
  return subject ? subject.name : subjectId;
};

export const groupedSubjects = {
  'Group 1 - Studies in Language and Literature': availableSubjects.filter(s => s.group === 1),
  'Group 2 - Language Acquisition': availableSubjects.filter(s => s.group === 2),
  'Group 3 - Individuals and Societies': availableSubjects.filter(s => s.group === 3),
  'Group 4 - Sciences': availableSubjects.filter(s => s.group === 4),
  'Group 5 - Mathematics': availableSubjects.filter(s => s.group === 5),
  'Group 6 - The Arts': availableSubjects.filter(s => s.group === 6)
};