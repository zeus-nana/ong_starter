import ApiService from './ApiService'
import endpointConfig from '@/configs/endpoint.config'
import type {
    ForgotPassword,
    ResetPassword,
    LogInCredential,
    LogInResponse,
} from '@/@types/auth'


export async function apiLogIn(data: LogInCredential) {
    return ApiService.fetchDataWithAxios<LogInResponse>({
        url: endpointConfig.logIn,
        method: 'post',
        data,
    })
}


export async function apiLogOut() {
    return ApiService.fetchDataWithAxios({
        url: endpointConfig.logOut,
        method: 'post',
    })
}

export async function apiForgotPassword<T>(data: ForgotPassword) {
    return ApiService.fetchDataWithAxios<T>({
        url: endpointConfig.forgotPassword,
        method: 'post',
        data,
    })
}

export async function apiResetPassword<T>(data: ResetPassword) {
    return ApiService.fetchDataWithAxios<T>({
        url: endpointConfig.resetPassword,
        method: 'post',
        data,
    })
}
