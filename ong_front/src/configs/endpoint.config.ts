export const apiPrefix = 'http://127.0.0.1:3000/api/v1'

const endpointConfig = {
    auth: {
        login: `${apiPrefix}/auth/login`,
        logout: `${apiPrefix}/auth/logout`,
        getCurrentUser: `${apiPrefix}/auth/current-user`,
        forgotPassword: `${apiPrefix}/users/forgot-password`,
        resetPassword: `${apiPrefix}/users/reset-password`,
        changePassword: `${apiPrefix}/auth/change-password`,
    },
}

export default endpointConfig
