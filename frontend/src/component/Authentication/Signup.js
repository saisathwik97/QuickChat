import React, { useState } from "react";
import {
  Box,
  Button,
  Flex,
  Image,
  Input,
  Stack,
  Text,
} from "@chakra-ui/react";
import { Link } from "react-router-dom";
import { useToast } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";

import axios from "axios";
const Signup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [Loding, setLoading] = useState(false);
  const toast=useToast();
  const history=useNavigate()
  const BASE_URL = "https://quickchat-production-2f01.up.railway.app";

  const SubmitHandler=async()=>{
    setLoading(true);
    if(!name || !email || !password || !confirmPassword){
      toast({
        title:"Please fill all the fields",
        status:"warning",
        duration:5000,
        isClosable:true,
        position:"bottom",
      });
      setLoading(false);
      return; 
  }
    if(password!==confirmPassword){
      toast({
        title:"Passwords do not match",
        status:"warning",
        duration:5000,
        isClosable:true,
        position:"bottom",
      });
      setLoading(false);
      return; 
    }
    try{
      const config={
        headers:{
          "Content-type":"application/json",
        },
      };  
      const {data}=await axios.post(`${BASE_URL}/api/user/register`,{
        username:name,
        email,
        password,
        pic:profileImage,
      },config);
      console.log(data);
      toast({
        title:"Registration Successful",
        status:"success",
        duration:5000,
        isClosable:true,  
        position:"bottom",
      });
      localStorage.setItem("userInfo",JSON.stringify(data));
      history("/Login");
      setLoading(false);
    }catch(error){
      toast({
        title:"Error Occurred!",
        description:error.response.data.message,
        status:"error",
        duration:5000,
        isClosable:true,
        position:"bottom",
      });
      setLoading(false);
    }
  };
  const setupProfileImage = (e) => {
    setLoading(true);
    if(e===undefined){
      toast({
        title:"Please select an image",
        status:"warning",
        duration:5000,
        isClosable:true,
        position:"bottom",
      });
      return;
    }
    if (e.type === "image/jpeg" || e.type === "image/png") {
      const data = new FormData();
      data.append("file", e);
      data.append("upload_preset", "QuickChat");
      data.append("cloud_name", "dyitc8etp");
      fetch("https://api.cloudinary.com/v1_1/dyitc8etp/image/upload", {
        method: "post",
        body: data, 
      })
        .then((res) => res.json())
        .then((data) => {
          setProfileImage(data.url.toString());
          setLoading(false);
        })
        .catch((err) => {
          console.log(err);
          setLoading(false);
        }); 
    } else {
      toast({
        title:"Please select a valid image",
        status:"warning",
        duration:5000,
        isClosable:true,
        position:"bottom",
      });
      setLoading(false);
      return; 

    }}
  const handleSignup = (e) => {
    e.preventDefault();
    console.log({
      name,
      email,
      password,
      confirmPassword,
      profileImage,
    });
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
          onSubmit={handleSignup}
          bg="white"
          p="8"
          borderRadius="2xl"
          boxShadow="lg"
        >
          <Stack spacing="5">
            <Box>
              <Text mb="1" fontSize="sm" fontWeight="600" color="gray.700">
                Name
              </Text>
              <Input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full Name"
                size="lg"
                variant="filled"
                bg="gray.100"
                color="gray.800"
                caretColor="#6C63FF"
              />
            </Box>

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
                color="gray.800"
                caretColor="#6C63FF"
              />
            </Box>

            <Box position="relative">
              <Text mb="1" fontSize="sm" fontWeight="600" color="gray.700">
                Set Password
              </Text>
              <Input
                required
                minLength={6}
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Set password"
                size="lg"
                variant="filled"
                bg="gray.100"
                color="gray.800"
                caretColor="#6C63FF"
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

            <Box position="relative">
              <Text mb="1" fontSize="sm" fontWeight="600" color="gray.700">
                Confirm Password
              </Text>
              <Input
                required
                minLength={6}
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                size="lg"
                variant="filled"
                bg="gray.100"
                color="gray.800"
                caretColor="#6C63FF"
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
                onClick={() =>
                  setShowConfirmPassword(!showConfirmPassword)
                }
              >
                {showConfirmPassword ? "Hide" : "Show"}
              </Text>
            </Box>

            <Box>
              <Text mb="1" fontSize="sm" fontWeight="600" color="gray.700">
                Profile Image (optional)
              </Text>
              <Input
                type="file"
                accept="image/*"
                size="lg"
                variant="filled"
                bg="gray.100"
                onChange={(e) => setupProfileImage(e.target.files[0])}
              />
            </Box>

            <Button
              type="submit"
              mt="4"
              size="lg"
              borderRadius="full"
              bg="#6C63FF"
              color="white"
              fontWeight="700"
              transition="all 0.2s ease"
              _hover={{
                transform: "translateY(-3px) scale(1.03)",
                boxShadow: "0 15px 35px rgba(108,99,255,0.6)",
              }}
              _active={{ transform: "scale(0.97)" }}
              isLoading={Loding}
              onClick={SubmitHandler}
            >
              Sign up
            </Button>
          </Stack>

          <Text mt="5" fontSize="sm" textAlign="center" color="gray.600">
            Already have an account?{" "}
            <Text
              as={Link}
              to="/login"
              color="#6C63FF"
              fontWeight="600"
              cursor="pointer"
            >
              Login
            </Text>
          </Text>
        </Box>
      </Box>
    </Flex>
  );
};  

export default Signup;
