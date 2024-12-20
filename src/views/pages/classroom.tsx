import React, { FC, useState, useRef, useEffect } from "react";
import { useIntl } from "react-intl";

import { VIDEO_SERVER_URL } from "../../constants/urls";
import { useStudentContext } from "../../context/studentContext";
import useClassroomSocket from "../../hooks/useClassroomSocket";
import Layout from "../layout/layout";

import Controls from "./classroomComponents/controls";
import ScreenShareDialog from "./classroomComponents/screenShareDialog";
import Videos from "./classroomComponents/videos";
import Classes from "./classroomComponents/classes";

const url = `${VIDEO_SERVER_URL}/classroom?type=student&room=123`;

const Classroom: FC = () => {
  const intl = useIntl();
  const { getInfo, updateInfo } = useStudentContext();
  const { sendMessage, peerConnection } = useClassroomSocket({
    url,
  });
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStream = useRef<MediaStream | null>(null);
  const [activeVideoTrack, setActiveVideoTrack] =
    useState<MediaStreamTrack | null>(null);
  const [activeAudioTrack, setActiveAudioTrack] =
    useState<MediaStreamTrack | null>(null);
  const [isRemoteStreamActive, setIsRemoteStreamActive] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedAudioDeviceLabel, setSelectedAudioDeviceLabel] =
    useState("Default");
  const [selectedAudioDeviceID, setSelectedAudioDeviceID] = useState("");
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedVideoDeviceLabel, setSelectedVideoDeviceLabel] =
    useState("Default");
  const [selectedVideoDeviceID, setSelectedVideoDeviceID] = useState("");
  const [areScreenShareOptionsOpen, setAreScreenShareOptionsOpen] =
    useState(false);
  const [screenShareOptions, setScreenShareOptions] = useState<
    Electron.DesktopCapturerSource[]
  >([]);
  const [isSharingScreen, setIsSharingScreen] = useState(false);
  const [callSettingsAnchorEl, setCallSettingsAnchorEl] =
    useState<null | HTMLElement>(null);
  const [callSettingsMenuIsOpen, setCallSettingsMenuIsOpen] = useState(false);
  const [isCallStarted, setIsCallStarted] = useState(false);
  const [isInClassroom, setIsInClassroom] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      sendMessage(JSON.stringify({ type: "candidate", data: event.candidate }));
    }
  };

  peerConnection.ontrack = (event) => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = event.streams[0];
    }
    setIsRemoteStreamActive(true);
  };
  peerConnection.onconnectionstatechange = () => {
    if (peerConnection.connectionState === "disconnected") {
      setIsRemoteStreamActive(false);
    }
  };

  const handleOpenCallSettingsMenu = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    setCallSettingsAnchorEl(event.currentTarget);
    setCallSettingsMenuIsOpen(true);
  };
  const handleCloseCallSettingsMenu = () => {
    setCallSettingsMenuIsOpen(false);
    setCallSettingsAnchorEl(null);
  };

  const toggleVideo = () => {
    if (activeVideoTrack) {
      activeVideoTrack.enabled = !activeVideoTrack.enabled;
      setIsVideoOn(activeVideoTrack.enabled);
    }
  };
  const toggleAudio = () => {
    if (activeAudioTrack) {
      activeAudioTrack.enabled = !activeAudioTrack.enabled;
      setIsMicOn(activeAudioTrack.enabled);
    }
  };

  const startScreenShare = async (source: Electron.DesktopCapturerSource) => {
    try {
      const videoConstraints: MediaTrackConstraints = {
        // @ts-ignore
        mandatory: {
          chromeMediaSource: "desktop",
          chromeMediaSourceId: source.id,
        },
      };
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: videoConstraints,
      });
      const videoTrack = stream.getVideoTracks()[0];
      setActiveVideoTrack(videoTrack);

      const senders = peerConnection.getSenders();
      const videoSender = senders.find(
        (sender) => sender.track?.kind === "video"
      );

      if (videoSender) {
        videoSender.replaceTrack(videoTrack);
      } else {
        peerConnection.addTrack(videoTrack, stream);
      }

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      videoTrack.onended = () => {
        stopScreenShare();
      };
    } catch (error) {
      console.error("Error starting screen share: ", error);
    }
  };
  const stopScreenShare = async () => {
    try {
      const cameraStream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: selectedVideoDeviceID } },
        audio: { deviceId: { exact: selectedAudioDeviceID } },
      });
      const cameraTrack = cameraStream.getVideoTracks()[0];
      setActiveVideoTrack(cameraTrack);

      const senders = peerConnection.getSenders();
      const sender = senders.find((sender) => sender.track?.kind === "video");
      if (sender) {
        await sender.replaceTrack(cameraTrack);
      }

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = cameraStream;
      }
    } catch (error) {
      console.error("Error stopping screen share: ", error);
    }
  };

  const handleOpenScreenShareOptions = async () => {
    if (isSharingScreen) {
      await stopScreenShare();
      setIsSharingScreen(false);
    } else {
      const options = await window.electronAPI.getMediaSources();
      setScreenShareOptions(options || []);
      setAreScreenShareOptionsOpen(true);
    }
  };
  const handleCloseScreenShareOptions = () => {
    setAreScreenShareOptionsOpen(false);
  };
  const handleSelectScreenShareSource = async (
    source: Electron.DesktopCapturerSource
  ) => {
    await startScreenShare(source);
    setIsSharingScreen(true);
    setAreScreenShareOptionsOpen(false);
  };

  const handleSelectVideoDevice = async (deviceId: string, label: string) => {
    try {
      const constraints = {
        video: { deviceId: { exact: deviceId } },
        audio: { deviceId: { exact: selectedAudioDeviceID } },
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      const videoTrack = stream.getVideoTracks()[0];
      setActiveVideoTrack(videoTrack);
      setSelectedVideoDeviceID(deviceId);
      setSelectedVideoDeviceLabel(label);
    } catch (error) {
      console.error(
        "Error starting video stream with the selected device: ", // TODO: localize
        error
      );
    }
  };
  const handleSelectAudioDevice = async (deviceId: string, label: string) => {
    try {
      const constraints = {
        video: { deviceId: { exact: selectedVideoDeviceID } },
        audio: { deviceId: { exact: deviceId } },
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      const audioTrack = stream.getAudioTracks()[0];
      setActiveAudioTrack(audioTrack);
      setSelectedAudioDeviceID(deviceId);
      setSelectedAudioDeviceLabel(label);
    } catch (error) {
      console.error(
        "Error starting audio stream with the selected device: ", // TODO: localize
        error
      );
    }
  };

  const fetchDevices = async () => {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const audioStreamDevices = devices.filter(
      (device) => device.kind === "audioinput"
    );
    const videoStreamDevices = devices.filter(
      (device) => device.kind === "videoinput"
    );
    setAudioDevices(audioStreamDevices);
    setSelectedAudioDeviceID(audioStreamDevices[0].deviceId);
    setSelectedAudioDeviceLabel(audioStreamDevices[0].label);
    setVideoDevices(videoStreamDevices);
    setSelectedVideoDeviceID(videoStreamDevices[0].deviceId);
    setSelectedVideoDeviceLabel(videoStreamDevices[0].label);
  };

  const startMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localStream.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      stream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, stream);
      });
      const videoTrack = stream.getVideoTracks()[0];
      setActiveVideoTrack(videoTrack);
      const audioTrack = stream.getAudioTracks()[0];
      setActiveAudioTrack(audioTrack);
      setIsMicOn(true);
      setIsVideoOn(true);
      await fetchDevices();
    } catch (error) {
      console.error("Error starting media: ", error);
    }
  };

  const joinClass = async () => {
    if (!peerConnection) {
      return;
    }

    if (isCallStarted) {
      peerConnection.close();
      setIsCallStarted(false);
      setIsRemoteStreamActive(false);
      // TODO: send signal that the call is ended for other participants
    } else {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      sendMessage(JSON.stringify({ type: "offer", data: offer }));
      setIsCallStarted(true);
    }
  };

  const handleEnterClassroom = () => {
    setIsInClassroom(true);
    // TODO: add other room logic here
  };

  const handleExitClassroom = () => {
    setIsInClassroom(false);
    // TODO: add other room logic here
  };

  const handleEnterFullscreen = () => {
    setIsFullscreen(true);
  };
  const handleExitFullscreen = () => {
    setIsFullscreen(false);
  };
  const toggleFullscreen = () => {
    if (isFullscreen) {
      handleExitFullscreen();
    } else {
      handleEnterFullscreen();
    }
  };

  useEffect(() => {
    startMedia();
  }, []);

  useEffect(() => {
    const storedStudentInfo = getInfo();

    // TODO: Remove this useEffect in production;
    // This is just for testing purposes to keep info updated during refreshes
    if (storedStudentInfo) {
      updateInfo(storedStudentInfo);
    }
  }, []);

  return (
    <Layout
      isFullscreen={isFullscreen}
      title={intl.formatMessage({ id: "common_classroom" })}
    >
      {!isInClassroom && (
        <Classes handleEnterClassroom={handleEnterClassroom} />
      )}
      <>
        <Videos
          isInClassroom={isInClassroom}
          localVideoRef={localVideoRef}
          remoteVideoRef={remoteVideoRef}
          isRemoteStreamActive={isRemoteStreamActive}
          isFullscreen={isFullscreen}
        />
        <Controls
          isInClassroom={isInClassroom}
          handleExitClassroom={handleExitClassroom}
          isCallStarted={isCallStarted}
          handleOpenCallSettingsMenu={handleOpenCallSettingsMenu}
          handleCloseCallSettingsMenu={handleCloseCallSettingsMenu}
          callSettingsAnchorEl={callSettingsAnchorEl}
          callSettingsMenuIsOpen={callSettingsMenuIsOpen}
          handleSelectVideoDevice={handleSelectVideoDevice}
          toggleVideo={toggleVideo}
          isVideoOn={isVideoOn}
          videoDevices={videoDevices}
          selectedVideoDeviceLabel={selectedVideoDeviceLabel}
          handleSelectAudioDevice={handleSelectAudioDevice}
          toggleAudio={toggleAudio}
          isMicOn={isMicOn}
          audioDevices={audioDevices}
          selectedAudioDeviceLabel={selectedAudioDeviceLabel}
          handleOpenScreenShareOptions={handleOpenScreenShareOptions}
          isSharingScreen={isSharingScreen}
          joinClass={joinClass}
          isFullscreen={isFullscreen}
          toggleFullscreen={toggleFullscreen}
        />
        <ScreenShareDialog
          areScreenShareOptionsOpen={areScreenShareOptionsOpen}
          handleCloseScreenShareOptions={handleCloseScreenShareOptions}
          screenShareOptions={screenShareOptions}
          handleSelectScreenShareSource={handleSelectScreenShareSource}
        />
      </>
    </Layout>
  );
};

export default Classroom;
