import { Box, Button, Container, Flex, HStack, Input } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { socketService } from "../services/socketService";
import { useParams } from "react-router-dom";
import { authService } from "../services/authService";
import ChatSection from "../components/ui/chatSection";

function ChatPage() {
  const {
    sendmessage,
    unsubscribeFromMessages,
    subscribeToMessages,
    getmessages,
  } = socketService();
  const { username: receiver } = useParams();
  const messages = socketService((state) => state.messages);
  const currentUser = authService((state) => state.user);

  const [outgoingMessages, setOutgoingMessages] = useState({
    message: "",
    image_data: {},
    sender: "",
    receiver: "",
    created_at: "",
  });

  async function handleSendMessages(e) {
    if (!outgoingMessages.message && !outgoingMessages.image_data) return;
    sendmessage(outgoingMessages, receiver);
    setOutgoingMessages({
      message: "",
      image_data: {},
      sender: "",
      receiver: "",
      created_at: "",
    });
  }

  function handleFileChange(e) {
    const file = e.target.files[0];
    setOutgoingMessages((prev) => ({
      ...prev,
      image_data: file,
    }));
  }

  useEffect(() => {
    subscribeToMessages(receiver);
    getmessages(receiver);
    return () => unsubscribeFromMessages();
  }, [getmessages, receiver, subscribeToMessages, unsubscribeFromMessages]);

  return (
    <>
        <ChatSection messages={messages} currentUser={currentUser} />
        <Container
          padding="2vh"
          position="fixed"
          bottom={0}
          left={0}
          right={0}
          zIndex={1000}
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
            <Input
              as={"button"}
              type="file"
              onChange={handleFileChange}
              width={"20rem"}
            />
            <Button onClick={handleSendMessages}> Send </Button>
          </HStack>
        </Container>
    </>
  );
}

export default ChatPage;
