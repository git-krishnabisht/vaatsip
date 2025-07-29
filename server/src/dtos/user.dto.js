export class SignUpDTO {
  constructor({ username, name, email, gender, dob, password }) {
    this.username = username?.trim();
    this.name = name?.trim();
    this.email = email?.toLowerCase();
    this.gender = gender;
    this.dob = dob;
    this.password = password;
  }
}

export class SignInDTO {
  constructor({ username, password }) {
    this.username = username?.trim();
    this.password = password;
  }
}
