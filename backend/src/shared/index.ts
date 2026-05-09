export const HEADER_AUTH_TOKEN = 'AUTH_TOKEN';

export const EVENTS = {
    LOGGER: {
        DEBUG: 'logger.debug',
        LOG: 'logger.log',
        WARN: 'logger.warn',
        ERROR: 'logger.error',
        FATAL: 'logger.fatal',
    },
    USER: {
        DELETED: 'user.deleted',
    }
}
export const KEY_PLACEHOLDER = '{{KEY}}';


export function generateRandomPassword(length: number = 12): string {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+[]{}|;:,.<>?';
    let password = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * chars.length);
        password += chars[randomIndex];
    }
    return password;
}
