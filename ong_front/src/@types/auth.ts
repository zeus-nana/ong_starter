export type LogInCredential = {
    email: string
    password: string
}

export type LogInResponse = {
    status: string
    token: string
    user: {
        id: number
        username: string
        email: string
        phone: string | null
        department: string | null
        must_reset_password: boolean
        created_at: Date
        authenticated: boolean
    }
}

export type ForgotPassword = {
    email: string
}

export type ResetPassword = {
    password: string
}

export type AuthRequestStatus = 'success' | 'failed' | 'warning' | ''

export type AuthResult = Promise<{
    status: AuthRequestStatus
    message: string
}>

export type User = {
    id?: number
    username?: string
    avatar?: string
    email?: string
    phone?: string | null
    department?: string | null
    created_at?: Date
    authenticated?: boolean
    authority?: string[]
}

export type ForgotPasswordResponse = {
    status: string
    message: string
    data?: boolean
}
