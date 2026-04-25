// TTSPage.tsx
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    selectSpeechVolume,
    selectTwitchTTSOn,
    selectTwitchVoice,
    setSpeechVolume,
    setTwitchTTSOn,
    setTwitchVoice, // Добавьте этот импорт
} from "../../../features/tts-chat/model/slice";
import {
    DefaultOption,
    DefaultSelectList,
    DefaultSlider,
    DefaultSwitch,
    InfoQuestion,
} from "../../../shared/ui";
import { DefaultWidgetShape } from "../../../shared/widgets/DefaultWidgetShape/DefaultWidgetShape";
import s from "./TTSPage.module.scss";

export const TTSPage = () => {
    const dispatch = useDispatch();
    const isTwitchTTSOn = useSelector(selectTwitchTTSOn);
    const twitchVoice = useSelector(selectTwitchVoice);
    const speechVolume = useSelector(selectSpeechVolume);

    const baseUrl = import.meta.env.VITE_BASE_URL_API || "";
    const [optionList, setOptionList] = useState([]);
    const [switchDisabled, setSwitchDisabled] = useState(false);
    const prevIsTwitchTTSOn = useRef(isTwitchTTSOn);

    // Синхронизация с сервером при изменении состояния
    useEffect(() => {
        if (prevIsTwitchTTSOn.current !== isTwitchTTSOn) {
            prevIsTwitchTTSOn.current = isTwitchTTSOn;
            setSwitchDisabled(true);
            setTimeout(() => {
                setSwitchDisabled(false);
            }, 5000);

            // Синхронизация с сервером
            syncTTSServer(isTwitchTTSOn);
        }
    }, [isTwitchTTSOn]);

    const syncTTSServer = async (enabled) => {
        if (!window.electronAPI) return;

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

    // При монтировании: синхронизация с сервером
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

    // Загрузка списка голосов
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
                // Убедитесь, что данные - массив строк
                const speakers = Array.isArray(data.speakers)
                    ? data.speakers.map((s) =>
                          typeof s === "string" ? s : s.name,
                      )
                    : [];
                setOptionList(speakers);
            } catch (err) {
                console.error("Ошибка запроса к TTS серверу:", err);
            }
        };

        fetchSpeakers();
    }, [baseUrl]);

    const handleSwitch = async () => {
        const newState = !isTwitchTTSOn;
        dispatch(setTwitchTTSOn(newState)); // Redux сам сохранит в localStorage
    };

    const handleVoiceSelect = (option) => {
        dispatch(setTwitchVoice(option)); // Redux сам сохранит в localStorage
    };

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
                <DefaultOption
                    name={"Включить озвучку сообщений?"}
                    position={"relative"}
                >
                    <div className={s.info}>
                        <InfoQuestion
                            info={
                                <>
                                    <span>
                                        Эта функция требует повышенного расхода
                                    </span>
                                    <span>оперативной памяти</span>
                                </>
                            }
                        />
                    </div>
                    <DefaultSwitch
                        state={isTwitchTTSOn}
                        onSwitch={handleSwitch}
                        disabled={switchDisabled}
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
                            onSelect={handleVoiceSelect}
                        />
                    </DefaultWidgetShape>
                </div>
            </DefaultWidgetShape>
        </div>
    );
};
