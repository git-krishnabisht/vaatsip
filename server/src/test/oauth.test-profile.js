export const testProfile = (req, res) => {
  res.send(`
    <h1>Welcome ${req.user.name}</h1>
    <p>Email: ${req.user.email}</p>
    <form action="/sign-out" method="POST">
      <button type="submit">Logout</button>
    </form>
  `);
};
