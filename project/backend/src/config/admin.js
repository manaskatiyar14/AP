function isAdminEmail(email) {
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!adminEmail || !email) {
    return false;
  }

  return email.trim().toLowerCase() === adminEmail.trim().toLowerCase();
}

module.exports = { isAdminEmail };