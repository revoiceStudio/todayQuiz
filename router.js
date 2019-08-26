const express = require('express')
const router = express.Router()
const controller = require('./controller')

router.use(express.json())

router.post('/openQuiz', controller.openQuiz)
router.post('/answerQuiz', controller.answerQuiz)
router.post('/quiz_sound', controller.quizSound)
router.post('/bonusevent_sound',controller.bonuseventSound)
router.post('/adevent_sound',controller.adeventSound)
router.post('/finish_sound',controller.finishSound)
router.post('/default_finished',controller.default_finished)
router.get('/health',controller.health)
router.post('/askPoint',controller.askPoint)
module.exports = router