import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { FormItem, Form } from '@/components/ui/Form'
import { apiForgotPassword } from '@/services/AuthService'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { ZodType } from 'zod'
import type { CommonProps } from '@/@types/common'
import { toast } from '@/components/ui'
import { Notification } from '@/components/ui/Notification'

interface ForgotPasswordFormProps extends CommonProps {
    emailSent: boolean
    isSubmitting: boolean
    setIsSubmitting: (value: boolean) => void
    setEmailSent?: (compplete: boolean) => void
    setMessage?: (message: string) => void
}

type ForgotPasswordFormSchema = {
    email: string
}

const validationSchema: ZodType<ForgotPasswordFormSchema> = z.object({
    email: z.string().email().min(5),
})

const ForgotPasswordForm = (props: ForgotPasswordFormProps) => {
    // const [isSubmitting, setSubmitting] = useState<boolean>(false)

    const { className, setMessage, setEmailSent, emailSent, children, isSubmitting, setIsSubmitting } = props

    const {
        handleSubmit,
        formState: { errors },
        control,
    } = useForm<ForgotPasswordFormSchema>({
        resolver: zodResolver(validationSchema),
    })

    const showNotification = (type: 'success' | 'warning' | 'danger' | 'info', message: string) => {
        toast.push(
            <Notification title={type === 'success' ? 'Succès' : 'Information'} type={type} duration={3000}>
                {message}
            </Notification>,
        )
    }

    const onForgotPassword = async (values: ForgotPasswordFormSchema) => {
        const { email } = values
        setIsSubmitting(true)

        try {
            // eslint-disable-next-line  @typescript-eslint/no-explicit-any
            const resp = await apiForgotPassword({ email })
            console.log('response ::', resp)

            if (resp.status === 'succès' || resp.status === 'success') {
                console.log(resp)

                setEmailSent?.(true)
                showNotification('success', 'Un nouveau mot de passe vous a été envoyé par mail.')
            } else {
                setMessage?.(resp.message)
                showNotification('danger', resp.message)
            }
            // eslint-disable-next-line  @typescript-eslint/no-explicit-any
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || error.message || 'An error occured'
            showNotification('danger', errorMessage)
        }

        setIsSubmitting(false)
    }

    return (
        <div className={className}>
            {!emailSent ? (
                <Form onSubmit={handleSubmit(onForgotPassword)}>
                    <FormItem label="Email" invalid={Boolean(errors.email)} errorMessage={errors.email?.message}>
                        <Controller
                            name="email"
                            control={control}
                            render={({ field }) => (
                                <Input type="email" placeholder="Email" autoComplete="off" {...field} />
                            )}
                        />
                    </FormItem>
                    <Button block loading={isSubmitting} variant="solid" type="submit">
                        {isSubmitting ? 'Submiting...' : 'Submit'}
                    </Button>
                </Form>
            ) : (
                <>{children}</>
            )}
        </div>
    )
}

export default ForgotPasswordForm
