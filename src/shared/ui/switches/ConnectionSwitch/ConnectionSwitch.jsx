import { useState, useRef, useEffect } from "react";
import s from "./ConnectionSwitch.module.scss";
import { useDispatch, useSelector } from "react-redux";
import {
    selectTwitchConnectionData,
    selectTwitchConnectionStatus,
    setTwitchConnectionStatus,
    setNewTwitchMessage,
    selectYoutubeVideoId,
    selectYoutubeAccessToken,
    setYoutubeConnectionStatus,
    setNewYoutubeMessage,
    setVkConnectionStatus,
    setNewVkMessage,
    selectVkConnectionData,
    selectYoutubeConnectionStatus,
    selectVkConnectionStatus,
} from "../../../../entities/connection/model/slice";
import {
    connectTwitchClient,
    disconnectTwitchClient,
    getTwitchClient,
} from "../../../../features/live-chat/lib/twitchClientSingleton";
import {
    connectVkPlayClient,
    disconnectVkPlayClient,
} from "../../../../features/live-chat/lib/vk/vkClientSingleton";
import {
    connectYouTubeClient,
    disconnectYouTubeClient,
    getYouTubeClient,
} from "../../../../features/live-chat/lib/youtube/youtubeClientSingleton";
import { getTwitchChannelName } from "../../../lib/getTwitchChannelName";
import { getYoutubeVideoId } from "../../../lib/getYoutubeVideoId";

