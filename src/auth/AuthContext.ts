import { createContext } from 'react'
import type {
    AuthResult,
    User,
    LogInCredential,
    AuthRequestStatus,
} from '@/@types/auth'

type Auth = {
    authenticated: boolean
    user: User
    logIn: (values: LogInCredential) => AuthResult
    logOut: () => void
}

const AuthContext = createContext<Auth>({
    authenticated: false,
    user: {},
    logIn: async () => ({
        status: '' as AuthRequestStatus,
        message: '',
    }),
    logOut: () => {},
})

export default AuthContext
