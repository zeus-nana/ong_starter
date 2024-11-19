import { useState } from 'react'
import Button from '@/components/ui/Button'
import { FormItem, Form } from '@/components/ui/Form'
import Input from '@/components/ui/Input'
import PasswordInput from '@/components/shared/PasswordInput'
import { apiResetPassword } from '@/services/AuthService'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { ZodType } from 'zod'
import type { CommonProps } from '@/@types/common'
import { toast } from '@/components/ui'
import { Notification } from '@/components/ui/Notification'
import { useNavigate } from 'react-router-dom'
import { Tooltip } from '@/components/ui/Tooltip'

interface ResetPasswordFormProps extends CommonProps {
    resetComplete: boolean
    setResetComplete?: (complete: boolean) => void
    setMessage?: (message: string) => void
}

type ResetPasswordFormSchema = {
    email: string
    currentPassword: string
    newPassword: string
    confirmPassword: string
}

const validationSchema: ZodType<ResetPasswordFormSchema> = z
    .object({
        email: z.string().email('Please enter a valid email address'),
        currentPassword: z.string().min(1, 'Please enter your current password'),
        newPassword: z
            .string()
            .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/, 'Invalid password'),
        confirmPassword: z.string().min(1, 'Please confirm your password'),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
    })

const ResetPasswordForm = (props: ResetPasswordFormProps) => {
    const [isSubmitting, setSubmitting] = useState<boolean>(false)
    const navigate = useNavigate()

    const { className, setMessage, setResetComplete, resetComplete, children } = props

    const {
        handleSubmit,
        formState: { errors },
        control,
    } = useForm<ResetPasswordFormSchema>({
        resolver: zodResolver(validationSchema),
    })

    const showNotification = (type: 'success' | 'warning' | 'danger' | 'info', message: string) => {
        toast.push(
            <Notification title={type === 'success' ? 'Success' : 'Information'} type={type} duration={3000}>
                {message}
            </Notification>,
        )
    }

    const onResetPassword = async (values: ResetPasswordFormSchema) => {
        const { email, currentPassword, newPassword } = values
        setSubmitting(true)

        try {
            const resp = await apiResetPassword({
                email,
                currentPassword,
                newPassword,
            })

            if (resp.status === 'succès' || resp.status === 'success') {
                showNotification('success', 'Your password has been reset successfully')
                setResetComplete?.(true)
                // Redirect to login page after 2 seconds
                setTimeout(() => {
                    navigate('/log-in')
                }, 3000)
            } else {
                setMessage?.(resp.message)
                showNotification('danger', resp.message)
            }
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || error.message || 'An error occurred'
            setMessage?.(errorMessage)
            showNotification('danger', errorMessage)
        }

        setSubmitting(false)
    }

    return (
        <div className={className}>
            {!resetComplete ? (
                <Form onSubmit={handleSubmit(onResetPassword)}>
                    <FormItem label="Email" invalid={Boolean(errors.email)} errorMessage={errors.email?.message}>
                        <Controller
                            name="email"
                            control={control}
                            render={({ field }) => (
                                <Input type="email" placeholder="Enter your email" autoComplete="email" {...field} />
                            )}
                        />
                    </FormItem>
                    <FormItem
                        label="Current Password"
                        invalid={Boolean(errors.currentPassword)}
                        errorMessage={errors.currentPassword?.message}
                    >
                        <Controller
                            name="currentPassword"
                            control={control}
                            render={({ field }) => (
                                <PasswordInput placeholder="Enter your current password" {...field} />
                            )}
                        />
                    </FormItem>
                    <FormItem
                        label="New Password"
                        invalid={Boolean(errors.newPassword)}
                        errorMessage={errors.newPassword?.message}
                    >
                        <Tooltip
                            title="Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number and one special character"
                            placement="left"
                        >
                            <Controller
                                name="newPassword"
                                control={control}
                                render={({ field }) => (
                                    <PasswordInput placeholder="Enter your new password" {...field} />
                                )}
                            />
                        </Tooltip>
                    </FormItem>
                    <FormItem
                        label="Confirm Password"
                        invalid={Boolean(errors.confirmPassword)}
                        errorMessage={errors.confirmPassword?.message}
                    >
                        <Controller
                            name="confirmPassword"
                            control={control}
                            render={({ field }) => <PasswordInput placeholder="Confirm your new password" {...field} />}
                        />
                    </FormItem>
                    <Button block loading={isSubmitting} variant="solid" type="submit">
                        {isSubmitting ? 'Resetting...' : 'Reset Password'}
                    </Button>
                </Form>
            ) : (
                <>{children}</>
            )}
        </div>
    )
}

export default ResetPasswordForm
