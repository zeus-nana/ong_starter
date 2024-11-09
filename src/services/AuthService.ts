import ApiService from './ApiService'
import endpointConfig from '@/configs/endpoint.config'
import type { LogInCredential, LogInResponse } from '@/@types/auth'

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
