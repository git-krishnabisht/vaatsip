import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

interface Cred {
  email: string;
  password: string;
}

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
    {/* contains the whole screen */}
    <div className="flex justify-center items-center h-screen">

      {/* container containing container 01 and 02 -> container 3*/}
      <div className="border-2 border-black rounded-xl p-15">
        <form onSubmit={handleFormSubmit} className="flex flex-col gap-5">

          {/* flex column container for labels and input -> container 01 */}
          <div className="flex flex-col gap-5">
            <div>
              <label className="ml-6">
                Email:
              </label>
              <input
                className="ml-2 border-2 rounded-sm"
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
                className="ml-2 border-2 rounded-sm"
                type="password"
                id="password"
                name="password"
                value={cred.password}
                onChange={handleFormChange}
                required
              />
            </div>
          </div>

          {/* flex column container for buttons -> container 02 */}
          <div className="flex flex-col gap-3">
            <div className="flex justify-center">
              <button type="submit"> Submit </button>
            </div>
            <div className="flex justify-center">
              <a type="button" href="http://localhost:50136/auth/google"> Login with Google </a>
            </div>
          </div>

        </form>
      </div>
    </div>
  </>);
}

export default SignInPage;
