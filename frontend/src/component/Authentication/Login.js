import React, { useState } from "react";
import {
  Box,
  Button,
  Flex,
  Image,
  Input,
  Stack,
  Text,
  useToast,
} from "@chakra-ui/react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { ChatState } from "../ContextApi/chatProvider";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
   const { setUser } = ChatState();
  const toast = useToast();
  const navigate = useNavigate();

  const submitHandler = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!email || !password) {
      toast({
        title: "Please fill all the fields",
        status: "warning",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
      setLoading(false);
      return;
    }

    try {
      const config = {
        headers: {
          "Content-Type": "application/json",
        },
      };

      const { data } = await axios.post(
        "/api/user/login",
        { email, password },
        config
      );

      toast({
        title: "Login Successful",
        status: "success",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
 
      localStorage.setItem("userInfo", JSON.stringify(data));
      setUser(data);
      navigate("/chat");
    } catch (error) {
      toast({
        title: "Error Occurred!",
        description:
          error.response?.data?.message || "Login failed",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Flex
      minH="100vh"
      align="center"
      justify="center"
     
    >
      <Box
        w="460px"
        p="10"
        borderRadius="3xl"
        bg="rgba(255,255,255,0.6)"
        backdropFilter="blur(25px)"
        boxShadow="0 30px 80px rgba(0,0,0,0.25)"
        border="1px solid rgba(255,255,255,0.35)"
      >
        <Flex justify="center" align="center" mb="8" gap="3">
          <Image src="/logo.png" alt="QuickChat Logo" boxSize="42px" />
          <Text
            fontFamily="Poppins, sans-serif"
            fontWeight="700"
            fontSize="28px"
            color="#6C63FF"
          >
            QuickChat
          </Text>
        </Flex>

        <Box
          as="form"
          onSubmit={submitHandler}
          bg="white"
          p="8"
          borderRadius="2xl"
          boxShadow="lg"
        >
          <Stack spacing="5">
            <Box>
              <Text mb="1" fontSize="sm" fontWeight="600" color="gray.700">
                Email
              </Text>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                size="lg"
                variant="filled"
                bg="gray.100"
              />
            </Box>

            <Box position="relative">
              <Text mb="1" fontSize="sm" fontWeight="600" color="gray.700">
                Password
              </Text>
              <Input
                required
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                size="lg"
                variant="filled"
                bg="gray.100"
                pr="70px"
              />
              <Text
                position="absolute"
                right="16px"
                top="38px"
                fontSize="sm"
                fontWeight="600"
                color="#6C63FF"
                cursor="pointer"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "Hide" : "Show"}
              </Text>
            </Box>

            <Button
              type="submit"
              mt="4"
              size="lg"
              borderRadius="full"
              bg="#6C63FF"
              color="white"
              fontWeight="700"
              isLoading={loading}
            >
              Login
            </Button>

            <Text mt="5" fontSize="sm" textAlign="center">
              Don&apos;t have an account?{" "}
              <Text
                as={Link}
                to="/signup"
                color="#6C63FF"
                fontWeight="600"
              >
                Sign up
              </Text>
            </Text>
          </Stack>
        </Box>
      </Box>
    </Flex>
  );
}

export default Login;
