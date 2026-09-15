const FeedbackService = require(
    "./feedback/feedbackService"
);

const feedbackService =
    new FeedbackService();


const currentLesson = {
    id: 6,
    date: "2026-09-15",
    totalAttentionAverage: 82
};


const previousLessons = [
    {
        id: 1,
        date: "2026-08-10",
        totalAttentionAverage: 68
    },
    {
        id: 2,
        date: "2026-08-17",
        totalAttentionAverage: 70
    },
    {
        id: 3,
        date: "2026-08-24",
        totalAttentionAverage: 72
    },
    {
        id: 4,
        date: "2026-08-31",
        totalAttentionAverage: 74
    },
    {
        id: 5,
        date: "2026-09-07",
        totalAttentionAverage: 76
    }
];


const result =
    feedbackService.generateHistoryFeedback(
        currentLesson,
        previousLessons
    );


console.dir(
    result,
    {
        depth: null
    }
);
