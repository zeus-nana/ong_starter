import {
    useRef,
    useImperativeHandle,
    forwardRef,
    useState,
    useEffect,
} from 'react'
import AuthContext from './AuthContext'
import appConfig from '@/configs/app.config'
import { apiGetCurrentUser, apiLogIn, apiLogout } from '@/services/AuthService'
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
    id: undefined,
    avatar: '',
    username: '',
    email: '',
    phone: null,
    department: null,
    created_at: undefined,
    authenticated: false,
    authority: [],
}

function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User>(initialUser)
    const [authenticated, setAuthenticated] = useState(false)
    const navigatorRef = useRef<IsolatedNavigatorRef>(null)
    const [loading, setLoading] = useState(true)

    const checkAuth = async () => {
        try {
            const resp = await apiGetCurrentUser(user)
            if (resp.status === 'success' && resp.user) {
                setUser(resp.user)
                setAuthenticated(resp.user.authenticated)
                return true
            }
            return false
            // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unused-vars
        } catch (errors: any) {
            return false
        }
    }

    useEffect(() => {
        const initAuth = async () => {
            // Skip auth check if we're on the login page
            if (
                window.location.pathname === appConfig.unAuthenticatedEntryPath
            ) {
                setLoading(false)
                return
            }

            const isAuthenticated = await checkAuth()
            if (!isAuthenticated) {
                navigatorRef.current?.navigate(
                    appConfig.unAuthenticatedEntryPath,
                )
            }
            setLoading(false)
        }
        initAuth()
    }, [])

    const redirect = (mustResetPassword = false) => {
        const params = new URLSearchParams(window.location.search)
        const redirectUrl = params.get(REDIRECT_URL_KEY)

        if (mustResetPassword) {
            navigatorRef.current?.navigate('/reset-password')
            return
        }

        navigatorRef.current?.navigate(
            redirectUrl || appConfig.authenticatedEntryPath,
        )
    }

    const logIn = async (values: LogInCredential): AuthResult => {
        try {
            const resp = await apiLogIn(values)

            // Gérer le cas où l'utilisateur doit réinitialiser son mot de passe
            if (resp.user.must_reset_password) {
                setUser(resp.user)
                setAuthenticated(false)
                redirect(true)
                return {
                    status: 'warning',
                    message: 'Please reset your password',
                }
            }

            if (resp.status === 'success' && resp.user) {
                setUser(resp.user)
                setAuthenticated(resp.user.authenticated)
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

    const logOut = async () => {
        try {
            const response = await apiLogout(user)
            if (response.status === 'success') {
                setUser(initialUser)
                setAuthenticated(false)
                navigatorRef.current?.navigate(
                    appConfig.unAuthenticatedEntryPath,
                )
            }
        } catch (error) {
            console.error('Logout failed:', error)
            // Still clear local state even if API call fails
            setUser(initialUser)
            setAuthenticated(false)
            navigatorRef.current?.navigate(appConfig.unAuthenticatedEntryPath)
        }
    }

    if (loading) {
        return null // Or a loading spinner component
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
