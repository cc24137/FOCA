const feedbackConfig = {
    lesson: {
        smoothingWindowSeconds: 60,
        variationWindowSeconds: 180,

        significantDropPoints: 10,
        significantRisePoints: 10,

        lowAttentionThreshold: 50,
        highAttentionThreshold: 75,

        minimumLowPeriodSeconds: 120,
        minimumHighPeriodSeconds: 180,

        stabilityMaxStandardDeviation: 4,
        minimumStablePeriodSeconds: 300,

        recoveryMinimumPercentage: 60,
    },

    history: {
        minimumLessons: 3,
        lookbackLessons: 5,
    
        significantDifferencePoints: 5,
    
        trendMinimumLessons: 3,
        trendMinimumDifferencePoints: 2,
        trendMinimumConsistency: 0.67,
    
        stabilityMaxStandardDeviation: 4
    },

    output: {
        maxFeedbackItems: 4,
        maxRecommendationItems: 3
    }
};

module.exports = feedbackConfig;
