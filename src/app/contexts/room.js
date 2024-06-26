"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { Communicator } from "@pw2016/pw-player-communicator";

import { checkAudio } from "@/shared/utils";

const Room = createContext();

export const RoomProvider = ({
  children,
  sessionToken,
  defaultMode = "offline",
}) => {
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [roomMode, setRoomMode] = useState(defaultMode);
  const [requestingVIP, setRequestingVIP] = useState(false);
  const [userCamStatus, setUserCamStatus] = useState(null);

  const [communicator, setCommunicator] = useState(null);

  useEffect(() => {
    setCommunicator(new Communicator({ sessionToken }));
  }, [sessionToken]);

  const activateUserCam = () => {
    if (!communicator) return;
    communicator.activateUserCam();
  };

  const deactivateUserCam = () => {
    if (!communicator) return;
    communicator.deactivateUserCam();
  };

  const toggleMute = () => setMuted(!muted);

  const goToGroupChat = () => {
    if (!communicator) return;
    communicator.goToGroupChat();
  };

  const goToVIP = () => {
    if (!communicator) return;
    communicator.requestVIP();
    setRequestingVIP(true);
  };

  const onVideoPlay = useCallback(() => {
    setPlaying(true);
    if (!checkAudio()) setMuted(true);
  }, []);

  const onVIPRequestStatusUpdate = useCallback((status) => {
    switch (status) {
      case "requesting":
        setRequestingVIP(true);
        break;
      case "rejected":
      case "accepted":
        setRequestingVIP(false);
        break;
      // no default
    }
  }, []);

  const onUserCamStatus = useCallback((status) => {
    setUserCamStatus(status.toLowerCase());
  }, []);

  useEffect(() => {
    setCommunicator(new Communicator({ sessionToken }));
  }, [sessionToken]);

  useEffect(() => {
    if (!communicator) return;
    communicator.on("videoPlay", onVideoPlay);
    communicator.on("roomModeUpdate", setRoomMode);
    communicator.on("userCamStatus", onUserCamStatus);

    return () => {
      communicator.off("videoPlay", onVideoPlay);
      communicator.off("roomModeUpdate", setRoomMode);
      communicator.off("userCamStatus", onUserCamStatus);
    };
  }, [communicator, onUserCamStatus, onVideoPlay]);

  // Sync mute with communicator
  useEffect(() => {
    if (!communicator) return;
    communicator.setMuted(muted);
  }, [communicator, muted]);

  // Sync volume with communicator
  useEffect(() => {
    if (!communicator) return;
    communicator.setVolume(volume);
  }, [communicator, volume]);

  // Sync VIP request status with communicator
  useEffect(() => {
    if (!communicator) return;
    communicator.on("VIPRequestStatusUpdate", onVIPRequestStatusUpdate);
    return () => {
      communicator.off("VIPRequestStatusUpdate", onVIPRequestStatusUpdate);
    };
  }, [communicator, onVIPRequestStatusUpdate]);

  return (
    <Room.Provider
      value={{
        communicator,
        playing,
        muted,
        toggleMute,
        goToGroupChat,
        goToVIP,
        roomMode,
        volume,
        setVolume,
        requestingVIP,
        activateUserCam,
        deactivateUserCam,
        userCamStatus,
      }}
    >
      {children}
    </Room.Provider>
  );
};

export const useRoom = () => useContext(Room);
