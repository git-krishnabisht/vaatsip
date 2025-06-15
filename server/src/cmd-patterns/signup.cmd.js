export class signUpCommand {
  constructor(username, name, email, gender, dob, password) {
    this.username = username;
    this.name = name;
    this.email = email.toLowerCase();
    this.gender = gender;
    this.dob = dob;
    this.password = password;
  }

  toArray() {
    return [
      this.username,
      this.name,
      this.email,
      this.gender,
      this.dob,
      this.password,
    ];
  }
}
