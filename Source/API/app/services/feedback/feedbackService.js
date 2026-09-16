const feedbackConfig = require("./feedbackConfig");

const {
    calculateLessonMetrics
} = require("./metrics/lessonMetrics");

const {
    calculateHistoryMetrics
} = require("./metrics/historyMetrics");

const {
    runLessonRules
} = require("./rules/lessonRules");

const {
    runHistoryRules
} = require("./rules/historyRules");

const {
    runLessonRecommendations
} = require("./recommendations/lessonRecommendations");

const {
    runHistoryRecommendations
} = require("./recommendations/historyRecommendations");


class FeedbackService {

    generateLessonFeedback(readings) {
        const metrics =
            calculateLessonMetrics(readings);

        if (metrics.amountOfReadings === 0) {
            return {
                summary: {
                    title: "Sem dados suficientes",
                    description:
                        "Não há leituras de atenção disponíveis para esta aula."
                },

                items: [],

                recommendations: []
            };
        }

        const feedbackItems =
            runLessonRules(metrics);

        const selectedItems =
            feedbackItems
                .sort(
                    (a, b) =>
                        b.priority - a.priority
                )
                .slice(
                    0,
                    feedbackConfig.output.maxFeedbackItems
                );

        const recommendationItems =
            runLessonRecommendations(
                metrics,
                selectedItems
            );

        const selectedRecommendations =
            recommendationItems
                .sort(
                    (a, b) =>
                        b.priority - a.priority
                )
                .slice(
                    0,
                    feedbackConfig.output.maxRecommendationItems
                );

        return {
            summary: {
                title: "Pontos para tomar nota",

                description:
                    "Identificamos alguns comportamentos relevantes na atenção da turma durante esta aula."
            },

            items: selectedItems,

            recommendations:
                selectedRecommendations
        };
    }


    generateHistoryFeedback(
        currentLesson,
        previousLessons
    ) {
        const metrics =
            calculateHistoryMetrics(
                currentLesson,
                previousLessons
            );

        if (
            metrics.previousLessonCount <
            feedbackConfig.history.minimumLessons
        ) {
            return {
                summary: {
                    title: "Histórico ainda em construção",

                    description:
                        `São necessárias pelo menos ` +
                        `${feedbackConfig.history.minimumLessons} ` +
                        `aulas anteriores processadas para gerar ` +
                        `comparações históricas mais confiáveis.`
                },

                items: [],

                recommendations: []
            };
        }

        const feedbackItems =
            runHistoryRules(metrics);

        const selectedItems =
            feedbackItems
                .sort(
                    (a, b) =>
                        b.priority - a.priority
                )
                .slice(
                    0,
                    feedbackConfig.output.maxFeedbackItems
                );

        const recommendationItems =
            runHistoryRecommendations(
                metrics,
                selectedItems
            );

        const selectedRecommendations =
            recommendationItems
                .sort(
                    (a, b) =>
                        b.priority - a.priority
                )
                .slice(
                    0,
                    feedbackConfig.output.maxRecommendationItems
                );

        return {
            summary: {
                title: "Como a turma vem evoluindo",

                description:
                    "Comparamos esta aula com o histórico recente da turma."
            },

            items: selectedItems,

            recommendations:
                selectedRecommendations
        };
    }

}


module.exports = FeedbackService;
