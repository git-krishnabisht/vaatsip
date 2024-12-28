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
import { useStore } from "../helpers/useStore.js";
import { useEffect, useState } from "react";
export default function GetUsers() {
  const [users, setUsers] = useState(null);
  const { getusers } = useStore();

  useEffect(() => {
    async function getUsers() {
      await getusers();
      const users  = useStore.getState().users;
      setUsers(users);
    }
    getUsers();
  },[getusers]);

  return (
    <>
      {/* <Card width={"20%"} height={"20%"} m={"10px"}>
        <CardBody p={"5px"}>
          <Image
            src="https://images.unsplash.com/photo-1555041469-a586c61ea9bc"
            borderRadius="lg"
          />
        </CardBody>
        <Divider />
        <CardFooter></CardFooter>
      </Card> */}

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
