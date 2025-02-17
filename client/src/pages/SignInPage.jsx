import { useEffect, useState } from "react";
import { Button, Container, Input, Stack } from "@chakra-ui/react";
import { Field } from "@/components/ui/field";
import { useNavigate } from "react-router-dom";
import { useStore } from "../helpers/useStore";
import { PasswordInput } from "@/components/ui/password-input"

function SignInPage() {
  const navigate = useNavigate();
  const { signin } = useStore();
  const isSignedIn = useStore((state) => state.isSignedIn);
  const [formParams, setFormParams] = useState({
    username: "",
    password: ""
  });

  const handleSignIn = () => {
    signin(formParams);
  };

  useEffect(() => {
    if (isSignedIn) {
      navigate("/");
    }
  }, [isSignedIn, navigate]);

  return (
    <Container justifyItems={"center"} marginTop={"150px"}>
      <Stack>
        <Field label="Username" required>
          <Input
            placeholder="Username"
            width={320}
            type="text"
            name="username"
            value={formParams.username}
            onChange={(e) =>
              setFormParams({ ...formParams, username: e.target.value })
            }
          />
        </Field>
        <Field label="Password" required marginBottom="10px">
          <PasswordInput
            placeholder="Password"
            minWidth={320}
            type="password"
            name="password"
            value={formParams.password}
            onChange={(e) =>
              setFormParams({ ...formParams, password: e.target.value })
            }
          />
        </Field>
        <Button onClick={handleSignIn}>Sign In</Button>
      </Stack>
    </Container>
  );
}

export default SignInPage;
