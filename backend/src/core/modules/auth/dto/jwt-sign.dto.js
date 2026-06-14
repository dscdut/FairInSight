export const JwtPayload = user => (
    {
        id: user.id,
        role: user.role,
        roles: user.roles ?? user.role
    }
);
