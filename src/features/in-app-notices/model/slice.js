import { createSelector, createSlice } from "@reduxjs/toolkit";

let initialState = {
    queueStack: [],
};

// тип для уведомления
// {
//     id: string;
//     type: "error" | "warning" | "info" | "success";
//     message: string;
// }

const inAppNoticesSlice = createSlice({
    name: "inAppNotices",
    initialState,
    reducers: {
        addNotice: (state, action) => {
            state.queueStack.push(action.payload);
        },
        removeNotice: (state, action) => {
            state.queueStack = state.queueStack.filter(
                (notice) => notice.id !== action.payload,
            );
        },
    },
});

export const { addNotice, removeNotice } = inAppNoticesSlice.actions;
export default inAppNoticesSlice.reducer;

export const selectInAppNotices = (state) => state.inAppNotices.queueStack;

export const selectFiveInAppNotices = createSelector(
    [selectInAppNotices],
    (inAppNotices) => inAppNotices.slice(0, 5),
);
