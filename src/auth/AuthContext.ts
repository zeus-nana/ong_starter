import { createContext } from 'react'
import {
    SignInCredential,
    SignUpCredential,
    AuthResult,
    User,
    LogInCredential,
    OauthLogInCallbackPayload,
} from '@/@types/auth'

type Auth = {
    authenticated: boolean
    user: User
    signIn: (values: SignInCredential) => AuthResult
    logIn: (values: LogInCredential) => AuthResult
    signUp: (values: SignUpCredential) => AuthResult
    signOut: () => void
    logOut: () => void
    oAuthLogIn: (callback: (payload: OauthLogInCallbackPayload) => void) => void
}

const defaultFunctionPlaceHolder = async (): AuthResult => {
    await new Promise((resolve) => setTimeout(resolve, 0))
    return {
        status: '',
        message: '',
    }
}

const defaultOAuthLogInPlaceHolder = (
    callback: (payload: OauthLogInCallbackPayload) => void,
): void => {
    callback({
        onLogIn: () => {},
        redirect: () => {},
    })
}

const AuthContext = createContext<Auth>({
    authenticated: false,
    user: {},
    signIn: async () => defaultFunctionPlaceHolder(),
    logIn: async () => defaultFunctionPlaceHolder(),
    signUp: async () => defaultFunctionPlaceHolder(),
    signOut: () => {},
    logOut: () => {},
    oAuthLogIn: defaultOAuthLogInPlaceHolder,
})

export default AuthContext
