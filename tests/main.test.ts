import { drop } from "@mswjs/data";
import { Context } from "../src/types/context";
import { db } from "./__mocks__/db";
import { server } from "./__mocks__/node";
import { it, describe, beforeAll, beforeEach, afterAll, expect, afterEach, jest } from "@jest/globals";
import dotenv from "dotenv";
import { Octokit } from "@octokit/rest";
import { STRINGS } from "./__mocks__/strings";
import { setupTests, inMemoryCommits, createCommit } from "./__mocks__/helpers";
import manifest from "../manifest.json";
import { runPlugin } from "../src/plugin";
import { info } from "console";
dotenv.config();

jest.requireActual("@octokit/rest");

type CreateCommitParams = {
  owner: string;
  repo: string;
  sha: string;
  modified: string[];
  added: string[];
};
const octokit = new Octokit();
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("Config Protection", () => {
  beforeEach(async () => {
    drop(db);
    await setupTests();
  });

  it("Should serve the manifest file", async () => {
    const worker = (await import("../src/worker")).default;
    const response = await worker.fetch(new Request("http://localhost/manifest.json"));
    const content = await response.json();
    expect(content).toEqual(manifest);
  });

  it("Should allow an admin to push changes to the config file", async () => {
    const commits = inMemoryCommits(STRINGS.SHA_1);
    const { context, warnSpy, errorSpy, infoSpy } = innerSetup(1, 1, commits, {
      owner: STRINGS.UBIQUITY,
      repo: STRINGS.TEST_REPO,
      sha: STRINGS.SHA_1,
      modified: [STRINGS.CONFIG_PATH],
      added: [],
    });

    await runPlugin(context);

    expect(warnSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
    expect(infoSpy).toHaveBeenCalledTimes(2);
    expect(infoSpy).toHaveBeenCalledWith(STRINGS.CONFIG_CHANGED_IN_COMMIT);
    expect(infoSpy).toHaveBeenCalledWith(STRINGS.USER_UBIQUITY_IS_AUTHORIZED);
  });

  it("Should allow a billing manager to push changes to the config file", async () => {
    const commits = inMemoryCommits(STRINGS.SHA_1);
    const { context, warnSpy, errorSpy, infoSpy } = innerSetup(3, 3, commits, {
      owner: STRINGS.UBIQUITY,
      repo: STRINGS.TEST_REPO,
      sha: STRINGS.SHA_1,
      modified: [STRINGS.CONFIG_PATH],
      added: [],
    });

    await runPlugin(context);

    expect(warnSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
    expect(infoSpy).toHaveBeenCalledTimes(2);
    expect(infoSpy).toHaveBeenCalledWith(STRINGS.CONFIG_CHANGED_IN_COMMIT);
    expect(infoSpy).toHaveBeenCalledWith(STRINGS.USER_BILLING_IS_AUTHORIZED);
  });

  it("Should allow changes if pushed by admin and merged by billing", async () => {
    const commits = inMemoryCommits(STRINGS.SHA_1);
    const { context, warnSpy, errorSpy, infoSpy } = innerSetup(1, 3, commits, {
      owner: STRINGS.UBIQUITY,
      repo: STRINGS.TEST_REPO,
      sha: STRINGS.SHA_1,
      modified: [STRINGS.CONFIG_PATH],
      added: [],
    });

    await runPlugin(context);

    expect(warnSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
    expect(infoSpy).toHaveBeenCalledTimes(2);
    expect(infoSpy).toHaveBeenCalledWith(STRINGS.CONFIG_CHANGED_IN_COMMIT);
    expect(infoSpy).toHaveBeenCalledWith(STRINGS.USER_UBIQUITY_IS_AUTHORIZED);
  });

  it("Should allow changes if pushed by billing and merged by admin", async () => {
    const commits = inMemoryCommits(STRINGS.SHA_1);
    const { context, warnSpy, errorSpy, infoSpy } = innerSetup(3, 1, commits, {
      owner: STRINGS.UBIQUITY,
      repo: STRINGS.TEST_REPO,
      sha: STRINGS.SHA_1,
      modified: [STRINGS.CONFIG_PATH],
      added: [],
    });

    await runPlugin(context);

    expect(warnSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
    expect(infoSpy).toHaveBeenCalledTimes(2);
    expect(infoSpy).toHaveBeenCalledWith(STRINGS.CONFIG_CHANGED_IN_COMMIT);
    expect(infoSpy).toHaveBeenCalledWith(STRINGS.USER_BILLING_IS_AUTHORIZED);
  });

  it("Should rollback changes if pushed by non-admin and non-billing", async () => {
    const commits = inMemoryCommits(STRINGS.SHA_1);
    const { context, warnSpy, errorSpy, infoSpy } = innerSetup(2, 2, commits, {
      owner: STRINGS.UBIQUITY,
      repo: STRINGS.TEST_REPO,
      sha: STRINGS.SHA_1,
      modified: [STRINGS.CONFIG_PATH],
      added: [],
    });

    await runPlugin(context);

    expect(warnSpy).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledWith(STRINGS.PUSHER_NOT_AUTHED);
    expect(errorSpy).toHaveBeenCalledWith(STRINGS.SENDER_NOT_AUTHED);
    expect(infoSpy).toHaveBeenCalledWith(STRINGS.CONFIG_CHANGED_IN_COMMIT);
    expect(infoSpy).toHaveBeenCalledWith(STRINGS.ROLLING_BACK_CHANGES);
    expect(infoSpy).toHaveBeenCalledWith(STRINGS.REPO_UPDATED_SUCCESSFULLY, { commit: STRINGS.COMMIT_URL });
  });

  it("Should rollback changes if pushed by non-admin and merged by non-billing", async () => {
    const commits = inMemoryCommits(STRINGS.SHA_1);
    const { context, warnSpy, errorSpy, infoSpy } = innerSetup(2, 3, commits, {
      owner: STRINGS.UBIQUITY,
      repo: STRINGS.TEST_REPO,
      sha: STRINGS.SHA_1,
      modified: [STRINGS.CONFIG_PATH],
      added: [],
    });

    await runPlugin(context);

    expect(warnSpy).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledWith(STRINGS.SENDER_NOT_AUTHED);
    expect(errorSpy).toHaveBeenCalledWith(STRINGS.SENDER_NOT_AUTHED);
    expect(infoSpy).toHaveBeenCalledWith(STRINGS.CONFIG_CHANGED_IN_COMMIT);
    expect(infoSpy).toHaveBeenCalledWith(STRINGS.ROLLING_BACK_CHANGES);
    expect(infoSpy).toHaveBeenCalledWith(STRINGS.REPO_UPDATED_SUCCESSFULLY, { commit: STRINGS.COMMIT_URL });
  });

  it("Should rollback changes if pushed by non-billing and merged by non-admin", async () => {
    const commits = inMemoryCommits(STRINGS.SHA_1);
    const { context, warnSpy, errorSpy, infoSpy } = innerSetup(3, 2, commits, {
      owner: STRINGS.UBIQUITY,
      repo: STRINGS.TEST_REPO,
      sha: STRINGS.SHA_1,
      modified: [STRINGS.CONFIG_PATH],
      added: [],
    });

    await runPlugin(context);

    expect(warnSpy).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledWith(STRINGS.PUSHER_NOT_AUTHED);
    expect(errorSpy).toHaveBeenCalledWith(STRINGS.PUSHER_NOT_AUTHED);
    expect(infoSpy).toHaveBeenCalledWith(STRINGS.CONFIG_CHANGED_IN_COMMIT);
    expect(infoSpy).toHaveBeenCalledWith(STRINGS.ROLLING_BACK_CHANGES);
    expect(infoSpy).toHaveBeenCalledWith(STRINGS.REPO_UPDATED_SUCCESSFULLY, { commit: STRINGS.COMMIT_URL });
  });

  it("Should rollback changes if pushed by non-billing and non-admin", async () => {
    const commits = inMemoryCommits(STRINGS.SHA_1);
    const { context, warnSpy, errorSpy, infoSpy } = innerSetup(2, 2, commits, {
      owner: STRINGS.UBIQUITY,
      repo: STRINGS.TEST_REPO,
      sha: STRINGS.SHA_1,
      modified: [STRINGS.CONFIG_PATH],
      added: [],
    });

    await runPlugin(context);

    expect(warnSpy).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledWith(STRINGS.PUSHER_NOT_AUTHED);
    expect(errorSpy).toHaveBeenCalledWith(STRINGS.SENDER_NOT_AUTHED);
    expect(infoSpy).toHaveBeenCalledWith(STRINGS.CONFIG_CHANGED_IN_COMMIT);
    expect(infoSpy).toHaveBeenCalledWith(STRINGS.ROLLING_BACK_CHANGES);
    expect(infoSpy).toHaveBeenCalledWith(STRINGS.REPO_UPDATED_SUCCESSFULLY, { commit: STRINGS.COMMIT_URL });
  });
});



function innerSetup(
  senderId: number,
  pusherId: number,
  commits: Context<"push">["payload"]["commits"],
  commitParams: CreateCommitParams,
) {
  const sender = db.users.findFirst({ where: { id: { equals: senderId } } }) as unknown as Context["payload"]["sender"];
  const pusher = db.users.findFirst({ where: { id: { equals: pusherId } } }) as unknown as Context["payload"]["sender"];

  createCommit(commitParams);
  const context = createContext(sender, commits, pusher);

  const infoSpy = jest.spyOn(context.logger, "info");
  const warnSpy = jest.spyOn(context.logger, "warn");
  const errorSpy = jest.spyOn(context.logger, "error");

  return {
    context,
    infoSpy,
    warnSpy,
    errorSpy
  };
}

function createContext(
  sender: Context["payload"]["sender"],
  commits: Context<"push">["payload"]["commits"],
  pusher?: Context["payload"]["sender"],
): Context {
  return {
    payload: {
      action: "created",
      sender: sender as unknown as Context["payload"]["sender"],
      repository: db.repo.findFirst({ where: { id: { equals: 1 } } }) as unknown as Context["payload"]["repository"],
      installation: { id: 1 } as unknown as Context["payload"]["installation"],
      organization: { login: STRINGS.UBIQUITY } as unknown as Context["payload"]["organization"],
      after: STRINGS.SHA_1,
      before: STRINGS.SHA_1,
      base_ref: "refs/heads/main",
      ref: "refs/heads/main",
      commits,
      compare: "",
      created: false,
      deleted: false,
      forced: false,
      head_commit: {
        id: STRINGS.SHA_1,
        message: "feat: add base rate",
        timestamp: new Date().toISOString(),
        url: "",
        author: {
          email: STRINGS.UBQ_EMAIL,
          name: STRINGS.UBIQUITY,
          username: STRINGS.UBIQUITY,
        },
        committer: {
          email: STRINGS.UBQ_EMAIL,
          name: STRINGS.UBIQUITY,
          username: STRINGS.UBIQUITY,
        },
        added: [STRINGS.CONFIG_PATH],
        modified: [],
        removed: [],
        distinct: true,
        tree_id: STRINGS.SHA_1,
      },
      pusher: {
        name: pusher?.login ?? sender?.login,
        email: "...",
        date: new Date().toISOString(),
        username: pusher?.login ?? sender?.login,
      },
    } as Context["payload"],
    logger: {
      info: console.info,
      error: console.error,
      warn: console.warn,
      debug: console.debug,
      fatal: console.error,
    },
    config: {
      filesThatNeedGuarded: [STRINGS.CONFIG_PATH],
      rolesAllowedToModify: ["admin", "billing_manager"],
    },
    octokit: octokit,
    eventName: "push",
  };
}