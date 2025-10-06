class User {
  constructor({ name, email, password, preferences = { currency: "MXN", dateFormat: "dd/MM/yyyy" } }) {
    const now = new Date();
    this.name = name;
    this.email = email;
    this.password = password;
    this.registerDate = now;
    this.createdAt = now;
    this.updatedAt = now;
    this.deletedAt = null;
    this.preferences = preferences;
  }
}

module.exports = User;