export const ConnectionSwitch = ({ serviceName = "", isActive = true }) => {
    const dispatch = useDispatch();

    const twitchBotName = import.meta.env.VITE_TWITCH_BOT_NAME;
    const twitchBotToken = import.meta.env.VITE_TWITCH_BOT_TOKEN;
    const twitchConnectionStatus = useSelector(selectTwitchConnectionStatus);
    const chatChannelName = useSelector(selectTwitchConnectionData);

    const vkConnectionData = useSelector(selectVkConnectionData);
    const vkConnectionStatus = useSelector(selectVkConnectionStatus);

    const youtubeVideoId = useSelector(selectYoutubeVideoId);
    const youtubeAccessToken = useSelector(selectYoutubeAccessToken);
    const youtubeConnectionStatus = useSelector(selectYoutubeConnectionStatus);

    const twitchChatChannelName = getTwitchChannelName(
        chatChannelName?.chatChannelName,
    );
    const youtubeVideoIdFormatted = getYoutubeVideoId(
        youtubeVideoId?.youtubeVideoId,
    );

    const getConnectionStatus = () => {
        if (serviceName === "Twitch") return twitchConnectionStatus;
        else if (serviceName === "YouTube") return youtubeConnectionStatus;
        else if (serviceName === "VK Видео Live") return vkConnectionStatus;
    };

    const [isSwitchLoading, setIsSwitchLoading] = useState(false);
    const [twitchJoined, setTwitchJoined] = useState(false);
    const [youtubeJoined, setYoutubeJoined] = useState(false);
    const [vkJoined, setVkJoined] = useState(false);

    const clientRef = useRef(null);

    // Эффект для синхронизации состояния переключателя с реальным статусом подключения
    useEffect(() => {
        if (serviceName === "YouTube") {
            const youtubeClient = getYouTubeClient();
            const isYoutubeConnected =
                youtubeClient && youtubeClient.isConnected;

            if (isYoutubeConnected !== getConnectionStatus()) {
                setIsSwitchLoading(false);
            }
        }
        if (serviceName === "Twitch") {
            const twitchClient = getTwitchClient();
            const isTwitchConnected = twitchClient && twitchClient.isConnected;

            if (isTwitchConnected !== getConnectionStatus()) {
                setIsSwitchLoading(false);
            }
        }
    }, [serviceName, getConnectionStatus()]);

    useEffect(() => {
        let timer;
        if (isSwitchLoading) {
            timer = setTimeout(() => {
                if (!twitchJoined) {
                    setIsSwitchLoading(false);
                    disconnectTwitchClient();
                }
                if (!youtubeJoined) {
                    setIsSwitchLoading(false);
                    disconnectYouTubeClient();
                }
                if (!vkJoined) {
                    setIsSwitchLoading(false);
                    disconnectVkPlayClient();
                }
            }, 10000);
        }
        return () => clearTimeout(timer);
    }, [isSwitchLoading]);

    const handleConnect = async () => {
        if (getConnectionStatus()) {
            // Отключение
            if (serviceName === "Twitch") {
                // Twitch Twitch Twitch Twitch Twitch Twitch Twitch Twitch Twitch Twitch Twitch Twitch Twitch Twitch Twitch Twitch Twitch Twitch Twitch Twitch Twitch
                disconnectTwitchClient();
                dispatch(setTwitchConnectionStatus(false));
                setIsSwitchLoading(false);
            } else if (serviceName === "VK Видео Live") {
                disconnectVkPlayClient();
                dispatch(setVkConnectionStatus(false));
                setIsSwitchLoading(false);
            } else if (serviceName === "YouTube") {
                setIsSwitchLoading(true);
                disconnectYouTubeClient();
                dispatch(setYoutubeConnectionStatus(false));
                setIsSwitchLoading(false);
            }
        } else {
            // Включение
            if (serviceName === "Twitch") {
                setIsSwitchLoading(true);

                const client = connectTwitchClient({
                    token: twitchBotToken,
                    botNick: twitchBotName,
                    channel: twitchChatChannelName,
                });

                if (client) {
                    clientRef.current = client;

                    client.on("message", (channel, tags, message, self) => {
                        dispatch(
                            setNewTwitchMessage({
                                channel: channel,
                                tags: tags,
                                message: message,
                                self: self,
                            }),
                        );
                    });

                    client.on("notice", (error) => {
                        setTwitchJoined(false);
                        console.error("Twitch error:", error);
                        dispatch(setTwitchConnectionStatus(false));
                        setIsSwitchLoading(false);
                    });

                    client.on("join", () => {
                        setTwitchJoined(true);
                        setIsSwitchLoading(false);
                        dispatch(setTwitchConnectionStatus(true));
                    });

                    client.on("disconnected", () => {
                        setTwitchJoined(false);
                        dispatch(setTwitchConnectionStatus(false));
                        setIsSwitchLoading(false);
                    });
                } else {
                    setIsSwitchLoading(false);
                }
            } else if (serviceName === "VK Видео Live") {
                // VK Видео Live VK Видео Live VK Видео Live VK Видео Live VK Видео Live VK Видео Live VK Видео Live VK Видео Live VK Видео Live
                setIsSwitchLoading(true);

                const callbacks = {
                    onChatMessage: (msg) => {
                        dispatch(setNewVkMessage(msg));
                    },
                    onConnected: () => {
                        setIsSwitchLoading(false);
                        dispatch(setVkConnectionStatus(true));
                        setVkJoined(true);
                    },
                    onDisconnected: () => {
                        dispatch(setVkConnectionStatus(false));
                        setIsSwitchLoading(false);
                        setVkJoined(false);
                    },
                };

                const client = connectVkPlayClient(
                    {
                        channelId: vkConnectionData?.vkChannelId,
                        token: vkConnectionData?.token,
                    },
                    callbacks,
                );

                if (!client) {
                    setIsSwitchLoading(false);
                    dispatch(setVkConnectionStatus(false));
                }
            } else if (serviceName === "YouTube") {
                // YouTube YouTube YouTube YouTube YouTube YouTube YouTube YouTube YouTube YouTube YouTube YouTube YouTube YouTube YouTube YouTube
                setIsSwitchLoading(true);

                const callbacks = {
                    onChatMessage: (msg) => {
                        dispatch(setNewYoutubeMessage(msg));
                    },
                    onConnected: () => {
                        setIsSwitchLoading(false);
                        dispatch(setYoutubeConnectionStatus(true));
                        setYoutubeJoined(true);
                    },
                    onDisconnected: () => {
                        setIsSwitchLoading(false);
                        dispatch(setYoutubeConnectionStatus(false));
                        setYoutubeJoined(false);
                    },
                };

                try {
                    const client = await connectYouTubeClient(
                        {
                            accessToken: youtubeAccessToken,
                            videoId: youtubeVideoIdFormatted,
                        },
                        callbacks,
                    );

                    if (client) {
                        clientRef.current = client;
                    } else {
                        console.error("❌ Не удалось создать YouTube клиент");
                        setIsSwitchLoading(false);
                        dispatch(setYoutubeConnectionStatus(false));
                    }
                } catch (error) {
                    console.error("❌ Ошибка подключения YouTube:", error);
                    setIsSwitchLoading(false);
                    dispatch(setYoutubeConnectionStatus(false));
                }
            }
        }
    };

    return (
        <div
            className={`${s.wrapper} ${isSwitchLoading ? s.loading : ""} ${getConnectionStatus() ? s.on : ""}`}
            onClick={isActive ? handleConnect : () => {}}
        >
            <div className={s.switch} />
        </div>
    );
};
