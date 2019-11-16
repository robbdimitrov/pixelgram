class ValidatorService {
  static isValidEmail(email) {
    const emailRegex = /^[^@]+@[^@]+.[^@]+/;
    return emailRegex.test(email);
  }
}

module.exports = ValidatorService;
