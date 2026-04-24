import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    selectSpeechVolume,
    selectTwitchTTSOn,
    selectTwitchVoice,
    setSpeechVolume,
    setTwitchTTSOn,
} from "../../../features/tts-chat/model/slice";
import {
    DefaultOption,
    DefaultSelectList,
    DefaultSlider,
    DefaultSwitch,
} from "../../../shared/ui";
import { DefaultWidgetShape } from "../../../shared/widgets/DefaultWidgetShape/DefaultWidgetShape";
import s from "./TTSPage.module.scss";

export const TTSPage = () => {
    const dispatch = useDispatch();
    const isTwitchTTSOn = useSelector(selectTwitchTTSOn);
    const twitchVoice = useSelector(selectTwitchVoice);

    const baseUrl = import.meta.env.VITE_BASE_URL_API || "";
    const [optionList, setOptionList] = useState([]);

    // Функция синхронизации состояния сервера с переключателем
    const syncTTSServer = async (enabled) => {
        if (!window.electronAPI) return; // Запущено не в Electron (браузер)

        try {
            if (enabled) {
                await window.electronAPI.startTTSServer();
            } else {
                await window.electronAPI.stopTTSServer();
            }
        } catch (error) {
            console.error("Ошибка синхронизации TTS сервера:", error);
        }
    };

    // При монтировании: если TTS уже включён (например, сохранённое состояние), запускаем сервер
    useEffect(() => {
        if (isTwitchTTSOn) {
            syncTTSServer(true);
        }

        let unsubscribe;
        if (window.electronAPI?.onTTSError) {
            const errorHandler = (error) =>
                console.error("TTS Server Error:", error);
            unsubscribe = window.electronAPI.onTTSError(errorHandler);
        }

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, []);

    // Обработчик переключения свитча
    const handleSwitch = async () => {
        const newState = !isTwitchTTSOn;
        dispatch(setTwitchTTSOn(newState));
        await syncTTSServer(newState);
    };

    // Загрузка списка голосов с TTS сервера (без изменений)
    useEffect(() => {
        const fetchSpeakers = async () => {
            try {
                const res = await fetch(`${baseUrl}/api/speakers`);
                if (!res.ok) {
                    const error = await res.json();
                    console.error("Ошибка TTS:", error);
                    return;
                }
                const data = await res.json();
                setOptionList(data.speakers);
            } catch (err) {
                console.error("Ошибка запроса к TTS серверу:", err);
            }
        };

        fetchSpeakers();
    }, [baseUrl]);

    return (
        <div className={s.wrapper}>
            <DefaultWidgetShape
                marginLeft={"0"}
                padding={"0"}
                title="Озвучка чата"
                paddingBlock={"16px"}
                flexDirection={"column"}
                display={"flex"}
            >
                <DefaultOption name={"Включить озвучку сообщений?"}>
                    <DefaultSwitch
                        state={isTwitchTTSOn}
                        onSwitch={handleSwitch}
                    />
                </DefaultOption>
                <div className={s.settingsBlock}>
                    <DefaultWidgetShape
                        title="Громкость сообщений"
                        width={"fit-content"}
                        margin={"0"}
                        padding={"0 16px 16px 16px"}
                        noBlock
                        justifyTitle={"center"}
                        backgroundColor={"var(--color-items)"}
                    >
                        <DefaultSlider
                            dispatcher={setSpeechVolume}
                            selector={selectSpeechVolume}
                        />
                    </DefaultWidgetShape>
                    <DefaultWidgetShape
                        title="Голос"
                        width={"fit-content"}
                        margin={"0"}
                        padding={"0 16px 16px 16px"}
                        noBlock
                        justifyTitle={"center"}
                        backgroundColor={"var(--color-items)"}
                    >
                        <DefaultSelectList
                            currentSelection={twitchVoice}
                            options={optionList}
                        />
                    </DefaultWidgetShape>
                </div>
            </DefaultWidgetShape>
        </div>
    );
};
