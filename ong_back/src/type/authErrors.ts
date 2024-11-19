export enum AuthErrorCode {
    // 4xx Client Errors
    BAD_REQUEST = 400,        // Requête invalide (données manquantes ou invalides)
    UNAUTHORIZED = 401,       // Non authentifié
    FORBIDDEN = 403,         // Non autorisé (authentifié mais pas les droits)
    NOT_FOUND = 404,         // Ressource non trouvée
    SESSION_EXPIRED = 419,   // Session expirée
    LOGIN_TIMEOUT = 440,     // Session va bientôt expirer
}