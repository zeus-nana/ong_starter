import createTransporter from './emailTransporter'

const sendEmail = async (options: {
    email: string
    subject: string
    message: string
}) => {
    const transporter = createTransporter()

    const mailOptions = {
        from: '"Support" <no-reply@example.com>', // Nom + email
        to: options.email,
        subject: options.subject,
        text: options.message,
    }

    await transporter.sendMail(mailOptions)
}

export default sendEmail
