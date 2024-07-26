import { Octokit } from "@octokit/rest";
import { EmitterWebhookEvent as WebhookEvent, EmitterWebhookEventName as WebhookEventName } from "@octokit/webhooks";
import { PluginSettings } from "./plugin-inputs";

/**
    workflow_dispatch: [],
    workflow_job: [],
    'workflow_job.completed': [],
    'workflow_job.in_progress': [],
    'workflow_job.queued': [],
    'workflow_job.waiting': [],
    workflow_run: [],
    'workflow_run.completed': [],
    'workflow_run.in_progress': [],
    'workflow_run.requested': []
 */
export type SupportedEventsU = "push";

export type SupportedEvents = {
  [K in SupportedEventsU]: K extends WebhookEventName ? WebhookEvent<K> : never;
};

export interface Context<T extends SupportedEventsU = SupportedEventsU, TU extends SupportedEvents[T] = SupportedEvents[T]> {
  eventName: T;
  payload: TU["payload"];
  octokit: InstanceType<typeof Octokit>;
  config: PluginSettings;
  logger: {
    fatal: (message: unknown, ...optionalParams: unknown[]) => void;
    error: (message: unknown, ...optionalParams: unknown[]) => void;
    warn: (message: unknown, ...optionalParams: unknown[]) => void;
    info: (message: unknown, ...optionalParams: unknown[]) => void;
    debug: (message: unknown, ...optionalParams: unknown[]) => void;
  };
}
