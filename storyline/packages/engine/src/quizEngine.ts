import type { QuizQuestion, QuizResult } from '@courseweaver/domain';

const normalize = (values: string[]) => [...values].sort();

export const gradeQuizQuestion = (
  question: QuizQuestion,
  selectedOptionIds: string[]
): QuizResult => {
  const selected = normalize(selectedOptionIds);
  const expected = normalize(question.correctOptionIds);
  const isCorrect = selected.length === expected.length && selected.every((optionId, index) => optionId === expected[index]);

  return {
    questionId: question.id,
    selectedOptionIds,
    awardedPoints: isCorrect ? question.points : 0,
    maxPoints: question.points,
    isCorrect
  };
};

export const summarizeQuizResults = (results: QuizResult[]) => ({
  awardedPoints: results.reduce((sum, result) => sum + result.awardedPoints, 0),
  maxPoints: results.reduce((sum, result) => sum + result.maxPoints, 0),
  answeredCount: results.length,
  correctCount: results.filter((result) => result.isCorrect).length
});