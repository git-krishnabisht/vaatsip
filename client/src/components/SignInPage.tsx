import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

interface Cred {
  email: string;
  password: string;
}

// options -> continue with google/ sign-up with creds.

function SignInPage() {
  const [searchParams] = useSearchParams();
  const error = searchParams.get('error');

  useEffect(() => {
    if (error === 'auth_failed') {
      alert('Authentication failed. Please try again.');
    }
  }, [error]);

  const [cred, setCred] = useState<Cred>({
    email: "",
    password: "",
  });

  // useEffect(() => {
  //   console.log("details: ", cred);
  // }, [cred]);

  const handleFormChange = ((e: React.ChangeEvent<HTMLInputElement>) => {
    setCred({
      ...cred,
      [e.target.name]: e.target.value,
    });
  });

  const handleFormSubmit = ((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setTimeout(() => {
      console.log("Authenticting......");
    }, 1500);
    console.log("Authentication successfull.");
  });

  return (<>
    <form onSubmit={handleFormSubmit}>

      <div>
        <label>
          Email:
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={cred.email}
          onChange={handleFormChange}
          required
        />
      </div>

      <div>
        <label>
          Password:
        </label>
        <input
          type="password"
          id="password"
          name="password"
          value={cred.password}
          onChange={handleFormChange}
          required
        />
      </div>
      <button type="submit"> Submit </button>

      {/* sign-in with google oauth that sends jwt in a cookie */}

      <a type="button" href="http://localhost:50136/auth/google"> Login with Google </a>
    </form>
  </>);
}

export default SignInPage;
