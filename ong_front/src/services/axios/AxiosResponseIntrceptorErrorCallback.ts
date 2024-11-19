import appConfig from '@/configs/app.config'
import type { AxiosError } from 'axios'

const unauthorizedCode = [401, 419, 440]

const AxiosResponseIntrceptorErrorCallback = (error: AxiosError) => {
    const { response } = error

    // Extraire les données de la réponse pour vérifier must_reset_password
    const responseData = response?.data as { user?: { must_reset_password?: boolean } }

    // Si l'utilisateur doit réinitialiser son mot de passe, rediriger vers /reset-password
    if (responseData?.user?.must_reset_password) {
        window.location.href = '/reset-password'
        return Promise.reject(error)
    }

    // Ne pas rediriger si nous sommes déjà sur la page de login ou reset-password
    if (
        window.location.pathname === appConfig.unAuthenticatedEntryPath ||
        window.location.pathname === '/reset-password'
    ) {
        return Promise.reject(error)
    }

    // Rediriger vers la page de login pour les erreurs d'authentification
    if (response && unauthorizedCode.includes(response.status)) {
        window.location.href = appConfig.unAuthenticatedEntryPath
    }

    return Promise.reject(error)
}

export default AxiosResponseIntrceptorErrorCallback
