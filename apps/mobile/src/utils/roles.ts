export const isAdmin = (user?: {roles?: string[]}|null) => !!user?.roles?.some(role => role === 'ADMIN' || role === 'ROLE_ADMIN');
