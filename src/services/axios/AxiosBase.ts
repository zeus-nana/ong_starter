import axios from 'axios'
import AxiosResponseIntrceptorErrorCallback from './AxiosResponseIntrceptorErrorCallback'
import appConfig from '@/configs/app.config'
import type { AxiosError } from 'axios'

const AxiosBase = axios.create({
    timeout: 60000,
    baseURL: appConfig.apiPrefix,
    withCredentials: true,
})

AxiosBase.interceptors.request.use(
    (config) => config,
    (error) => Promise.reject(error)
)

AxiosBase.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
        AxiosResponseIntrceptorErrorCallback(error)
        return Promise.reject(error)
    },
)

export default AxiosBase
