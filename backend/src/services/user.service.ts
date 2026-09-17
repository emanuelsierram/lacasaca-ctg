import { randomBytes } from 'node:crypto';

export type UserRecord = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'CUSTOMER' | 'ADMIN';
};

export type RegisterUserInput = {
  name: string;
  email: string;
  password: string;
};

export type LoginUserInput = {
  email: string;
  password: string;
};

const passwordStrength = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export const userService = {
  registerUser(users: UserRecord[], input: RegisterUserInput) {
    const normalizedEmail = input.email.trim().toLowerCase();
    if (!normalizedEmail || !input.name.trim()) {
      throw new Error('Name and email are required');
    }
    if (!passwordStrength.test(input.password)) {
      throw new Error('Password does not meet strength requirements');
    }
    if (users.some((user) => user.email.toLowerCase() === normalizedEmail)) {
      throw new Error('User already exists');
    }

    const user: UserRecord = {
      id: `user-${Date.now()}`,
      name: input.name.trim(),
      email: normalizedEmail,
      passwordHash: this.hashPassword(input.password),
      role: 'CUSTOMER'
    };

    users.push(user);
    return { ...user, passwordHash: user.passwordHash };
  },

  loginUser(users: UserRecord[], input: LoginUserInput) {
    const match = users.find((user) => user.email.toLowerCase() === input.email.trim().toLowerCase());
    if (!match) {
      return null;
    }
    const valid = this.verifyPassword(input.password, match.passwordHash);
    if (!valid) {
      return null;
    }
    return {
      id: match.id,
      name: match.name,
      email: match.email,
      role: match.role
    };
  },

  hashPassword(password: string) {
    return `hash:${Buffer.from(password).toString('base64')}`;
  },

  verifyPassword(password: string, passwordHash: string) {
    return passwordHash === this.hashPassword(password);
  },

  createGuestUser(users: UserRecord[], input: { name: string; email: string }) {
    const normalizedEmail = input.email.trim().toLowerCase();
    if (!normalizedEmail || !input.name.trim()) {
      throw new Error('Name and email are required');
    }
    if (users.some((user) => user.email.toLowerCase() === normalizedEmail)) {
      throw new Error('User already exists');
    }
    const internalPassword = `${randomBytes(24).toString('base64url')}Aa1!`;
    const user: UserRecord = {
      id: `user-${Date.now()}-${randomBytes(4).toString('hex')}`,
      name: input.name.trim(),
      email: normalizedEmail,
      passwordHash: this.hashPassword(internalPassword),
      role: 'CUSTOMER'
    };
    users.push(user);
    return { id: user.id, name: user.name, email: user.email, role: 'CUSTOMER' as const };
  }
};
