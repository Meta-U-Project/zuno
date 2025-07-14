function getTaskTypeScore(task) {
    // Discussions take lowest priority by type
    if (task.task_type === 'DISCUSSION') return 0.4;

    // Canvas quizzes
    if (task.is_quiz_assignment) return 0.6;

    const submissions = task.submission_types || [];

    // Infer based on submission type
    if (submissions.includes("online_upload")) return 0.8; // Likely a major task
    if (submissions.includes("online_text_entry")) return 0.5; // Short reflection or essay
    if (submissions.includes("external_tool")) return 0.6; // Could be a quiz or exam via LTI
    if (submissions.includes("media_recording")) return 0.5;
    if (submissions.includes("none")) return 0.3;

    // Fallback default
    return 0.4;
}

function calculatePriorityScore(task) {
    const now = new Date();
    const deadline = new Date(task.deadline);

    const daysUntilDue = Math.max(1, (deadline - now) / (1000 * 60 * 60 * 24));
    const deadlineScore = 1 / daysUntilDue;

    let weightScore = 0;
    if (task.assignment_weight && task.assignment_weight > 0) {
        weightScore = task.assignment_weight;
    } else if (task.points_possible) {
        weightScore = Math.min(task.points_possible / 100, 1);
    }
    const typeScore = getTaskTypeScore(task);

    const finalScore = (deadlineScore * 0.5) + (weightScore * 0.3) + (typeScore * 0.2);
    return parseFloat(finalScore.toFixed(3));
}

function estimateStudyTime(task) {
    const weight = task.points_possible || 0;
    const type = task.task_type;

    if (type === 'DISCUSSION') return 1;
    if (task.is_quiz_assignment) return 1.5;

    if (weight <= 10) return 1;
    if (weight <= 50) return 2;
    return 3;
}
module.exports = {
    calculatePriorityScore,
    estimateStudyTime,
};
