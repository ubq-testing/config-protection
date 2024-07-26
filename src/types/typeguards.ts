import { Context } from "./context";

export function isPushEvent(context: Context): context is Context & { payload: Context<"push">["payload"] } {
    return context.eventName === "push";
}