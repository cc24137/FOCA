function findFeedback(feedbackItems, id) {
    return feedbackItems.find(
        feedback => feedback.id === id
    );
}


function aboveAverageRecommendation(
    metrics,
    feedbackItems
) {
    const feedback = findFeedback(
        feedbackItems,
        "above-recent-average"
    );

    if (!feedback) {
        return null;
    }

    return {
        id: "investigate-above-average-lesson",

        relatedFeedbackIds: [
            "above-recent-average"
        ],

        type: "reinforcement",

        priority: 8,

        title: "Observe o que funcionou nesta aula",

        message:
            "O resultado desta aula ficou acima do histórico recente. " +
            "Vale identificar quais estratégias, atividades ou características " +
            "diferiram das aulas anteriores.",

        actions: [
            "Comparar a estrutura desta aula com as anteriores",
            "Identificar atividades ou recursos diferentes",
            "Observar estratégias que podem ser reaproveitadas"
        ]
    };
}


function belowAverageRecommendation(
    metrics,
    feedbackItems
) {
    const feedback = findFeedback(
        feedbackItems,
        "below-recent-average"
    );

    if (!feedback) {
        return null;
    }

    return {
        id: "review-below-average-lesson",

        relatedFeedbackIds: [
            "below-recent-average"
        ],

        type: "investigation",

        priority: 9,

        title: "Compare esta aula com as anteriores",

        message:
            "A atenção média ficou abaixo do histórico recente. " +
            "Comparar esta aula com aquelas que apresentaram melhores " +
            "resultados pode ajudar a identificar diferenças relevantes.",

        actions: [
            "Comparar a estrutura desta aula com aulas anteriores",
            "Observar diferenças de duração e dinâmica",
            "Identificar momentos que concentraram as maiores quedas"
        ]
    };
}


function upwardTrendRecommendation(
    metrics,
    feedbackItems
) {
    const feedback = findFeedback(
        feedbackItems,
        "historical-upward-trend"
    );

    if (!feedback) {
        return null;
    }

    return {
        id: "maintain-positive-trend",

        relatedFeedbackIds: [
            "historical-upward-trend"
        ],

        type: "reinforcement",

        priority: 7,

        title: "Acompanhe as estratégias recentes",

        message:
            "A turma vem apresentando uma evolução positiva. " +
            "Pode ser útil observar quais práticas vêm sendo mantidas " +
            "nas aulas recentes.",

        actions: [
            "Identificar estratégias recorrentes nas últimas aulas",
            "Manter abordagens que vêm apresentando bons resultados",
            "Continuar acompanhando a evolução nas próximas aulas"
        ]
    };
}


function downwardTrendRecommendation(
    metrics,
    feedbackItems
) {
    const feedback = findFeedback(
        feedbackItems,
        "historical-downward-trend"
    );

    if (!feedback) {
        return null;
    }

    return {
        id: "investigate-downward-trend",

        relatedFeedbackIds: [
            "historical-downward-trend"
        ],

        type: "investigation",

        priority: 9,

        title: "Procure padrões entre as aulas recentes",

        message:
            "Como a atenção vem apresentando uma tendência de queda, " +
            "vale comparar as aulas recentes para verificar se algum padrão " +
            "se repete.",

        actions: [
            "Comparar os períodos de menor atenção entre as aulas",
            "Observar mudanças na duração ou estrutura das aulas",
            "Verificar se as quedas acontecem em momentos semelhantes",
            "Acompanhar se a tendência continua nas próximas aulas"
        ]
    };
}


function historicalStabilityRecommendation(
    metrics,
    feedbackItems
) {
    const feedback = findFeedback(
        feedbackItems,
        "historical-stability"
    );

    if (!feedback) {
        return null;
    }

    return {
        id: "monitor-historical-stability",

        relatedFeedbackIds: [
            "historical-stability"
        ],

        type: "monitoring",

        priority: 5,

        title: "Continue acompanhando esse padrão",

        message:
            "Os resultados recentes estão relativamente estáveis. " +
            "Esse histórico pode servir como referência para avaliar " +
            "mudanças futuras.",

        actions: [
            "Usar esse período como referência para próximas aulas",
            "Observar mudanças quando novas estratégias forem aplicadas",
            "Continuar registrando as próximas aulas para ampliar o histórico"
        ]
    };
}


function runHistoryRecommendations(
    metrics,
    feedbackItems
) {
    return [
        belowAverageRecommendation(
            metrics,
            feedbackItems
        ),

        downwardTrendRecommendation(
            metrics,
            feedbackItems
        ),

        aboveAverageRecommendation(
            metrics,
            feedbackItems
        ),

        upwardTrendRecommendation(
            metrics,
            feedbackItems
        ),

        historicalStabilityRecommendation(
            metrics,
            feedbackItems
        )
    ].filter(Boolean);
}


module.exports = {
    runHistoryRecommendations,

    aboveAverageRecommendation,
    belowAverageRecommendation,
    upwardTrendRecommendation,
    downwardTrendRecommendation,
    historicalStabilityRecommendation
};
