import { Context } from "../types/context";
import { GetCommits, ListCommits } from "../types/github";
import { returnOptional } from "../utils";
import { isUserAuthorized } from "./authentication";

export async function fetchGuardedFilesFromPreviousCommit(context: Context, unauthedUsernames: string[]) {
  const {
    logger,
    payload: { repository },
    config: { filesThatNeedGuarded },
    octokit,
  } = context;

  let commitData = {} as GetCommits;

  try {
    const commits = (await octokit.paginate(octokit.repos.listCommits, {
      owner: returnOptional(repository.owner?.login),
      repo: repository.name,
      per_page: 100,
    })) as ListCommits[];

    if (!commits.length) {
      logger.info("No commits found in the repository");
      return;
    }

    const unauthedRemoved = commits.filter((commit) => {
      return !unauthedUsernames.includes(returnOptional(commit?.author?.login));
    });

    if (!unauthedRemoved.length) {
      logger.info("No commits found in the repository by authorized user(s)");
      return;
    }

    let mostRecentAuthedCommit = unauthedRemoved[0];
    let counter = 1;
    let isAuthed = false;

    while (!isAuthed) {
      if (!unauthedRemoved[counter]) {
        break;
      }

      const { author, committer } = mostRecentAuthedCommit;

      if (await isUserAuthorized(context, returnOptional(committer).login)) {
        isAuthed = true;
      } else if (await isUserAuthorized(context, returnOptional(author).login)) {
        isAuthed = true;
      } else {
        mostRecentAuthedCommit = unauthedRemoved[counter];
        counter++;
      }
    }

    commitData = await context.octokit.repos.getCommit({
      owner: returnOptional(repository.owner?.login),
      repo: repository.name,
      ref: returnOptional(mostRecentAuthedCommit.sha),
    });

    const files = commitData.data.files?.map((file) => file.filename);

    if (!files) {
      logger.info("No files found in the commit");
      return;
    }

    const guardedFiles = files.filter((file) => filesThatNeedGuarded.includes(file));

    if (!guardedFiles.length) {
      logger.info("No files found that need to be guarded");
      return;
    }

    return guardedFiles.reduce(
      (acc, file) => {
        acc[file] = commitData.data;
        return acc;
      },
      {} as Record<string, GetCommits["data"]>
    );
  } catch (error: unknown) {
    logger.debug("Commit sha error.", { error });
  }
  return {};
}
