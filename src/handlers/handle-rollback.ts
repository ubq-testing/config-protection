import { Context } from "../types";
import { GetContent } from "../types/github";
import { returnOptional } from "../utils";
import { fetchGuardedFilesFromPreviousCommit } from "./get-prechange-files";

export async function handleRollback(context: Context, usernames: string[]) {
  const { logger } = context;
  const guardedFiles = await fetchGuardedFilesFromPreviousCommit(context, usernames);

  if (!guardedFiles) {
    logger.error("No files to rollback");
    return;
  }

  logger.info("Rolling back changes");

  try {
    for (const [path, file] of Object.entries(guardedFiles)) {
      try {
        // pull from latest commit
        const { data: latestContent } = (await context.octokit.repos.getContent({
          owner: returnOptional(context.payload.repository.owner?.login),
          repo: context.payload.repository.name,
          path,
          ref: context.payload.after,
        })) as GetContent;

        // get the content from the commit we want to rollback to
        const { data: contentNeeded } = (await context.octokit.repos.getContent({
          owner: returnOptional(context.payload.repository.owner?.login),
          repo: context.payload.repository.name,
          ref: file.sha,
          path,
        })) as GetContent;

        const decoded = Buffer.from(contentNeeded.content, "base64").toString();
        const updated = await context.octokit.repos.createOrUpdateFileContents({
          owner: returnOptional(context.payload.repository.owner?.login),
          repo: context.payload.repository.name,
          path,
          message: "Config Protection Rollback",
          content: Buffer.from(decoded).toString("base64"),
          sha: latestContent.sha,
        });

        logger.info("Repository updated successfully", { commit: updated.data.commit.html_url });
      } catch (error) {
        logger.error("Failed to update repository", { error });
      }
    }
  } catch (er) {
    logger.error("Failed to update repository", { er });
  }
}
