import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

interface Cred {
  name?: string;
  email: string;
  password: string;
}

function SignInPage() {
  const [searchParams] = useSearchParams();
  const error = searchParams.get("error");

  useEffect(() => {
    if (error === "auth_failed") {
      alert("Authentication failed. Please try again.");
    }
  }, [error]);

  const [authTab, setAuthTab] = useState<"signin" | "signup">("signin");

  const [cred, setCred] = useState<Cred>({
    name: "",
    email: "",
    password: "",
  });


  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCred({
      ...cred,
      [e.target.name]: e.target.value,
    });
  };

  const navigate = useNavigate();

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const url =
      authTab === "signin"
        ? "http://localhost:50136/api/auth/sign-in"
        : "http://localhost:50136/api/auth/sign-up";

    const payload =
      authTab === "signin"
        ? { email: cred.email, password: cred.password }
        : cred;

    try {
      const res = await fetch(url, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Request failed " + res.status);

      const data = await res.json();
      console.log("Success:", data);

      setCred({ name: "", email: "", password: "" });
      navigate("/", { replace: true });

    } catch (err) {
      console.error("Error:", err);
    }
  };

  return (
    <>
      {/* contains the whole screen */}
      <div className="flex justify-center items-center h-screen">

        {/* container containing container 01 and 02 -> container 3*/}
        <div className="border-2 border-black rounded-xl p-15">

          {/* tabs */}
          <div className="flex justify-around mb-4">
            <button className="hover: cursor-pointer" type="button" onClick={() => setAuthTab("signin")}>
              Sign In
            </button>
            <button className="hover: cursor-pointer" type="button" onClick={() => setAuthTab("signup")}>
              Sign Up
            </button>
          </div>

          <form onSubmit={handleFormSubmit} className="flex flex-col gap-5">

            {/* flex column container for labels and input -> container 01 */}
            <div className="flex flex-col gap-5">

              {authTab === "signup" && (
                <div>
                  <label className="ml-6">Name:</label>
                  <input
                    className="ml-2 border-2 rounded-sm"
                    type="text"
                    id="name"
                    name="name"
                    value={cred.name}
                    onChange={handleFormChange}
                    required
                  />
                </div>
              )}

              <div>
                <label className="ml-6">Email:</label>
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
                <label>Password:</label>
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
            <div className="flex justify-center items-center flex-col gap-3">
              <div>
                <button type="submit" className="hover: cursor-pointer">
                  {authTab === "signin" ? "Submit" : "Register"}
                </button>
              </div>
              <div>
                <a
                  type="button"
                  href="http://localhost:50136/auth/google"
                >
                  Continue with Google
                </a>
              </div>

              {authTab === "signin" && (
                <>
                  <div>
                    <button
                      type="button"
                      onClick={() => setAuthTab("signup")}
                      className="hover: cursor-pointer"
                    >
                      New to chat? Create new account
                    </button>
                  </div>
                </>
              )}
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default SignInPage;

