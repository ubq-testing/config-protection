import { SupportedEvents, SupportedEventsU } from "./context";
import { StaticDecode, Type as T } from "@sinclair/typebox";
import { StandardValidator } from "typebox-validators";

export interface PluginInputs<T extends SupportedEventsU = SupportedEventsU, TU extends SupportedEvents[T] = SupportedEvents[T]> {
  stateId: string;
  eventName: T;
  eventPayload: TU["payload"];
  settings: PluginSettings;
  authToken: string;
  ref: string;
}

export const pluginSettingsSchema = T.Object({
  rolesAllowedToModify: T.Array(T.String()),
  filesThatNeedGuarded: T.Array(T.String()),
});

export const pluginSettingsValidator = new StandardValidator(pluginSettingsSchema);

export type PluginSettings = StaticDecode<typeof pluginSettingsSchema>;
