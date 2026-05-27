export const joinUserRoles = user => ({
    id: user.id,
    email: user.email,
    fullName: user.full_name,
    roles: user.roles?.name || null,
});

export const joinUsersRoles = users => {
    const listUsers = [];
    users.forEach(user => {
        const foundUser = listUsers.find(u => u.id === user.id);
        if (!foundUser) {
            const { role, ...rest } = user;
            const obj = { ...rest, roles: [role] };
            listUsers.push(obj);
        } else {
            foundUser.roles.push(user.role);
        }
    });
    return listUsers;
};
