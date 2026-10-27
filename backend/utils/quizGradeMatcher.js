/**
 * quizGradeMatcher.js
 * Central utility to match Grade records with Quiz instances.
 * 
 * Rules:
 * 1. Primary: Match by exact quizId + studentId (modern records).
 * 2. Legacy Fallback (for older records where quizId is null/undefined):
 *    - Grade.quizId must NOT exist / be null.
 *    - Grade.type === 'Online Quiz'.
 *    - Grade.title.trim().toLowerCase() === Quiz.title.trim().toLowerCase().
 *    - Grade.course === Quiz.course.
 *    - Grade.createdAt >= Quiz.createdAt (Grade must have been created AFTER the Quiz was created).
 *    - Disambiguation: If multiple quizzes share the same title & course, the Grade
 *      matches only the latest quiz created before the Grade's createdAt.
 */

export const getEntityId = (entity) => {
    if (!entity) return null;
    if (typeof entity === 'string') return entity;
    if (entity._id) return entity._id.toString();
    if (entity.toString && typeof entity.toString === 'function') {
        const str = entity.toString();
        // Guard against "[object Object]"
        if (str !== '[object Object]') return str;
    }
    return null;
};

/**
 * Finds the matching Grade for a specific Quiz from a list of Grade documents/objects.
 * @param {Object} quiz - Quiz document/object
 * @param {Array} grades - Array of Grade documents/objects
 * @param {Array} [allQuizzes=[]] - Optional list of all quizzes in the course for legacy disambiguation
 * @returns {Object|null} Matching Grade or null
 */
export const findGradeForQuiz = (quiz, grades = [], allQuizzes = []) => {
    if (!quiz || !Array.isArray(grades) || grades.length === 0) {
        return null;
    }

    const validGrades = grades.filter(g => g && typeof g === 'object');
    if (validGrades.length === 0) {
        return null;
    }

    const quizId = getEntityId(quiz);
    const quizCourseId = getEntityId(quiz.course);
    const quizTitleClean = quiz.title ? quiz.title.trim().toLowerCase() : '';
    const quizCreatedAt = quiz.createdAt ? new Date(quiz.createdAt) : null;

    // 1. Primary Check: Direct quizId match
    if (quizId) {
        const exactMatch = validGrades.find(g => {
            const gQuizId = getEntityId(g.quizId);
            return gQuizId && gQuizId === quizId;
        });
        if (exactMatch) {
            return exactMatch;
        }
    }

    // 2. Legacy Fallback: Only for grades that have NO quizId
    const legacyCandidates = validGrades.filter(g => {
        // Must NOT have a quizId
        if (g.quizId) return false;

        // Must be Online Quiz
        if (g.type !== 'Online Quiz') return false;

        // Must match course
        const gCourseId = getEntityId(g.course);
        if (!gCourseId || !quizCourseId || gCourseId !== quizCourseId) return false;

        // Must match title (trimmed, case-insensitive)
        const gTitleClean = g.title ? g.title.trim().toLowerCase() : '';
        if (!gTitleClean || gTitleClean !== quizTitleClean) return false;

        // Must have been created AFTER or AT the same time the quiz was created
        if (!g.createdAt || !quizCreatedAt) return false;
        const gCreatedAt = new Date(g.createdAt);
        if (gCreatedAt < quizCreatedAt) return false;

        return true;
    });

    if (legacyCandidates.length === 0) {
        return null;
    }

    // If allQuizzes is provided, perform disambiguation:
    // The Grade must belong to the latest Quiz that was created before the Grade's createdAt.
    const relevantQuizzes = (Array.isArray(allQuizzes) && allQuizzes.length > 0)
        ? allQuizzes.filter(q => {
            const qCourseId = getEntityId(q.course);
            const qTitleClean = q.title ? q.title.trim().toLowerCase() : '';
            return qCourseId === quizCourseId && qTitleClean === quizTitleClean && q.createdAt;
        })
        : [quiz];

    for (const candidateGrade of legacyCandidates) {
        const gCreatedAt = new Date(candidateGrade.createdAt);

        // Find all quizzes created before or at this grade
        const precedingQuizzes = relevantQuizzes.filter(q => new Date(q.createdAt) <= gCreatedAt);

        if (precedingQuizzes.length > 0) {
            // Sort to find the latest quiz created before this grade
            precedingQuizzes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            const closestQuiz = precedingQuizzes[0];
            const closestQuizId = getEntityId(closestQuiz);

            if (closestQuizId === quizId) {
                return candidateGrade;
            }
        }
    }

    return null;
};

/**
 * Filters all Grade documents that belong to a specific Quiz.
 * Useful for teacher views and attempt counts.
 * @param {Object} quiz - Quiz document/object
 * @param {Array} grades - Array of Grade documents/objects
 * @param {Array} [allQuizzes=[]] - Optional list of all quizzes in the course for legacy disambiguation
 * @returns {Array} List of matching Grade documents/objects
 */
export const findGradesForQuiz = (quiz, grades = [], allQuizzes = []) => {
    if (!quiz || !Array.isArray(grades) || grades.length === 0) {
        return [];
    }
    const validGrades = grades.filter(g => g && typeof g === 'object');
    if (validGrades.length === 0) {
        return [];
    }
    const quizId = getEntityId(quiz);
    return validGrades.filter(g => {
        const gQuizId = getEntityId(g.quizId);
        if (gQuizId) {
            return gQuizId === quizId;
        }
        // Legacy check
        return findGradeForQuiz(quiz, [g], allQuizzes) !== null;
    });
};

