function getTaskTypeScore(task) {
    const assignment = task.assignment || task;

    if (assignment.is_quiz_assignment) return 0.6;

    const submissions = assignment.submission_types || [];

    if (submissions.includes("online_upload")) return 0.8;
    if (submissions.includes("online_text_entry")) return 0.5;
    if (submissions.includes("external_tool")) return 0.6;
    if (submissions.includes("media_recording")) return 0.5;
    if (submissions.includes("none")) return 0.3;

    return 0.4; // fallback
}

function calculatePriorityScore(task) {
    const assignment = task.assignment || task;
    if (!assignment.due_at && !assignment.deadline) return 0;

    const now = new Date();
    const deadline = new Date(assignment.due_at || assignment.deadline);
    const daysUntilDue = Math.max(1, (deadline - now) / (1000 * 60 * 60 * 24));
    const deadlineScore = Math.exp(-daysUntilDue / 3);

    let weightScore = 0;
    if (assignment.points_possible && assignment.points_possible < 100) {
        weightScore = Math.min(assignment.points_possible / 100, 1);
    } else if (assignment.points_possible) {
        weightScore = 1;
    }

    const typeScore = getTaskTypeScore(task);

    const finalScore = (deadlineScore * 0.5) + (weightScore * 0.3) + (typeScore * 0.2);
    return parseFloat(finalScore.toFixed(3));
}

function estimateStudyTime(task) {
    const assignment = task.assignment || task;
    const weight = assignment.points_possible || 0;

    if (assignment.is_quiz_assignment) {
        type = 'QUIZ';
    } else if (assignment.submission_types?.includes("discussion_topic")) {
        type = 'DISCUSSION';
    } else {
        type = 'ASSIGNMENT';
    }

    let baseTime = 1;
    if (weight <= 10) baseTime = 1;
    else if (weight <= 50) baseTime = 2;
    else baseTime = 3;

    let multiplier = 1;
    if (type === 'DISCUSSION') multiplier = 0.5;
    else if (type === 'QUIZ') multiplier = 0.8;
    else if (type === 'ASSIGNMENT') multiplier = 1;
    else multiplier = 0.9; // fallback for undefined types

    const estimatedTime = baseTime * multiplier;
    return Math.max(0.5, Math.round(estimatedTime * 2) / 2); // round to nearest 0.5, min 0.5
}

module.exports = {
    calculatePriorityScore,
    estimateStudyTime,
};
