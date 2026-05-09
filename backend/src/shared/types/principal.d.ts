type IPrincipal = {
    id: UUID;
    role: 'ADMIN' | 'PRINTER' | 'DESIGNER' | 'CUSTOMER';
}