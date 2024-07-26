import { Octokit } from "@octokit/rest";
import { PluginInputs } from "./types";
import { Context } from "./types";
import { isPushEvent } from "./types/typeguards";
import { handleAuth, isUserAuthorized } from "./handlers/authentication";

/**
 * How a worker executes the plugin.
 */
export async function plugin(inputs: PluginInputs) {
  const octokit = new Octokit({ auth: inputs.authToken });

  const context: Context = {
    eventName: inputs.eventName,
    payload: inputs.eventPayload,
    config: inputs.settings,
    octokit,
    logger: {
      debug(message: unknown, ...optionalParams: unknown[]) {
        console.debug(message, ...optionalParams);
      },
      info(message: unknown, ...optionalParams: unknown[]) {
        console.log(message, ...optionalParams);
      },
      warn(message: unknown, ...optionalParams: unknown[]) {
        console.warn(message, ...optionalParams);
      },
      error(message: unknown, ...optionalParams: unknown[]) {
        console.error(message, ...optionalParams);
      },
      fatal(message: unknown, ...optionalParams: unknown[]) {
        console.error(message, ...optionalParams);
      },
    },
  };

  if (isPushEvent(context)) {
    const { payload, logger } = context;

    // who triggered the event
    const sender = payload.sender?.login;
    // who pushed the code
    const pusher = payload.pusher?.name;

    if (!sender || !pusher) {
      logger.error("Sender or pusher is missing");
      return;
    }

    const isAuthorized = await handleAuth(context, sender, pusher);

    if (!isAuthorized) {
      logger.error("Sender or pusher is not authorized");
      return;
    }



  }

}

