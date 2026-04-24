import { useDispatch, useSelector } from "react-redux";
import s from "./NoticeStack.module.scss";
import { addNotice, selectFiveInAppNotices } from "../../model/slice";
import { NoticeItem } from "../NoticeItem/NoticeItem";

export const NoticeStack = () => {
    const dispatch = useDispatch();

    const stack = useSelector(selectFiveInAppNotices);

    return (
        <div className={s.wrapper_NoticeStack}>
            {stack.map((notice) => (
                <NoticeItem key={notice.id} notice={notice} />
            ))}
        </div>
    );
};
