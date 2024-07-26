import { STRINGS } from "./strings";

export const AUTHED_USER = {
    email: STRINGS.UBQ_EMAIL,
    name: STRINGS.UBIQUITY,
    login: STRINGS.UBIQUITY,
    username: STRINGS.UBIQUITY,
    date: new Date().toISOString(),
};

export const BILLING_MANAGER = {
    email: "billing@ubq",
    name: STRINGS.BILLING,
    login: STRINGS.BILLING,
    username: STRINGS.BILLING,
    date: new Date().toISOString(),
};

export const UNAUTHED_USER = {
    email: "user2@ubq",
    name: STRINGS.USER_2,
    username: STRINGS.USER_2,
    date: new Date().toISOString(),
};