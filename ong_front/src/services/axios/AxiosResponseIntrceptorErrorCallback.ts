import appConfig from '@/configs/app.config'
import type { AxiosError } from 'axios'

const unauthorizedCode = [401, 419, 440]

const AxiosResponseIntrceptorErrorCallback = (error: AxiosError) => {
    const { response } = error

    if (response && unauthorizedCode.includes(response.status)) {
        // Force la redirection vers la page de login
        window.location.href = appConfig.unAuthenticatedEntryPath
    }
}

export default AxiosResponseIntrceptorErrorCallback
