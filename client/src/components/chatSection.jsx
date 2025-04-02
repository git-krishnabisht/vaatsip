import { Box, Text, Image, Flex } from "@chakra-ui/react";
import { useEffect, useRef } from "react";

function ChatSection({ messages, sender, receiver}) {
  const messagesEndRef = useRef(null);
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <Box height="100%" bg="gray.100" overflow="hidden">
      <Flex
        direction="column"
        justify="flex-end"
        p={4}
        pb={10}
        height="100%"
        overflowY="auto"
      >
        {messages.map((msg, index) => (
          <Box
            key={index}
            maxW="80%"
            alignSelf={msg.sender === sender ? "flex-end" : "flex-start"}
            bg={msg.sender === sender ? "gray.400" : "gray.300"}
            color="black"
            p={3}
            mb={2}
            borderRadius="lg"
            wordBreak="break-word"
          >
            <Text fontSize="sm" fontWeight="bold">
              {msg.sender === sender ? sender : receiver}
            </Text>
            {msg.image_data && (
              <Image
                src={msg.image_data}
                alt="Attached"
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
        <div ref={messagesEndRef} />
      </Flex>
    </Box>
  );
}

export default ChatSection;
