import s from "./NavButton.module.scss";
import { useDispatch } from "react-redux";
import {
    selectNavPanelCurrentPageID,
    setNavPanelCurrentPageID,
} from "../../../../widgets/navs/NavPanel/model/slice";
import { useLocation, useNavigate } from "react-router-dom";

export const NavButton = ({
    title,
    index = 0,
    link = "/",
    position = "",
    Icon,
    isMobile = false,
}) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();

    const isActive = location.pathname === link;

    const handleClick = () => {
        dispatch(setNavPanelCurrentPageID(index));
        navigate(link);
    };

    return (
        <div
            className={`${s.wrapper} ${isActive ? s.current : ""} 
        ${position === "first" ? s.first : ""} 
        ${position === "last" ? s.last : ""}
        ${isMobile ? s.mobile : ""}`}
            onClick={handleClick}
        >
            <div
                className={`${s.accent} ${isActive ? s.current : ""} 
            ${isMobile ? s.mobile : ""}`}
            />
            <Icon
                className={`${s.icon} ${isActive ? s.current : ""} 
            ${isMobile ? s.mobile : ""}`}
            />
            {!isMobile && <h3>{title}</h3>}
        </div>
    );
};
