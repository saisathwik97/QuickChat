import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  FormControl,
  Flex,
  Text,
  Avatar,
  IconButton,
  Stack,
  Image,
  Input,
  InputGroup,
  InputLeftElement,
  Checkbox,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  CloseButton,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  useToast,
  Spinner,
  MenuButton,
  Menu,
  MenuList,
  MenuItem,
  Tooltip,
} from "@chakra-ui/react";
import Lottie from "lottie-react";
import typingAnimation from "../animations/typing.json";
import axios from "axios";
import { SearchIcon, ArrowForwardIcon, AddIcon } from "@chakra-ui/icons";
import { ChatState } from "../component/ContextApi/chatProvider";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";


var socket, selectedChatCompare;

const Chat = () => {
  const Navigate = useNavigate();
  const { user, setUser, notifications, setNotifications } = ChatState();
  const toast = useToast();
  const logoutHandler = () => {
    localStorage.removeItem("userInfo");
    localStorage.removeItem("token");
    delete axios.defaults.headers.common["Authorization"];
    setUser(null);
    Navigate("/");
  };

  const [socketConnected, setSocketConnected] = useState(false);
  const [loggedUser, setLoggedUser] = useState(null);
  const [loadingChat, setLoadingChat] = useState(false);
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [groupName, setGroupName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [groupSearch, setGroupSearch] = useState("");
  const [groupSearchResult, setGroupSearchResult] = useState([]);
  const [typing, setTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [modalType, setModalType] = useState(null);
  const [groupChatName, setGroupChatName] = useState("");
  const [renameLoading, setRenameLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [searchResult, setSearchResult] = useState([]);
  const [loading, setLoading] = useState(false);

  const {
    isOpen: isUpdateOpen,
    onOpen: onUpdateOpen,
    onClose: onUpdateClose
  } = useDisclosure();

  const fetchChatsRef = useRef();
  const currentUserIdRef = useRef(null);

  useEffect(() => {
    if (!user || !user._id) return;

    if (currentUserIdRef.current === user._id) return;

    currentUserIdRef.current = user._id;

    socket = io();
    socket.emit("setup", user);
    socket.on("connected", () => {
      setSocketConnected(true);
      console.log("Socket connected");
    });
    socket.on("typing", () => setIsTyping(true));
    socket.on("stop typing", () => setIsTyping(false));

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [user]);

  const handleRemoveUserWithToast = async (u) => {
    await handleRemove(u);
    toast({
      title: "Member removed",
      description: `${u.username} was removed from the group`,
      status: "info",
      duration: 3000,
      isClosable: true,
    });
  };

  const otherUser = selectedChat?.users?.find(
    (u) => u._id !== user?._id
  );

  const fetchChats = async () => {
    if (!user) return;
    try {
      const config = {
        headers: { Authorization: `Bearer ${user.token}` },
      };
      const { data } = await axios.get("/api/chat", config);
      setChats(data);
    } catch (error) {
      toast({
        title: "Error Failed to Load the chats",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom-left",
      });
    }
  };

  useEffect(() => {
    fetchChatsRef.current = fetchChats;
  });
  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem("userInfo"));
    setLoggedUser(userInfo);
  }, []);

  useEffect(() => {
    if (user) {
      fetchChats();
    }
    // eslint-disable-next-line
  }, [user]);

  const handleRename = async () => {
    if (!groupChatName) return;
    try {
      setRenameLoading(true);
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.put("/api/chat/rename", {
        chatId: selectedChat._id,
        chatName: groupChatName,
      }, config);
      setSelectedChat(data);

      if (fetchChatsRef.current) {
        fetchChatsRef.current();
      }

      setRenameLoading(false);
    } catch (error) {
      toast({
        title: "Error Occurred!",
        description: error.response?.data?.message || "Failed to rename the group",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
      setRenameLoading(false);
    }
    setGroupChatName("");
  };

  const handleRemove = async (userToRemove) => {
    if (!userToRemove?._id || !selectedChat?._id) return;
    if (!selectedChat || !user) return;
    if (selectedChat.groupAdmin._id !== user._id && userToRemove._id !== user._id) {
      toast({
        title: "Only admins can remove someone!",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
      return;
    }

    try {
      setRenameLoading(true);
      const config = {
        headers: { Authorization: `Bearer ${user.token}` },
      };
      const { data } = await axios.put(
        "/api/chat/groupremove",
        {
          chatId: selectedChat._id,
          userId: userToRemove._id,
        },
        config
      );

      userToRemove._id === user._id ? setSelectedChat() : setSelectedChat(data);

      if (fetchChatsRef.current) {
        fetchChatsRef.current();
      }

      setRenameLoading(false);
    } catch (error) {
      toast({
        title: "Error Occurred!",
        description: error.response.data.message,
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
      setRenameLoading(false);
    }
  };

  const handleDeleteChat = async () => {
    if (!selectedChat?._id || !loggedUser?._id) return;
    if (!window.confirm("Are you sure? This will delete the chat for everyone.")) return;

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };

      await axios.delete("/api/chat/delete", {
        headers: { Authorization: `Bearer ${user.token}` },
        data: { chatId: selectedChat._id }, config
      });

      toast({
        title: "Chat Deleted Successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      setSelectedChat(null);

      if (fetchChatsRef.current) {
        fetchChatsRef.current();
      }

      setModalType(null);
    } catch (error) {
      toast({
        title: "Error Deleting Chat",
        description: error.response?.data?.message || "Something went wrong",
        status: "error",
        duration: 3000,
      });
    }
  };

  const fetchMessages = async () => {
    if (!selectedChat) return;

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };

      setLoadingMessages(true);

      const { data } = await axios.get(
        `/api/message/${selectedChat._id}`,
        config
      );

      setMessages(data);
      setLoadingMessages(false);
      socket.emit("join chat", selectedChat._id);
      selectedChatCompare = selectedChat;

    } catch (error) {
      toast({
        title: "Error Occured!",
        description: "Failed to Load the Messages",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
      setLoadingMessages(false);
    }
  };
  useEffect(() => {
    if (selectedChat) {
      fetchMessages();
    }
    // eslint-disable-next-line
  }, [selectedChat]);

  useEffect(() => {
    if (!socket) return;

    const handleMessageReceived = (newMessageRecieved) => {
      console.log("NEW MESSAGE ARRIVED:", newMessageRecieved);
      if (!selectedChatCompare || selectedChatCompare._id !== newMessageRecieved.chat._id) {
        if (!notifications.some((n) => n._id === newMessageRecieved._id)) {
          setNotifications((prev) => [newMessageRecieved, ...prev]);
          

          toast({
            title: "New Message",
            description: `You have received a new message from ${newMessageRecieved?.sender?.username || newMessageRecieved?.sender?.name || "Unknown User"}`,
            status: "info",
            duration: 5000,
            isClosable: true,
            position: "top-right",
          });

        }
      }


      if (selectedChatCompare && selectedChatCompare._id === newMessageRecieved.chat._id) {
        setMessages((prev) => [...prev, newMessageRecieved]);
      }

      setChats((prevChats) => {
        const updatedChats = [...prevChats];
        const index = updatedChats.findIndex((c) => c._id === newMessageRecieved.chat._id);

        if (index !== -1) {
          const chatToMove = {
            ...updatedChats[index],
            latestMessage: {
              ...newMessageRecieved,
              sender: {
                _id: newMessageRecieved.sender._id,
                username: newMessageRecieved.sender.username || newMessageRecieved.sender.name,
                name: newMessageRecieved.sender.name || newMessageRecieved.sender.username
              }
            }
          };
          updatedChats.splice(index, 1);
          updatedChats.unshift(chatToMove);
          return updatedChats;
        } else {
          if (fetchChatsRef.current) {
            fetchChatsRef.current();
          }
          return prevChats;
        }
      });
    };

    socket.on("message recieved", handleMessageReceived);

    return () => {
      socket.off("message recieved", handleMessageReceived);
    };
  }, [socketConnected, notifications, toast, user, setNotifications]);

  const sendMessage = async (event) => {
    if ((event.key === "Enter" || event.type === "click") && newMessage) {
      socket.emit("stop typing", selectedChat._id);

      const messageToSend = newMessage;
      setNewMessage("");

      try {
        const config = {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
        };

        const { data } = await axios.post(
          "/api/message",
          {
            content: messageToSend,
            chatId: selectedChat._id,
          },
          config
        );

        socket.emit("new message", data);

        setMessages((prevMessages) => [...prevMessages, data]);

        if (fetchChatsRef.current) {
          fetchChatsRef.current();
        }
      } catch (error) {
        toast({
          title: "Error Occured!",
          description: "Failed to send the Message",
          status: "error",
          duration: 5000,
          isClosable: true,
          position: "bottom",
        });
      }
    }
  };

  const typingHandler = (e) => {
    setNewMessage(e.target.value);

    if (!socket || !socketConnected || !selectedChat) return;

    if (!typing) {
      setTyping(true);
      socket.emit("typing", selectedChat._id);
    }

    let lastTypingTime = new Date().getTime();
    const timerLength = 3000;

    setTimeout(() => {
      const timeNow = new Date().getTime();
      if (timeNow - lastTypingTime >= timerLength && typing) {
        socket.emit("stop typing", selectedChat._id);
        setTyping(false);
      }
    }, timerLength);
  };

  const handleSearch = async (query) => {
    setSearch(query);
    if (!query) {
      setSearchResult([]);
      return;
    }

    try {
      setLoading(true);
      const config = {
        headers: { Authorization: `Bearer ${user.token}` },
      };
      const { data } = await axios.get(`/api/user?search=${query}`, config);
      setSearchResult(data);
      setLoading(false);
    } catch (error) {
      toast({
        title: "Error Occured!",
        description: "Failed to Load the Search Results",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom-left",
      });
      setLoading(false);
    }
  };

  const accessChat = async (userId) => {
    try {
      setLoadingChat(true);
      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
      };

      const { data } = await axios.post("/api/chat", { userId }, config);

      setChats((prevChats) => {
        if (!prevChats.find((c) => c._id === data._id)) {
          return [data, ...prevChats];
        }
        return prevChats;
      });

      setSelectedChat(data);
      setSearch("");
      setSearchResult([]);
      setLoadingChat(false);
    } catch (error) {
      toast({
        title: "Error fetching the chat",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom-left",
      });
      setLoadingChat(false);
    }
  };

  const getSender = (loggedUser, users) => {
    if (!users || users.length === 0) return "Unknown";
    return users[0]?._id === loggedUser?._id
      ? users[1]?.username || users[1]?.name || "Unknown"
      : users[0]?.username || users[0]?.name || "Unknown";
  };

  const getSenderPic = (loggedUser, users) => {
    if (!users || users.length === 0) return "";
    return users[0]?._id === loggedUser?._id ? users[1]?.pic : users[0]?.pic;
  };

  // const isSameSender = (messages, m, i, userId) => {
  //   if (!messages || !m || !m.sender) return false;
  //   return (
  //     i < messages.length - 1 &&
  //     (messages[i + 1]?.sender?._id !== m.sender._id ||
  //       messages[i + 1]?.sender?._id === undefined) &&
  //     messages[i]?.sender?._id !== userId
  //   );
  // };

  // const isLastMessage = (messages, i, userId) => {
  //   if (!messages || messages.length === 0) return false;
  //   return (
  //     i === messages.length - 1 &&
  //     messages[messages.length - 1]?.sender?._id !== userId &&
  //     messages[messages.length - 1]?.sender?._id
  //   );
  // };

  const toggleUser = (userObj) => {
    setSelectedUsers((prev) =>
      prev.find((u) => u._id === userObj._id)
        ? prev.filter((u) => u._id !== userObj._id)
        : [...prev, userObj]
    );
  };

  const searchUsersForGroup = async (query) => {
    setGroupSearch(query);
    if (!query) {
      setGroupSearchResult([]);
      return;
    }
    try {
      const { data } = await axios.get(`/api/user?search=${query}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setGroupSearchResult(data);
    } catch (error) {
      toast({
        title: "Error Occured!",
        description: "Failed to Load the Search Results",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom-left",
      });
    }
  };

  const createGroupHandler = async () => {
    if (!groupName || selectedUsers.length < 2) {
      toast({
        title: "Please fill all the feilds",
        status: "warning",
        duration: 5000,
        isClosable: true,
        position: "top",
      });
      return;
    }

    try {
      const config = {
        headers: { Authorization: `Bearer ${user.token}` },
      };

      const { data } = await axios.post(
        "/api/chat/group",
        {
          name: groupName,
          users: JSON.stringify(selectedUsers.map((u) => u._id)),
        },
        config
      );

      setChats((prevChats) => [data, ...prevChats]);
      setSelectedChat(data);
      onUpdateClose();
      setGroupName("");
      setSelectedUsers([]);
      setGroupSearch("");
      setGroupSearchResult([]);

      toast({
        title: "New Group Chat Created!",
        status: "success",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
    } catch (error) {
      toast({
        title: "Failed to Create the Chat!",
        description: error.response.data,
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
    }
  };
  if (!user) {
    return null;
  }

  return (
    <Flex minH="100vh" align="center" justify="center" p="6">
      <Box
        w="1400px"
        h="681px"
        bg="rgba(255,255,255,0.6)"
        backdropFilter="blur(25px)"
        borderRadius="3xl"
        boxShadow="0 30px 80px rgba(0,0,0,0.25)"
        border="1px solid rgba(255,255,255,0.35)"
        overflow="hidden"
        display="flex"
      >
        <Box w="28%" bg="white" p="4" display="flex" flexDirection="column">
          <Flex align="center" mb="6" justify="space-between">
            <Flex align="center" gap="3">
              <Image src="/logo.png" boxSize="36px" />
              <Text fontSize="xl" fontWeight="700" color="#6C63FF">
                QuickChat
              </Text>
            </Flex>
          </Flex>

          <InputGroup mb="4">
            <InputLeftElement pointerEvents="none">
              <SearchIcon color="gray.400" />
            </InputLeftElement>
            <Input
              placeholder="Search or start new chat"
              pl="40px"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </InputGroup>

          <Box flex="1" overflowY="auto">
            {loading ? (
              <Spinner ml="auto" mr="auto" display="block" />
            ) : (
              <Stack spacing="2">
                {search
                  ? searchResult.map((u) => (
                    <Flex
                      key={u._id}
                      align="center"
                      p="3"
                      borderRadius="xl"
                      bg="gray.50"
                      cursor="pointer"
                      _hover={{ bg: "#6C63FF", color: "white" }}
                      onClick={() => accessChat(u._id)}
                    >
                      <Avatar size="sm" mr="3" src={u.pic} />
                      <Box>
                        <Text fontWeight="600">{u.username}</Text>
                        <Text fontSize="xs">Click to start chat</Text>
                      </Box>
                    </Flex>
                  ))
                  : chats.map((chat) => {
                    if (!chat || !chat.users) return null;

                    return (
                      <Flex
                        key={chat._id}
                        align="center"
                        p="3"
                        borderRadius="xl"
                        bg={selectedChat === chat ? "#6C63FF" : "gray.50"}
                        color={selectedChat === chat ? "white" : "black"}
                        cursor="pointer"
                        _hover={{
                          bg: selectedChat === chat ? "#6C63FF" : "gray.200",
                        }}
                        onClick={() => setSelectedChat(chat)}
                      >
                        <Avatar
                          size="sm"
                          mr="3"
                          src={
                            !chat.isGroupChat && chat.users
                              ? getSenderPic(user, chat.users)
                              : ""
                          }
                        />
                        <Box>
                          <Text fontWeight="600">
                            {!chat.isGroupChat && chat.users
                              ? getSender(user, chat.users)
                              : chat.chatName || "Unknown"}
                          </Text>

                          <Text fontSize="sm">
                            {chat.latestMessage ? (
                              <Text as="span">
                                <b>
                                  {chat.latestMessage.sender?._id === user?._id
                                    ? "You"
                                    : chat.latestMessage.sender?.username ||
                                    chat.latestMessage.sender?.name ||
                                    (!chat.isGroupChat && chat.users ?
                                      (chat.users.find(u => u._id === chat.latestMessage.sender?._id)?.username ||
                                        chat.users.find(u => u._id === chat.latestMessage.sender?._id)?.name ||
                                        getSender(user, chat.users))
                                      : "Unknown")}
                                  : {" "}
                                </b>

                                {chat.latestMessage.content?.length > 50
                                  ? chat.latestMessage.content.substring(0, 51) + "..."
                                  : chat.latestMessage.content || ""}
                              </Text>
                            ) : (
                              "Click to start chat"
                            )}
                          </Text>
                        </Box>
                      </Flex>
                    );
                  })
                }
              </Stack>
            )}
          </Box>

          <Box pt="4" borderTop="1px solid" borderColor="gray.200" mt="2">
            <Flex align="center" justify="space-between">
              <Menu>
                <Tooltip label="Profile" placement="top" hasArrow>
                  <MenuButton>
                    <Avatar
                      size="sm"
                      src={user?.pic}
                      cursor="pointer"
                    />
                  </MenuButton>
                </Tooltip>

                <MenuList>
                  <MenuItem isDisabled fontWeight="600">
                    {user?.username}
                  </MenuItem>
                  <MenuItem onClick={logoutHandler}>Logout</MenuItem>
                </MenuList>
              </Menu>

              <Tooltip label="New Group" hasArrow placement="top">
                <IconButton
                  icon={<AddIcon />}
                  aria-label="Create Group"
                  size="md"
                  isRound
                  bg="#6C63FF"
                  color="white"
                  _hover={{ bg: "#554ee8" }}
                  onClick={onUpdateOpen}
                />
              </Tooltip>
            </Flex>
          </Box>
        </Box>

        <Flex w="72%" direction="column">
          {loadingChat ? (
            <Flex w="100%" h="100%" align="center" justify="center">
              <Spinner size="xl" w={20} h={20} />
            </Flex>
          ) : !selectedChat ? (
            <Flex flex="1" align="center" justify="center">
              <Flex direction="column" align="center" color="gray.400">
                <Image
                  src="/logo.png"
                  boxSize="140px"
                  mb="4"
                  opacity="0.75"
                />
                <Text fontSize="2xl" fontWeight="700" color="gray.600">
                  QuickChat
                </Text>

                <Text
                  fontSize="md"
                  mt="2"
                  color="gray.400"
                  textAlign="center"
                >
                  Select a chat to start messaging
                </Text>
              </Flex>
            </Flex>
          ) : (
            <>
              <Flex
                align="center"
                p="4"
                bg="rgba(255,255,255,0.85)"
                borderBottom="1px solid"
                borderColor="gray.200"
              >
                <Avatar
                  size="sm"
                  mr="3"
                  onClick={() => setModalType('group')}
                  cursor="pointer"
                  src={
                    !selectedChat.isGroupChat
                      ? getSenderPic(user, selectedChat.users)
                      : ""
                  }
                />
                <Text fontWeight="700" fontSize="lg">
                  {selectedChat.isGroupChat
                    ? selectedChat.chatName
                    : getSender(user, selectedChat.users)}
                </Text>
              </Flex>

              <Box flex="1" p="6" overflowY="scroll" bg="#f4f4f4">
                {loadingMessages ? (
                  <Flex w="100%" h="100%" align="center" justify="center">
                    <Spinner size="xl" w={20} h={20} />
                  </Flex>
                ) : (
                  <Flex direction="column">
                    {messages &&
                      messages.map((m, i) => {
                        if (!m || !m.sender) return null;

                        return (
                          <Flex
                            key={m._id}
                            justifyContent={
                              m.sender._id === user._id ? "flex-end" : "flex-start"
                            }
                            mb="4"
                          >
                            {m.sender._id !== user._id && (
                              <Tooltip
                                label={m.sender.name || m.sender.username}
                                placement="bottom-start"
                                hasArrow
                              >
                                <Avatar
                                  mt="7px"
                                  mr={1}
                                  size="sm"
                                  cursor="pointer"
                                  name={m.sender.name || m.sender.username}
                                  src={m.sender.pic}
                                />
                              </Tooltip>
                            )}

                            <Box
                              width="fit-content"
                              display="inline-block"
                              bg={m.sender._id === user._id ? "#6C63FF" : "#e0e0e0"}
                              color={m.sender._id === user._id ? "white" : "black"}
                              borderRadius="20px"
                              px="15px"
                              py="5px"
                              maxW="75%"
                            >
                              <Text fontSize="md">{m.content}</Text>
                            </Box>

                            {m.sender._id === user._id && (
                              <Avatar
                                size="sm"
                                name={user.name || user.username}
                                src={user.pic}
                                ml={2}
                                mt="7px"
                              />
                            )}
                          </Flex>
                        );
                      })}
                  </Flex>
                )}
              </Box>

              {isTyping ? (
                <Box bg="#f4f4f4" pl="4" pb="2">
                  <Lottie
                    animationData={typingAnimation}
                    style={{ width: 70, height: 40 }}
                    loop
                  />
                </Box>
              ) : (<></>)}

              <Flex p="4" bg="white" align="center" gap="3">
                <Input
                  placeholder="Type a message..."
                  size="lg"
                  bg="gray.100"
                  onChange={typingHandler}
                  value={newMessage}
                  onKeyDown={sendMessage}
                />
                <IconButton
                  icon={<ArrowForwardIcon />}
                  isRound
                  bg="#6C63FF"
                  color="white"
                  aria-label="Send"
                  _hover={{ bg: "#554ee8" }}
                  onClick={sendMessage}
                />
              </Flex>
            </>
          )}
        </Flex>
      </Box>

      <Modal
        isOpen={modalType !== null}
        onClose={() => setModalType(null)}
        isCentered
      >
        <ModalOverlay />
        <ModalContent borderRadius="xl">
          {modalType === "profile" ? (
            <>
              <ModalHeader textAlign="center" fontWeight="600">
                User Profile
              </ModalHeader>
              <ModalCloseButton />
              <ModalBody>
              </ModalBody>
            </>
          ) : (
            <>
              <ModalHeader
                display="flex"
                flexDir="column"
                alignItems="center"
                gap={2}
              >

                <Avatar
                  size="lg"
                  name={
                    selectedChat?.isGroupChat
                      ? selectedChat.chatName
                      : otherUser?.username
                  }
                  src={
                    selectedChat?.isGroupChat
                      ? selectedChat?.groupPic
                      : otherUser?.pic
                  }
                />


                <Text
                  fontSize="26px"
                  fontWeight="600"
                  textAlign="center"
                >
                  {selectedChat?.isGroupChat
                    ? selectedChat.chatName
                    : otherUser?.username}
                </Text>
              </ModalHeader>



              <ModalCloseButton />

              <ModalBody display="flex" flexDir="column" alignItems="center">
                {selectedChat?.isGroupChat && (
                  <Box
                    w="100%"
                    display="flex"
                    flexWrap="wrap"
                    gap={2}
                    pb={4}
                    justifyContent="center"
                  >
                    {selectedChat?.users?.map((u) => (
                      <Box
                        key={u._id}
                        px={3}
                        py={1}
                        borderRadius="full"
                        bg="purple.500"
                        color="white"
                        display="flex"
                        alignItems="center"
                        gap={2}
                        fontSize="sm"
                      >
                        <Text fontWeight="medium">
                          {u.name || u.username}
                        </Text>

                        {selectedChat?.groupAdmin?._id === user?._id && (
                          <CloseButton
                            size="sm"
                            onClick={() => handleRemoveUserWithToast(u)}
                            _hover={{ bg: "red.500" }}
                          />
                        )}
                      </Box>
                    ))}
                  </Box>
                )}

                {selectedChat?.isGroupChat &&
                  selectedChat?.groupAdmin?._id === user?._id && (
                    <FormControl display="flex" gap={2}>
                      <Input
                        placeholder="Rename Group"
                        value={groupChatName}
                        onChange={(e) => setGroupChatName(e.target.value)}
                      />
                      <Button
                        colorScheme="blue"
                        isLoading={renameLoading}
                        onClick={async () => {
                          await handleRename();
                          toast({
                            title: "Group renamed",
                            description: `Renamed to "${groupChatName}"`,
                            status: "success",
                            duration: 3000,
                            isClosable: true,
                          });
                        }}
                      >
                        Update
                      </Button>
                    </FormControl>
                  )}
              </ModalBody>

              <ModalFooter justifyContent="center">
                {selectedChat?.isGroupChat && (
                  <Button
                    colorScheme="red"
                    variant="outline"
                    isLoading={loading}
                    onClick={async () => {
                      setLoading(true);
                      try {
                        if (selectedChat?.groupAdmin?._id === user?._id) {
                          await handleDeleteChat();
                          toast({
                            title: "Group deleted",
                            status: "error",
                            duration: 3000,
                            isClosable: true,
                          });
                        } else {
                          await handleRemove(user);
                          toast({
                            title: "Left group",
                            description: "You have left the group",
                            status: "info",
                            duration: 3000,
                            isClosable: true,
                          });
                        }
                      } finally {
                        setLoading(false);
                      }
                    }}
                  >
                    {selectedChat?.groupAdmin?._id === user?._id
                      ? "Delete Group"
                      : "Leave Group"}
                  </Button>
                )}

                {!selectedChat?.isGroupChat && (
                  <Button
                    colorScheme="red"
                    variant="outline"
                    isLoading={loading}
                    onClick={async () => {
                      await handleDeleteChat();
                      toast({
                        title: "Chat left",
                        description: "You left the conversation",
                        status: "info",
                        duration: 3000,
                        isClosable: true,
                      });
                    }}
                  >
                    Leave Chat
                  </Button>
                )}
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      <Modal isOpen={isUpdateOpen} onClose={onUpdateClose} size="lg" isCentered>
        <ModalOverlay />
        <ModalContent borderRadius="2xl">
          <ModalHeader>Create Group</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Input
              placeholder="Group Name"
              mb="4"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
            <Input
              placeholder="Search users to add..."
              mb="3"
              value={groupSearch}
              onChange={(e) => searchUsersForGroup(e.target.value)}
            />
            <Stack maxH="200px" overflowY="auto">
              {groupSearchResult.slice(0, 4).map((u) => (
                <Checkbox
                  key={u._id}
                  isChecked={selectedUsers.some((su) => su._id === u._id)}
                  onChange={() => toggleUser(u)}
                  colorScheme="purple"
                >
                  {u.username}
                </Checkbox>
              ))}
            </Stack>
          </ModalBody>

          <ModalFooter>
            <Button
              bg="#6C63FF"
              color="white"
              mr="4"
              _hover={{ bg: "#554ee8" }}
              onClick={createGroupHandler}
              isDisabled={!groupName || selectedUsers.length < 2}
            >
              Create Group
            </Button>

            <Button variant="ghost" onClick={onUpdateClose}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Flex>
  );
};

export default Chat;