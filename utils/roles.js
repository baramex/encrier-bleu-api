const PERMISSIONS = {
    ALL: 0,
    VIEW_USERS: 1,
    MANAGE_USERS: 2,
    CREATE_USER: 3,
    VIEW_ROLES: 4,
    SEND_MESSAGE: 5,
    VIEW_MESSAGES: 6
};

const ROLES = {
    USER: 0,
    ADMIN: 1
}

const ROLE_VALUES = {
    [ROLES.USER]: {
        id: 0,
        name: "User",
        permissions: [PERMISSIONS.SEND_MESSAGE, PERMISSIONS.VIEW_MESSAGES, PERMISSIONS.VIEW_ROLES]
    },
    [ROLES.ADMIN]: {
        id: 1,
        name: "Admin",
        permissions: [PERMISSIONS.ALL]
    }
}

module.exports = { ROLES, PERMISSIONS, ROLE_VALUES }