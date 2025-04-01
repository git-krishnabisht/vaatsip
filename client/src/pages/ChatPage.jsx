import { Button, Container, HStack, Input } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { socketService } from "../services/socketService";
import { useParams } from "react-router-dom"

function ChatPage() {
  const { sendmessage, unsubscribeFromMessages, subscribeToMessages, getmessages } = socketService();
  const { username: receiver}  = useParams();

  const [outgoingMessages, setOutgoingMessages] = useState({
    message: "",
    image_data: {},
    sender: "",
    receiver: "",
    created_at: "",
  });

  async function handleSendMessages() {
    sendmessage(outgoingMessages, receiver);
    setOutgoingMessages({
      message: "",
      image_data: {},
      sender: "",
      receiver: "",
      created_at: "",
    });
  }

  useEffect(() => {
    subscribeToMessages(receiver);
    getmessages(receiver);
    return () => unsubscribeFromMessages();
  }, [getmessages, receiver, subscribeToMessages]);

  return (
    <>
      <Container
        padding="2vh"
        position="fixed"
        bottom={0}
        left={0}
        right={0}
        zIndex={10}
        bg="white"
        boxShadow="md"
        maxWidth={"100%"}
      >
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
