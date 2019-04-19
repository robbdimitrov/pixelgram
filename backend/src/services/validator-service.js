export class ValidatorService {

    static emailRegexp = /^[^@]+@[^@]+.[^@]+/;

    static isValidEmail(email) {
        return ValidatorService.emailRegexp.test(email);
    }

}
