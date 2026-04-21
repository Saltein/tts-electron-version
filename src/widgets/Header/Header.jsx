import { WindowControlButton } from "../../processes";
import s from "./Header.module.scss";

export const Header = () => {
    return (
        <header className={s.header}>
            <div className={s.draggable}>
                <div className={s.logo}>
                    <h1 className={s.h1}>TTS Chat</h1>
                    <p className={s.p}>Сервис для озвучки чата</p>
                </div>
            </div>

            <div className={s.controls}>
                <WindowControlButton type={"minimize"} />
                <WindowControlButton type={"maximize"} />
                <WindowControlButton type={"close"} />
            </div>
        </header>
    );
};
