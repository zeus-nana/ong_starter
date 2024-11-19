import { NextFunction, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import validator from 'validator'
import db from '../database/connection'
import { User } from '../models/User'
import { catchAsync } from '../utils/catchAsync'
import AppError from '../utils/appError'
import { signToken } from '../utils/tokens'
import sendEmail from '../utils/email/sendEmail'

const changePassword = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const { currentPassword, newPassword } = req.body
        const userId = req.user!.id

        // 1) Get user from database
        const user = await db('users').where({ id: userId }).first()
        if (!user) {
            return next(new AppError('Utilisateur non trouvé.', 404))
        }

        // 2) Check if current password is correct
        const isPasswordCorrect = await bcrypt.compare(
            currentPassword,
            user.password,
        )

        if (!isPasswordCorrect) {
            return next(
                new AppError('Le mot de passe actuel est incorrect.', 401),
            )
        }

        // 3) Check if new password is different from old password
        const isNewPasswordDifferent = await bcrypt.compare(
            newPassword,
            user.password,
        )
        if (isNewPasswordDifferent) {
            return next(
                new AppError(
                    "Le nouveau mot de passe doit être différent de l'ancien.",
                    400,
                ),
            )
        }

        // 4) Validate new password
        if (!validator.isStrongPassword(newPassword)) {
            return next(
                new AppError(
                    "Le nouveau mot de passe n'est pas assez fort.",
                    400,
                ),
            )
        }

        // 5) Generate new token
        const newToken = signToken(user.id, user.email)
        res.cookie('jwt', newToken, {
            httpOnly: true,
            expires: new Date(
                Date.now() +
                    Number(process.env.JWT_COOKIE_EXPIRES_IN) *
                        24 *
                        60 *
                        60 *
                        1000,
            ),
            secure: process.env.NODE_ENV === 'production',
        })

        // 6) Update password
        const hashedNewPassword = await bcrypt.hash(newPassword, 12)
        await db('users').where({ id: userId }).update({
            password: hashedNewPassword,
            must_reset_password: false,
            updated_by: req.user!.id,
        })

        res.status(200).json({
            status: 'succès',
            message: 'Mot de passe changé avec succès.',
        })
    },
)

const generateTemporaryPassword = (): string => {
    const length = 12
    const upperCase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const lowerCase = 'abcdefghijklmnopqrstuvwxyz'
    const numbers = '0123456789'
    const symbols = '!@#$%^&*'

    const allChars = upperCase + lowerCase + numbers + symbols

    let password = ''
    password += upperCase[Math.floor(Math.random() * upperCase.length)]
    password += lowerCase[Math.floor(Math.random() * lowerCase.length)]
    password += numbers[Math.floor(Math.random() * numbers.length)]
    password += symbols[Math.floor(Math.random() * symbols.length)]

    for (let i = password.length; i < length; i++) {
        password += allChars[Math.floor(Math.random() * allChars.length)]
    }

    return password
        .split('')
        .sort(() => Math.random() - 0.5)
        .join('')
}

