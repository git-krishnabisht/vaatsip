export async function userValidation(input) {
  const errors = [];
  if (!input.username) errors.push("Username is required");
  if (!input.name) errors.push("Name is required");
  if (!input.email || !input.email.includes("@"))
    errors.push("Invalid email format");
  if (!input.gender) errors.push("Gender is required");
  if (!input.dob) errors.push("dob is required");
  if (!input.password) errors.push("Password is required");

  return {
    isValid: errors.length === 0,
    errors,
  };
}
