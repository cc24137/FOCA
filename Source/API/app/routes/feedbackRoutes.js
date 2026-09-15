const express = require("express");
const router = express.Router();

const FeedbackController =
    require("../controller/feedbackController");

const feedbackController =
    new FeedbackController();

const verifyToken =
    require("../middleware/authMiddleware");


router.get("/aula/:aulaId/completo", verifyToken, feedbackController.getCompleteFeedback);

router.get("/aula/:aulaId", verifyToken, feedbackController.getLessonFeedback);

router.get("/historico/:aulaId", verifyToken, feedbackController.getHistoryFeedback);


module.exports = router;
