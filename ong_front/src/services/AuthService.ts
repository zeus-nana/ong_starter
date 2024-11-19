import ApiService from './ApiService'
import endpointConfig from '@/configs/endpoint.config'
import {
    ChangePassword,
    ChangePasswordResponse,
    ForgotPassword,
    ForgotPasswordResponse,
    LogInCredential,
    LogInResponse,
    ResetPassword,
    ResetPasswordResponse,
    User,
} from '@/@types/auth'

export async function apiLogIn(data: LogInCredential) {
    return ApiService.fetchDataWithAxios<LogInResponse>({
        url: endpointConfig.auth.login,
        method: 'post',
        data,
    })
}

export async function apiLogout() {
    return ApiService.fetchDataWithAxios<LogInResponse>({
        url: endpointConfig.auth.logout,
        method: 'get',
    })
}

export async function apiGetCurrentUser(data: User) {
    return ApiService.fetchDataWithAxios<LogInResponse>({
        url: endpointConfig.auth.getCurrentUser,
        method: 'get',
        data,
    })
}

export async function apiForgotPassword(data: ForgotPassword) {
    return ApiService.fetchDataWithAxios<ForgotPasswordResponse>({
        url: endpointConfig.auth.forgotPassword,
        method: 'post',
        data,
    })
}

export async function apiResetPassword(data: ResetPassword) {
    return ApiService.fetchDataWithAxios<ResetPasswordResponse>({
        url: endpointConfig.auth.resetPassword,
        method: 'post',
        data,
    })
}

export async function apiChangePassword(data: ChangePassword) {
    return ApiService.fetchDataWithAxios<ChangePasswordResponse>({
        url: endpointConfig.auth.changePassword,
        method: 'post',
        data,
    })
}
