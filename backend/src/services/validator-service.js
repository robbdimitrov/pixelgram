export class ValidatorService {

    static emailRegexp = /^[^@]+@[^@]+.[^@]+/;

    static isValidEmail(email: string): boolean {
        return ValidatorService.emailRegexp.test(email);
    }

}
