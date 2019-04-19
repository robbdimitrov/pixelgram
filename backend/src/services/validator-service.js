export class ValidatorService {
  static isValidEmail(email) {
    let emailRegex = /^[^@]+@[^@]+.[^@]+/;
    return emailRegex.test(email);
  }
}
