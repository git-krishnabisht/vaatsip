import { Box, Text, VStack, Image } from "@chakra-ui/react";
import { useEffect, useRef } from "react";

function ChatSection({ messages, currentUser }) {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <Box
      display="flex"
      flexDirection="column"
      height="calc(100vh - 60px)"
      bg="gray.100"
    >
      <VStack
        spacing={4}
        p={4}
        overflowY="auto"
        flex={1}
        alignItems="stretch"
      >
        {messages.map((msg, index) => (
          <Box
            key={index}
            maxW="80%"
            alignSelf={msg.sender === currentUser ? "flex-end" : "flex-start"}
            bg={msg.sender === currentUser ? "gray.400" : "gray.300"}
            color="black"
            p={3}
            borderRadius="lg"
          >
            <Text fontSize="sm" fontWeight="bold">
              {msg.sender === currentUser ? "You" : msg.sender}
            </Text>
            {msg.image_data && (
              <Image
                src={msg.image_data}
                alt="Attached image"
                borderRadius="md"
                maxW="100%"
                my={2}
              />
            )}
            <Text>{msg.message}</Text>
            <Text fontSize="xs" textAlign="right">
              {new Date(msg.created_at).toLocaleString()}
            </Text>
          </Box>
        ))}
        <div ref={messagesEndRef} style={{ paddingBottom: "20px" }} />
      </VStack>
    </Box>
  );
}

export default ChatSection;