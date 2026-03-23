import * as bcrypt from 'bcrypt';

export class PasswordPolicy {

    private static SALT_ROUNDS = 12;

    static hash(plain: string): Promise<string> {
        return bcrypt.hash(plain, this.SALT_ROUNDS);
    }
    static verify(plain: string, hash: string): Promise<boolean> {
        return bcrypt.compare(plain, hash);
    }
}
