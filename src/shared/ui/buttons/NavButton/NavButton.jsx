import s from "./NavButton.module.scss";
import { useDispatch, useSelector } from "react-redux";
import {
    selectNavPanelCurrentPageID,
    setNavPanelCurrentPageID,
} from "../../../../widgets/navs/NavPanel/model/slice";
import { useNavigate } from "react-router-dom";

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

    const currentPageID = useSelector(selectNavPanelCurrentPageID);

    const handleClick = () => {
        dispatch(setNavPanelCurrentPageID(index));
        navigate(link);
    };

    return (
        <div
            className={`${s.wrapper} ${currentPageID === index ? s.current : ""} 
        ${position === "first" ? s.first : ""} 
        ${position === "last" ? s.last : ""}
        ${isMobile ? s.mobile : ""}`}
            onClick={handleClick}
        >
            <div
                className={`${s.accent} ${currentPageID === index ? s.current : ""} 
            ${isMobile ? s.mobile : ""}`}
            />
            <Icon
                className={`${s.icon} ${currentPageID === index ? s.current : ""} 
            ${isMobile ? s.mobile : ""}`}
            />
            {!isMobile && <h3>{title}</h3>}
        </div>
    );
};
