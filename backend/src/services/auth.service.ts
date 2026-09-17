export type SessionUser = {
  id: string;
  role: 'CUSTOMER' | 'ADMIN';
};

export const authService = {
  isAuthenticated(user?: SessionUser | null) {
    return Boolean(user && user.id);
  },

  isAdmin(user?: SessionUser | null) {
    return user?.role === 'ADMIN';
  },

  requireRole(user: SessionUser | null | undefined, role: 'CUSTOMER' | 'ADMIN') {
    if (!user) {
      throw new Error('Authentication required');
    }
    if (user.role !== role && user.role !== 'ADMIN') {
      throw new Error('Insufficient permissions');
    }
    return user;
  }
};
