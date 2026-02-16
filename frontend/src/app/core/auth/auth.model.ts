enum Role {
	Admin, Designer, Printer, Customer
}

interface AuthDto {
	id: string;
	email: string;
	role: Role;

}
interface RegisterDto {
	email: string;
	name: string;
	address: string;
	// TODO: other data
	role: Role;
	password: string;
}
interface LoginDto {
	email: string;
	password: string;
}