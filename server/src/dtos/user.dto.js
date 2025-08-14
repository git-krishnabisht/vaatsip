export class authDto {
  constructor({ email, password }) {
    this.email = email?.toLowerCase();
    this.password = password;
  }
}

export class signUpDto {
  constructor({ name, email, password }) {
    this.name = name;
    this.email = email?.toLowerCase();
    this.password = password;
  }
}

