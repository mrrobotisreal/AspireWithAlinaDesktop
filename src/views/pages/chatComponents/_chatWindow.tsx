import { FC, useEffect, useRef, useState } from "react";
import { useIntl } from "react-intl";
import {
  Avatar,
  Box,
  Chip,
  IconButton,
  Paper,
  Stack,
  TextField,
} from "@mui/material";
import {
  AttachFileTwoTone,
  Done,
  DoneAll,
  Mic,
  MicOff,
  PlayCircleTwoTone,
  Send,
  StopCircleTwoTone,
} from "@mui/icons-material";

import { useStudentContext } from "../../../context/studentContext";
import { useThemeContext } from "../../../context/themeContext";
import { ChatMessage } from "../../../hooks/useChat";
import CircularLoading from "../../loading/circular";
import Text from "../../text/text";

interface ChatWindowProps {
  selectedChat: string | null;
  messages: ChatMessage[];
  messagesAreLoading: boolean;
  name: string;
  textMessage: string;
  handleTextMessageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isImageUploaded: boolean;
  thumbnailUrl: string | null;
  handleClickAttach: () => void;
  handleRemoveAttachment: () => void;
  isRecording: boolean;
  handleStartRecording: () => void;
  handleStopRecording: () => void;
  handleDeleteRecording: () => void;
  audioURL: string | null;
  audioRef: React.RefObject<HTMLAudioElement>;
  isPlayingAudio: boolean;
  handlePlayAudio: () => void;
  handleStopAudio: () => void;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  handleClickSend: () => void;
}

