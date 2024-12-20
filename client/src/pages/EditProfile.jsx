import { Button } from "@chakra-ui/react";

export default function EditProfile() {
  function handleClick() {
    const token = localStorage.getItem("token");

    if (!token) {
      console.error("Token is missing in localStorage.");
      return;
    }

    fetch("http://localhost:50136/edit-profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json", 
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to edit profile");
        }
        return response.json();
      })
      .then((data) => console.log(data))
      .catch((error) => console.error("Errorrr: ", error));
  }

  return (
    <>
      <Button onClick={handleClick}>Click Me</Button>
    </>
  );
}

