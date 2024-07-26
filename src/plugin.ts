import { Octokit } from "@octokit/rest";
import { PluginInputs } from "./types";
import { Context } from "./types";
import { handleAuth } from "./handlers/authentication";
import { getCommitChanges } from "./handlers/get-commit-changes";
import { handleRollback } from "./handlers/handle-rollback";

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

  if (context.eventName === "push") {
    const { payload, logger, config: { filesThatNeedGuarded } } = context;

    // who triggered the event
    const sender = payload.sender?.login;
    // who pushed the code
    const pusher = payload.pusher?.name;

    if (!sender || !pusher) {
      logger.error("Sender or pusher is missing");
      return;
    }

    const changes = getCommitChanges(logger, payload.commits);

    if (!changes.length) {
      logger.info("No changes found in the commits");
      return;
    }

    if (!filesThatNeedGuarded.length) {
      logger.info("No files to guard");
      return;
    }

    if (!filesThatNeedGuarded.some(file => changes.includes(file))) {
      logger.info("No changes found in the files that need to be guarded");
      return;
    }

    if (!await handleAuth(context, sender, pusher)) {
      await handleRollback(context);
    } else {
      logger.info(`User ${sender} is authorized to make changes`);
    }
  }
}

