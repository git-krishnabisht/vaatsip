import { useStore } from "../helpers/useStore.js";
import { useEffect, useState } from "react";
import { fileTypeFromBuffer } from "file-type";
import {
  Card,
  CardBody,
  CardFooter,
  Divider,
  Image,
  Text,
} from "@chakra-ui/react";

export default function GetUsers() {
  const { getusers } = useStore();
  const { users } = useStore();
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
      const userPromises = users.map(async (user) => {
        if (user.image.data) {
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
    <div>
      {userList.map((user) => (
        <div key={user.username}>
          {user.imageSrc ? (
            <Card width={"20%"} height={"20%"} m={"10px"}>
              <CardBody p={"5px"}>
                <Image src={user.imageSrc} borderRadius="lg" />
                <Text>{user.username}</Text>
              </CardBody>
              <Divider />
              <CardFooter></CardFooter>
            </Card>
          ) : (
            <p>No image available</p>
          )}
        </div>
      ))}
    </div>
  );
}
