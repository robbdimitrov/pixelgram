function isValidEmail(email) {
  const regex = /^[^@]+@[^@]+.[^@]+/;
  return regex.test(email);
}

module.exports = {
  isValidEmail
};
