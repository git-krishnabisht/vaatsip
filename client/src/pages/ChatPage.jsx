import { Button, Container, HStack, Input } from "@chakra-ui/react";
import { useStore } from "../services/useStore";
import { useParams } from "react-router-dom";
import { useState } from "react";

function ChatPage() {
  const { getuser, getMessages, sendMessage } = useStore();
  const [outgoingMessages, setOutgoingMessages] = useState({
    message: "",
    image_data: {},
    sender: "",
    receiver: "",
    created_at: "",
  });
  const receiver = useParams();
  // const messages = useStore((state) => state.messages);
  const user = useStore((state) => state.user);

  function handleGetMessages() {
    getMessages(receiver.username);
  }

  async function handleSendMessages() {
    const newMessage = {
      message: outgoingMessages.message,
      image_data: outgoingMessages.message,
      sender: user,
      receiver: receiver.username,
      created_at: new Date().toISOString(),
    };
    await sendMessage(newMessage, receiver.username);
    setOutgoingMessages({
      message: "",
      image_data: {},
      sender: "",
      receiver: "",
      created_at: "",
    });
  }

  return (
    <>
      <Container minWidth={"100vh"} maxWidth={"100vh"} padding={"2vh"}>
        <HStack>
          <Input
            placeholder="send message"
            value={outgoingMessages.message}
            onChange={(e) => {
              setOutgoingMessages({
                ...outgoingMessages,
                message: e.target.value,
              });
            }}
          />
          <Button onClick={handleSendMessages}> Send </Button>
        </HStack>
      </Container>
    </>
  );
}

export default ChatPage;
