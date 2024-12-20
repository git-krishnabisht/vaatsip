import {
  Button,
  ButtonGroup,
  Card,
  CardBody,
  CardFooter,
  Container,
  Divider,
  Heading,
  Image,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";

export default function GetUsers() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.log("No token in localstorage");
          return;
        }
        const res = await fetch("http://localhost:50136/get-users", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error("Error while fetching users from get-user endpoint");
        }

        const data = await res.json();
        console.log(data);
        setUsers(data.users);
      } catch (err) {
        console.error("Error fetching users: ", err);
      }
    };
    fetchUsers();
  }, []);

  return (
    <>
      <Card width={"20%"} height={"20%"} m={"10px"}>
        <CardBody p={"5px"}>
          <Image
            src="https://images.unsplash.com/photo-1555041469-a586c61ea9bc"
            borderRadius="lg"
          />
        </CardBody>
        <Divider />
        <CardFooter></CardFooter>
      </Card>

      <Container minWidth={"90vh"} paddingTop={"10px"}>
        {Array.isArray(users) && users.length > 0 ? (
          <ol>
            {users.map((data) => (
              <li key={data.username}>
                {data.username} - {data.name} - {data.email}{" "}
              </li>
            ))}
          </ol>
        ) : (
          <p>Loading users... or No users found.</p>
        )}
      </Container>
    </>
  );
}
