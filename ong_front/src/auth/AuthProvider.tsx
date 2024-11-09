import { useRef, useImperativeHandle, forwardRef, useState } from 'react'
import AuthContext from './AuthContext'
import appConfig from '@/configs/app.config'
import { apiLogIn } from '@/services/AuthService'
import { REDIRECT_URL_KEY } from '@/constants/app.constant'
import { useNavigate } from 'react-router-dom'
import type { AuthResult, User, LogInCredential } from '@/@types/auth'
import type { ReactNode } from 'react'
import type { NavigateFunction } from 'react-router-dom'

type AuthProviderProps = {
    children: ReactNode
}

type IsolatedNavigatorRef = {
    navigate: NavigateFunction
}

const IsolatedNavigator = forwardRef<IsolatedNavigatorRef>((_, ref) => {
    const navigate = useNavigate()

    useImperativeHandle(
        ref,
        () => ({
            navigate,
        }),
        [navigate],
    )

    return <></>
})

const initialUser: User = {
    avatar: '',
    userName: '',
    email: '',
    authority: [],
}

function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User>(initialUser)
    const [authenticated, setAuthenticated] = useState(false)
    const navigatorRef = useRef<IsolatedNavigatorRef>(null)

    const redirect = () => {
        const params = new URLSearchParams(window.location.search)
        const redirectUrl = params.get(REDIRECT_URL_KEY)
        navigatorRef.current?.navigate(
            redirectUrl || appConfig.authenticatedEntryPath,
        )
    }

    const logIn = async (values: LogInCredential): AuthResult => {
        try {
            const resp = await apiLogIn(values)
            if (resp?.user) {
                setUser(resp.user)
                setAuthenticated(true)
                redirect()
                return {
                    status: 'success',
                    message: '',
                }
            }
            return {
                status: 'failed',
                message: 'Unable to log in',
            }
            // eslint-disable-next-line  @typescript-eslint/no-explicit-any
        } catch (errors: any) {
            return {
                status: 'failed',
                message: errors?.response?.data?.message || errors.toString(),
            }
        }
    }

    const logOut = () => {
        setUser(initialUser)
        setAuthenticated(false)
        navigatorRef.current?.navigate(appConfig.unAuthenticatedEntryPath)
    }

    return (
        <AuthContext.Provider
            value={{
                authenticated,
                user,
                logIn,
                logOut,
            }}
        >
            {children}
            <IsolatedNavigator ref={navigatorRef} />
        </AuthContext.Provider>
    )
}

IsolatedNavigator.displayName = 'IsolatedNavigator'

export default AuthProvider
