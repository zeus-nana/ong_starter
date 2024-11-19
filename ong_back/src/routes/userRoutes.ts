import express from 'express'
import usersController from '../controllers/usersController'
import authController from '../controllers/authController'

const router = express.Router()

router.route('/forgot-password').post(usersController.forgotPassword)
router.route('/reset-password').post(usersController.resetPassword)

router.use(authController.protect)
router.route('/change-password').post(usersController.changePassword)

export default router
