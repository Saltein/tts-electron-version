import s from "./DefaultSwitch.module.scss";

export const DefaultSwitch = ({ state, onSwitch, disabled = false }) => {
    const handleSwitch = () => {
        onSwitch(!state);
    };

    return (
        <div
            className={`${s.wrapper} ${state ? s.on : ""} ${disabled ? s.disabled : ""}`}
            onClick={disabled ? () => {} : handleSwitch}
        >
            <div className={`${s.circle} ${disabled ? s.disabled : ""}`} />
        </div>
    );
};
