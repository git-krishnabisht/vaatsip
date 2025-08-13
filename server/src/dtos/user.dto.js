export class authDto {
  constructor({ email, password }) {
    this.email = email?.toLowerCase();
    this.password = password;
  }
}