const ChatWindow: FC<ChatWindowProps> = ({
  selectedChat,
  messages,
  messagesAreLoading,
  name,
  textMessage,
  handleTextMessageChange,
  isImageUploaded,
  thumbnailUrl,
  handleClickAttach,
  handleRemoveAttachment,
  isRecording,
  handleStartRecording,
  handleStopRecording,
  handleDeleteRecording,
  audioURL,
  audioRef,
  isPlayingAudio,
  handlePlayAudio,
  handleStopAudio,
  canvasRef,
  handleClickSend,
}) => {
  const intl = useIntl();
  const msgContainerRef = useRef<HTMLDivElement>(null);
  const { theme, regularFont } = useThemeContext();
  const { info } = useStudentContext();
  const allMessages = messages || [];
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState<boolean>(true);

  const scrollToBottom = () => {
    if (msgContainerRef.current && isAutoScrollEnabled) {
      const lastMessage = msgContainerRef.current.lastElementChild;
      if (lastMessage) {
        lastMessage.scrollIntoView({
          block: "end",
          behavior: "smooth",
        });
      }
    }
  };

  const handleScroll = () => {
    if (msgContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = msgContainerRef.current;
      const isAtBottom = scrollHeight - (scrollTop + clientHeight) < 50;
      setIsAutoScrollEnabled(isAtBottom);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [allMessages]);

  const AudioCanvas = (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100px",
        gap: "10px",
        flexGrow: 1,
        backgroundColor: "#f3f4f6",
        borderRadius: "6px",
      }}
    >
      <canvas
        style={{
          flexGrow: 1,
          width: "100%",
          height: "100%",
          display: "block",
          borderRadius: "6px",
        }}
        ref={canvasRef}
      ></canvas>
      <audio ref={audioRef} src={audioURL || ""} />
    </Box>
  );

  const messagesComponents = messagesAreLoading ? (
    <CircularLoading />
  ) : (
    <Box
      component="div"
      ref={msgContainerRef}
      onScroll={handleScroll}
      sx={{ display: "flex", flexDirection: "column" }}
    >
      {allMessages.map((msg, index) => {
        const date = new Date(msg.timestamp);
        const isUser = msg.sender.userId === info.student_id!;
        const displayReceived = isUser && !msg.isRead && msg.isReceived;
        const displayRead = isUser && msg.isRead && msg.isReceived;
        return (
          <Box
            key={index}
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems:
                msg.sender.userId === info.student_id
                  ? "flex-end"
                  : "flex-start",
              mb: 1,
              width: "100%",
            }}
          >
            <Paper
              sx={{
                p: 1,
                borderRadius: "6px",
                maxWidth: "50%",
                backgroundColor:
                  msg.sender.userId === info.student_id
                    ? theme.palette.background.default
                    : theme.palette.primary.light,
              }}
            >
              <Text fontFamily={regularFont}>
                <strong>{msg.sender.preferredName}:</strong>
              </Text>
              {msg.thumbnailUrl && msg.imageUrl && (
                <Box onClick={() => console.log("Image clicked!")}>
                  <img
                    src={msg.thumbnailUrl}
                    alt="thumbnail"
                    style={{ width: "100%" }}
                  />
                </Box>
              )}
              {msg.audioUrl && (
                <Box>
                  <audio controls src={msg.audioUrl} />
                </Box>
              )}
              <Text fontFamily={regularFont}>{msg.content}</Text>
              <Stack
                direction="row"
                // spacing={0.5}
                sx={{ justifyContent: "space-between" }}
              >
                <Text
                  fontFamily={regularFont}
                  variant="caption"
                  color="textSecondary"
                >
                  {`${date.toLocaleDateString()} ${date.toLocaleTimeString()}`}
                </Text>
                {displayReceived ? (
                  <Done sx={{ color: "limegreen" }} />
                ) : displayRead ? (
                  <DoneAll sx={{ color: "limegreen" }} />
                ) : isUser ? (
                  <Done sx={{ color: "InactiveCaptionText" }} />
                ) : null}
              </Stack>
            </Paper>
          </Box>
        );
      })}
    </Box>
  );
  const chatIsSelected = Boolean(selectedChat);
  const sendIsDisabled = !Boolean(selectedChat) || !textMessage;
  const isTexting = textMessage.length > 0;

  return (
    <Box sx={{ pl: 2, pt: 1, pb: 1 }}>
      <Box
        sx={{
          backgroundColor: theme.palette.primary.dark,
          borderTopLeftRadius: "6px",
          borderTopRightRadius: "6px",
        }}
      >
        <Text
          variant="h6"
          fontFamily={regularFont}
          fontWeight="bold"
          textAlign="center"
          sx={{ color: theme.palette.primary.contrastText }}
        >
          {name || intl.formatMessage({ id: "chat_recentChats" })}
        </Text>
      </Box>
      <Paper
        sx={{
          flex: 1,
          p: 2,
          height: "74vh",
          overflowY: "auto",
          width: "100%",
          backgroundColor: "#f7f7f7",
          display: messagesAreLoading ? "flex" : "block",
          justifyContent: messagesAreLoading ? "center" : "normal",
          alignContent: messagesAreLoading ? "center" : "normal",
        }}
      >
        {allMessages.length ? (
          messagesComponents
        ) : (
          <Text fontFamily={regularFont} color="textSecondary" align="center">
            {intl.formatMessage({ id: "chat_chatWindowDescription" })}
          </Text>
        )}
      </Paper>
      <Box
        sx={{
          p: 2,
          display: "flex",
          alignItems: "center",
          border: "1px solid #ddd",
          borderBottomLeftRadius: "6px",
          borderBottomRightRadius: "6px",
          backgroundColor: theme.palette.primary.dark,
        }}
      >
        <IconButton disabled={!chatIsSelected} onClick={handleClickAttach}>
          <AttachFileTwoTone
            sx={{
              color: !chatIsSelected
                ? "InactiveCaptionText"
                : theme.palette.secondary.light,
            }}
          />
        </IconButton>
        <Stack direction="column" sx={{ flex: 1, mr: 1, ml: 1 }}>
          {!isRecording && audioURL && !isTexting && (
            <>
              {/* <Box sx={{ flexGrow: 1, backgroundColor: "black" }}>
                <canvas style={{ flexGrow: 1 }} ref={canvasRef}></canvas>
                <audio ref={audioRef} />
              </Box> */}
              {AudioCanvas}
              <Stack direction="row" spacing={2}>
                <Chip
                  label={
                    "..." +
                    audioURL.slice(audioURL.length - 11, audioURL.length - 1)
                  }
                  variant="outlined"
                  sx={{
                    fontFamily: regularFont,
                    color: theme.palette.text.primary,
                    backgroundColor: theme.palette.primary.light,
                  }}
                  onDelete={handleDeleteRecording}
                />
              </Stack>
            </>
          )}
          {!isRecording && !audioURL && (
            <TextField
              variant="outlined"
              fullWidth
              size="small"
              multiline
              maxRows={4}
              label={
                <Text variant="caption" fontFamily={regularFont}>
                  {intl.formatMessage({ id: "chat_messagePlaceholder" })}
                </Text>
              }
              sx={{
                backgroundColor: theme.palette.background.default,
                borderRadius: "6px",
                fontFamily: regularFont,
                color: theme.palette.text.primary,
              }}
              disabled={!chatIsSelected}
              value={textMessage}
              onChange={handleTextMessageChange}
            />
          )}
          {isRecording && !audioURL && !isTexting && AudioCanvas}
          {isImageUploaded && thumbnailUrl && (
            <Stack
              direction="row"
              sx={{ justifyContent: "flex-start" }}
              spacing={2}
            >
              <Chip
                label={
                  "..." +
                  thumbnailUrl.slice(
                    thumbnailUrl.length - 11,
                    thumbnailUrl.length - 1
                  )
                }
                variant="outlined"
                sx={{
                  fontFamily: regularFont,
                  color: theme.palette.text.primary,
                  backgroundColor: theme.palette.primary.light,
                }}
                avatar={<Avatar src={thumbnailUrl} alt="thumbnail" />}
                onDelete={handleRemoveAttachment}
              />
            </Stack>
          )}
        </Stack>
        {isTexting && !audioURL && !isRecording && (
          <IconButton onClick={handleClickSend}>
            <Send
              sx={{
                color: theme.palette.secondary.light,
              }}
            />
          </IconButton>
        )}
        {audioURL && !isRecording && !isTexting && (
          <Stack direction="row" spacing={2}>
            {isPlayingAudio ? (
              <IconButton onClick={handleStopAudio}>
                <StopCircleTwoTone
                  sx={{
                    color: theme.palette.secondary.light,
                  }}
                />
              </IconButton>
            ) : (
              <IconButton onClick={handlePlayAudio}>
                <PlayCircleTwoTone
                  sx={{
                    color: theme.palette.secondary.light,
                  }}
                />
              </IconButton>
            )}
            <IconButton onClick={handleClickSend}>
              <Send
                sx={{
                  color: theme.palette.secondary.light,
                }}
              />
            </IconButton>
          </Stack>
        )}
        {!audioURL && !isTexting && !isRecording && (
          <IconButton onClick={handleStartRecording}>
            <Mic
              sx={{
                color: theme.palette.secondary.light,
              }}
            />
          </IconButton>
        )}
        {isRecording && !isTexting && !audioURL && (
          <IconButton onClick={handleStopRecording}>
            <MicOff
              sx={{
                color: theme.palette.secondary.light,
              }}
            />
          </IconButton>
        )}
      </Box>
    </Box>
  );
};

export default ChatWindow;
