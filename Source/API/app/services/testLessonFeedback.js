const FeedbackService = require(
    "./feedback/feedbackService"
);

const feedbackService =
    new FeedbackService();


const readings = [];

for (let second = 0; second <= 600; second += 10) {
    let attention = 80;

    if (second >= 120 && second < 240) {
        attention =
            80 - ((second - 120) / 120) * 30;
    }

    if (second >= 240 && second < 360) {
        attention =
            50 + ((second - 240) / 120) * 25;
    }

    if (second >= 360) {
        attention = 76;
    }

    readings.push({
        segundoVideo: second,
        indiceAtencao: attention
    });
}


const result =
    feedbackService.generateLessonFeedback(
        readings
    );

console.dir(
    result,
    {
        depth: null
    }
);