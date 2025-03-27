import { Button, Container, HStack, Input } from "@chakra-ui/react";
import { useState } from "react";
import { useParams } from "react-router-dom";

function ChatPage() {
  const [outgoingMessages, setOutgoingMessages] = useState({
    message: "",
    image_data: {},
    sender: "",
    receiver: "",
    created_at: "",
  });
  const receiver = useParams();
  async function handleSendMessages() {
  }

  return (
    <>
      <Container>

      </Container>

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
          <Button onClick={handleSendMessages}>
            {" "}
            Send{" "}
          </Button>
        </HStack>
      </Container>
    </>
  );
}

export default ChatPage;
