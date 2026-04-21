import s from "../WindowControlButton/WindowControlButton.module.scss";
import MinimizeIcon from "../../../../shared/assets/icons/minimize.svg?react";
import MaximizeIcon from "../../../../shared/assets/icons/maximize.svg?react";
import CloseIcon from "../../../../shared/assets/icons/close.svg?react";

export const WindowControlButton = ({ type = "close" }) => {
    const handleClick = () => {
        console.log("click", type);
        switch (type) {
            case "minimize":
                window.electronAPI.minimize();
                break;
            case "maximize":
                window.electronAPI.maximize();
                break;
            case "close":
                window.electronAPI.close();
                break;
            default:
                break;
        }
    };

    return (
        <div
            className={`${s.button} ${type === "close" ? s.close : ""}`}
            onClick={handleClick}
        >
            {type === "minimize" && <MinimizeIcon height={20} width={20} />}
            {type === "maximize" && <MaximizeIcon height={20} width={20} />}
            {type === "close" && <CloseIcon height={20} width={20} />}
        </div>
    );
};
