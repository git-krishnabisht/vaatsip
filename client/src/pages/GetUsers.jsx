import { useStore } from "../helpers/useStore.js";
import { useEffect, useState } from "react";
import { fileTypeFromBuffer } from "file-type";
import { ChatIcon, AtSignIcon } from "@chakra-ui/icons";
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  Divider,
  Image,
  Text,
} from "@chakra-ui/react";
import { Link } from "react-router-dom";

export default function GetUsers() {
  const { getusers } = useStore();
  const { users } = useStore();
  const me = useStore((state) => state.user);
  const [userList, setUserList] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      await getusers();
    };
    fetchUsers();
  }, [getusers]);

  useEffect(() => {
    const processUser = async () => {
      if (!Array.isArray(users)) return;
      const UsersWithoutMe = users.filter((user) => user.username != me);
      const userPromises = UsersWithoutMe.map(async (user) => {
        if (user && user.image && user.image.data) {
          const imageBuffer = new Uint8Array(user.image.data);
          const mimeType = await fileTypeFromBuffer(imageBuffer);
          const blob = new Blob([imageBuffer], {
            type: mimeType.mime || "application/octet-stream",
          });
          const imageSrc = URL.createObjectURL(blob);
          return { ...user, imageSrc };
        }
        return user;
      });
      const processedUsers = await Promise.all(userPromises);
      setUserList(processedUsers);
    };
    processUser();
  }, [users]);

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "20px",
        padding: "20px",
      }}
    >
      {userList.map((user) => (
        <div key={user.username}>
          <Card
            width="250px"
            height="270px"
            m="10px"
            boxShadow="lg"
            borderRadius="md"
            overflow="hidden"
            bg="white"
            _hover={{ transform: "scale(1.05)", transition: "0.3s ease" }}
          >
            <CardBody p="0">
              <Image
                src={user.imageSrc ? user.imageSrc : "/default_profile.png"}
                alt={`${user.username}'s profile`}
                borderRadius="md"
                width="90%"
                height="190px"
                objectFit="cover"
                m={"3"}
              />
            </CardBody>
            <Divider />
            <CardFooter justifyContent={"center"} padding={"10px"}>
              <Link to={`/chat/${user.username}`}>
                <ChatIcon marginRight="30px" />
              </Link>
              <Link to="/">
                <AtSignIcon />
              </Link>
            </CardFooter>
          </Card>
        </div>
      ))}
    </div>
  );
  
}
