import { useState } from 'react'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { FormItem, Form } from '@/components/ui/Form'
import PasswordInput from '@/components/shared/PasswordInput'
import classNames from '@/utils/classNames'
import { useAuth } from '@/auth'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { ZodType } from 'zod'
import type { CommonProps } from '@/@types/common'
import type { ReactNode } from 'react'

interface LoginFormProps extends CommonProps {
    disableSubmit?: boolean
    passwordHint?: string | ReactNode
    setMessage?: (message: string) => void
}

type LoginFormSchema = {
    login: string
    password: string
}

const validationSchema: ZodType<LoginFormSchema> = z.object({
    login: z
        .string({ required_error: 'Please enter your login' })
        .min(1, { message: 'Please enter your login' }),
    password: z
        .string({ required_error: 'Please enter your password' })
        .min(1, { message: 'Please enter your password' }),
})

const LoginForm = (props: LoginFormProps) => {
    const [isSubmitting, setSubmitting] = useState<boolean>(false)

    const { disableSubmit = false, className, setMessage, passwordHint } = props

    const {
        handleSubmit,
        formState: { errors },
        control,
    } = useForm<LoginFormSchema>({
        defaultValues: {
            login: 'admin',
            password: '123Qwe',
        },
        resolver: zodResolver(validationSchema),
    })

    const { logIn } = useAuth()

    const onLogin = async (values: LoginFormSchema) => {
        const { login, password } = values

        if (!disableSubmit) {
            setSubmitting(true)

            const result = await logIn({ login, password })

            if (result?.status === 'failed') {
                setMessage?.(result.message)
            }
        }

        setSubmitting(false)
    }

    return (
        <div className={className}>
            <Form onSubmit={handleSubmit(onLogin)}>
                <FormItem
                    label="Login"
                    invalid={Boolean(errors.login)}
                    errorMessage={errors.login?.message}
                >
                    <Controller
                        name="login"
                        control={control}
                        render={({ field }) => (
                            <Input
                                placeholder="Login"
                                autoComplete="off"
                                {...field}
                            />
                        )}
                    />
                </FormItem>
                <FormItem
                    label="Password"
                    invalid={Boolean(errors.password)}
                    errorMessage={errors.password?.message}
                    className={classNames(
                        passwordHint && 'mb-0',
                        errors.password?.message && 'mb-8',
                    )}
                >
                    <Controller
                        name="password"
                        control={control}
                        rules={{ required: true }}
                        render={({ field }) => (
                            <PasswordInput
                                type="text"
                                placeholder="Password"
                                autoComplete="off"
                                {...field}
                            />
                        )}
                    />
                </FormItem>
                {passwordHint}
                <Button
                    block
                    loading={isSubmitting}
                    variant="solid"
                    type="submit"
                >
                    {isSubmitting ? 'Loging in...' : 'Log In'}
                </Button>
            </Form>
        </div>
    )
}

export default LoginForm