const forgotPassword = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const { email } = req.body

        if (!email || !validator.isEmail(email)) {
            return next(
                new AppError('Veuillez fournir une adresse email valide.', 400),
            )
        }

        const user = await db('users')
            .where({ email: email.toLowerCase() })
            .first()
        if (!user) {
            return next(
                new AppError(
                    'Aucun utilisateur trouvé avec cette adresse email.',
                    404,
                ),
            )
        }

        if (!user.active) {
            return next(
                new AppError(
                    'Ce compte est désactivé. Veuillez contacter le support.',
                    403,
                ),
            )
        }

        const temporaryPassword = generateTemporaryPassword()
        const hashedPassword = await bcrypt.hash(temporaryPassword, 12)

        await db('users').where({ id: user.id }).update({
            password: hashedPassword,
            must_reset_password: true,
            updated_by: user.id,
        })

        let emailSent = true
        try {
            await sendEmail({
                email: user.email,
                subject: 'Réinitialisation de votre mot de passe',
                message: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2C3E50; border-bottom: 2px solid #3498DB; padding-bottom: 10px;">Réinitialisation de mot de passe</h2>
        
        <p style="color: #34495E; font-size: 16px;">Bonjour,</p>
        
        <p style="color: #34495E; font-size: 16px;">Vous avez demandé la réinitialisation de votre mot de passe.</p>
        
        <div style="background-color: #F8F9FA; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; color: #2C3E50;">Votre nouveau mot de passe temporaire :</p>
            <p style="font-family: monospace; font-size: 24px; color: #3498DB; margin: 10px 0;">${temporaryPassword}</p>
        </div>
        
        <div style="background-color: #FFF3CD; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="color: #856404; margin: 0;">
                <strong>Important :</strong> Pour des raisons de sécurité, vous devrez changer ce mot de passe lors de votre prochaine connexion.
            </p>
        </div>
        
        <p style="color: #E74C3C; font-size: 14px;">
            Si vous n'êtes pas à l'origine de cette demande, veuillez contacter immédiatement le support.
        </p>
        
        <div style="border-top: 1px solid #ddd; margin-top: 20px; padding-top: 20px; font-size: 12px; color: #777;">
            Ceci est un message automatique, merci de ne pas y répondre.
        </div>
    </div>
    `,
            })
        } catch (err) {
            console.error("Erreur lors de l'envoi de l'email", err)
            emailSent = false
        }

        res.status(200).json({
            status: 'succès',
            message: emailSent
                ? 'Un mot de passe temporaire a été envoyé à votre adresse email.'
                : `La réinitialisation du mot de passe a été effectuée mais l'email n'a pas pu être envoyé. 
           Veuillez contacter le support pour obtenir un nouveau mot de passe.`,
        })
    },
)

const resetPassword = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const { email, currentPassword, newPassword } = req.body

        if (!email || !validator.isEmail(email)) {
            return next(
                new AppError('Veuillez fournir une adresse email valide.', 400),
            )
        }

        if (!currentPassword || !newPassword) {
            return next(
                new AppError('Veuillez fournir les deux mots de passe.', 400),
            )
        }

        const user = await db('users')
            .where({ email: email.toLowerCase() })
            .first()
        if (!user) {
            return next(
                new AppError(
                    'Aucun utilisateur trouvé avec cette adresse email.',
                    404,
                ),
            )
        }

        if (!user.active) {
            return next(
                new AppError(
                    'Ce compte est désactivé. Veuillez contacter le support.',
                    403,
                ),
            )
        }

        const isPasswordCorrect = await bcrypt.compare(
            currentPassword,
            user.password,
        )
        if (!isPasswordCorrect) {
            return next(
                new AppError('Le mot de passe actuel est incorrect.', 401),
            )
        }

        const isNewPasswordDifferent = await bcrypt.compare(
            newPassword,
            user.password,
        )
        if (isNewPasswordDifferent) {
            return next(
                new AppError(
                    "Le nouveau mot de passe doit être différent de l'ancien.",
                    400,
                ),
            )
        }

        if (!validator.isStrongPassword(newPassword)) {
            return next(
                new AppError(
                    "Le nouveau mot de passe n'est pas assez fort.",
                    400,
                ),
            )
        }

        const newToken = signToken(user.id, user.email)
        res.cookie('jwt', newToken, {
            httpOnly: true,
            expires: new Date(
                Date.now() +
                    Number(process.env.JWT_COOKIE_EXPIRES_IN) *
                        24 *
                        60 *
                        60 *
                        1000,
            ),
            secure: process.env.NODE_ENV === 'production',
        })

        const hashedNewPassword = await bcrypt.hash(newPassword, 12)
        await db('users').where({ id: user.id }).update({
            password: hashedNewPassword,
            must_reset_password: false,
            updated_by: user.id,
        })

        res.status(200).json({
            status: 'succès',
            message: 'Mot de passe réinitialisé avec succès.',
        })
    },
)

export default {
    changePassword,
    forgotPassword,
    resetPassword,
}
