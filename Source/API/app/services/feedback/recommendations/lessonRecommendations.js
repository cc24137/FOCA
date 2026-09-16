function findFeedback(feedbackItems, id) {
    return feedbackItems.find(
        feedback => feedback.id === id
    );
}


function significantDropRecommendation(
    metrics,
    feedbackItems
) {
    const feedback = findFeedback(
        feedbackItems,
        "significant-drop"
    );

    if (!feedback) {
        return null;
    }

    return {
        id: "review-significant-drop",

        relatedFeedbackIds: [
            "significant-drop"
        ],

        type: "investigation",

        priority: 9,

        title: "Revise esse momento da aula",

        message:
            "Vale verificar o que estava acontecendo nesse trecho. " +
            "Uma mudança de conteúdo, atividade ou dinâmica pode ajudar " +
            "a contextualizar a queda observada.",

        actions: [
            "Revisar o que estava sendo apresentado nesse intervalo",
            "Comparar esse trecho com períodos de maior atenção",
            "Observar se houve mudança de conteúdo ou dinâmica"
        ]
    };
}


function lowAttentionRecommendation(
    metrics,
    feedbackItems
) {
    const feedback = findFeedback(
        feedbackItems,
        "low-attention-period"
    );

    if (!feedback) {
        return null;
    }

    return {
        id: "vary-class-dynamics",

        relatedFeedbackIds: [
            "low-attention-period"
        ],

        type: "intervention",

        priority: 10,

        title: "Considere variar a dinâmica",

        message:
            "Em períodos prolongados de baixa atenção, uma mudança " +
            "breve na dinâmica pode ajudar a recuperar o envolvimento " +
            "da turma.",

        actions: [
            "Fazer uma pergunta rápida para a turma",
            "Utilizar um exemplo prático",
            "Propor um exercício curto",
            "Retomar brevemente os pontos principais"
        ]
    };
}


function recoveryRecommendation(
    metrics,
    feedbackItems
) {
    const feedback = findFeedback(
        feedbackItems,
        "attention-recovery"
    );

    if (!feedback) {
        return null;
    }

    return {
        id: "investigate-recovery",

        relatedFeedbackIds: [
            "attention-recovery"
        ],

        type: "reinforcement",

        priority: 8,

        title: "Observe o que ajudou na recuperação",

        message:
            "A atenção voltou a crescer depois de um período de queda. " +
            "Vale identificar o que mudou nesse momento e se essa abordagem " +
            "pode ser reaproveitada.",

        actions: [
            "Identificar qual atividade ocorreu durante a recuperação",
            "Observar se houve mudança na forma de explicação",
            "Considerar reutilizar estratégias semelhantes"
        ]
    };
}


function significantRiseRecommendation(
    metrics,
    feedbackItems
) {
    const feedback = findFeedback(
        feedbackItems,
        "significant-rise"
    );

    if (!feedback) {
        return null;
    }

    /*
     * Se a subida já foi identificada especificamente como
     * recuperação de uma queda, a recomendação de recuperação
     * é mais informativa e evitamos repetir a mesma ideia.
     */
    if (
        findFeedback(
            feedbackItems,
            "attention-recovery"
        )
    ) {
        return null;
    }

    return {
        id: "investigate-attention-rise",

        relatedFeedbackIds: [
            "significant-rise"
        ],

        type: "reinforcement",

        priority: 7,

        title: "Identifique o que funcionou nesse período",

        message:
            "A atenção apresentou um crescimento relevante. " +
            "Observar o que estava acontecendo nesse intervalo pode ajudar " +
            "a reconhecer estratégias que funcionaram bem com a turma.",

        actions: [
            "Revisar a atividade realizada nesse intervalo",
            "Observar o tipo de conteúdo apresentado",
            "Considerar repetir abordagens semelhantes"
        ]
    };
}


function highAttentionRecommendation(
    metrics,
    feedbackItems
) {
    const feedback = findFeedback(
        feedbackItems,
        "high-attention-period"
    );

    if (!feedback) {
        return null;
    }

    return {
        id: "use-high-attention-as-reference",

        relatedFeedbackIds: [
            "high-attention-period"
        ],

        type: "reinforcement",

        priority: 7,

        title: "Use esse período como referência",

        message:
            "Esse trecho apresentou um nível elevado de atenção. " +
            "Pode ser útil observar quais estratégias, atividades ou " +
            "características estavam presentes nesse momento.",

        actions: [
            "Identificar a dinâmica utilizada",
            "Observar o tipo de conteúdo apresentado",
            "Comparar esse trecho com períodos de menor atenção",
            "Avaliar se a abordagem pode ser reutilizada"
        ]
    };
}


function stablePeriodRecommendation(
    metrics,
    feedbackItems
) {
    const feedback = findFeedback(
        feedbackItems,
        "stable-period"
    );

    if (!feedback) {
        return null;
    }

    /*
     * Não elogiamos estabilidade quando o mesmo período
     * também está associado a atenção baixa.
     */
    if (
        findFeedback(
            feedbackItems,
            "low-attention-period"
        )
    ) {
        return null;
    }

    return {
        id: "maintain-stable-strategy",

        relatedFeedbackIds: [
            "stable-period"
        ],

        type: "monitoring",

        priority: 5,

        title: "Observe o que manteve a estabilidade",

        message:
            "A turma apresentou um comportamento relativamente estável " +
            "durante esse período. Vale observar quais características " +
            "da aula podem ter contribuído para essa consistência.",

        actions: [
            "Observar a estrutura utilizada nesse período",
            "Comparar com outros momentos da aula",
            "Acompanhar se o padrão se repete nas próximas aulas"
        ]
    };
}


function runLessonRecommendations(
    metrics,
    feedbackItems
) {
    return [
        lowAttentionRecommendation(
            metrics,
            feedbackItems
        ),

        significantDropRecommendation(
            metrics,
            feedbackItems
        ),

        recoveryRecommendation(
            metrics,
            feedbackItems
        ),

        significantRiseRecommendation(
            metrics,
            feedbackItems
        ),

        highAttentionRecommendation(
            metrics,
            feedbackItems
        ),

        stablePeriodRecommendation(
            metrics,
            feedbackItems
        )
    ].filter(Boolean);
}


module.exports = {
    runLessonRecommendations,

    significantDropRecommendation,
    lowAttentionRecommendation,
    recoveryRecommendation,
    significantRiseRecommendation,
    highAttentionRecommendation,
    stablePeriodRecommendation
};
