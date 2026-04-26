enum IMembershipRole {
    OWNER = 0,
    ADMINISTRATOR = 1,
    STAFF = 2,
    TEACHER = 3,
    PARENT = 4,
    STUDENT = 5
}

type IPrincipal = {
    id: number;
    role: 'ADMIN' | 'USER';
    status: number;
}

type IMembership = {
    billingModel: 'FREE' | 'USER_SUBSCRIPTION' | 'SCHOOL_LICENSE';
    activeRole: IMembershipRole;
    roles: IMembershipRole[];
}