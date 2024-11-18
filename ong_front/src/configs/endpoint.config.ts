export const apiPrefix = 'http://127.0.0.1:3000/api/v1'

const endpointConfig = {
    auth: {
        login: `${apiPrefix}/auth/login`,
        logout: `${apiPrefix}/auth/logout`,
        getCurrentUser: `${apiPrefix}/auth/current-user`,
        forgotPassword: `${apiPrefix}/auth/forgot-password`,
        resetPassword: `${apiPrefix}/auth/reset-password`,
    },
}

export default endpointConfig
