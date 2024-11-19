import appConfig from '@/configs/app.config'
import type { AxiosError } from 'axios'

const unauthorizedCode = [401, 419, 440]

const AxiosResponseIntrceptorErrorCallback = (error: AxiosError) => {
    const { response } = error

    // Ne pas rediriger si nous sommes déjà sur la page de login
    if (window.location.pathname === appConfig.unAuthenticatedEntryPath) {
        return Promise.reject(error)
    }

    // Rediriger uniquement si nous ne sommes pas déjà sur la page de login
    if (response && unauthorizedCode.includes(response.status)) {
        window.location.href = appConfig.unAuthenticatedEntryPath
    }

    return Promise.reject(error)
}

export default AxiosResponseIntrceptorErrorCallback
