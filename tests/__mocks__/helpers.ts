import { Context } from "../../src/types/context";
import { AUTHED_USER, BILLING_MANAGER, UNAUTHED_USER } from "./constants";
import { db } from "./db";
import { STRINGS } from "./strings";
import usersGet from "./users-get.json";

export function getBaseRateChanges() {
    return Buffer.from(`
  diff--git a /.github /.ubiquibot - config.yml b /.github /.ubiquibot - config.yml
  index f7f8053..cad1340 100644
  --- a /.github /.ubiquibot - config.yml
  +++ b /.github /.ubiquibot - config.yml
  @@ - 7, 7 + 7, 7 @@features:
          setLabel: true
       fundExternalClosedIssue: true
 
      timers:
      reviewDelayTolerance: 86400000
      taskStaleTimeoutDuration: 2419200000
    with: 
      labels:
        time: []
@ -40,115 +36,124 @@
          setLabel: true
        assistivePricing: true
  `).toString("base64");
}

export function getAuthor(isAuthed: boolean, isBilling: boolean) {
    if (isAuthed) {
        return AUTHED_USER;
    }

    if (isBilling) {
        return BILLING_MANAGER;
    }

    return UNAUTHED_USER;
}

export function inMemoryCommits(id: string, isAuthed = true, withBaseRateChanges = true, isBilling = false): Context<"push">["payload"]["commits"] {
    return [
        {
            author: getAuthor(isAuthed, isBilling),
            committer: getAuthor(isAuthed, isBilling),
            id: id,
            message: "chore: update config",
            timestamp: new Date().toISOString(),
            tree_id: id,
            url: "",
            added: [],
            modified: withBaseRateChanges ? [STRINGS.CONFIG_PATH] : [],
            removed: [],
            distinct: true,
        },
    ];
}

export function createCommit({
    owner,
    repo,
    sha,
    modified,
    added,
}: {
    owner: string;
    repo: string;
    sha: string;
    modified: string[];
    added: string[];
}) {
    function _createCommit(id: number, owner: string) {
        db.commit.create({
            id,
            owner: {
                login: owner,
            },
            author: {
                login: owner,
            },
            committer: {
                login: owner,
            },
            repo,
            sha,
            modified,
            added,
            content: getBaseRateChanges(),
            commit: {
                html_url: "https://github.com/ubiquity/test-repo/commit/1",
            },
            data: {
                files: [
                    { filename: STRINGS.CONFIG_PATH, sha: STRINGS.SHA_1 },
                ],
            },
        });
    }

    _createCommit(1, STRINGS.UBIQUITY);
    _createCommit(2, owner);
}


export async function setupTests() {
    for (const item of usersGet) {
        db.users.create(item);
    }

    db.repo.create({
        id: 1,
        html_url: "",
        name: STRINGS.TEST_REPO,
        owner: {
            login: STRINGS.UBIQUITY,
            id: 1,
        },
    });
}