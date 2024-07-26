import { Context } from "../types";
import { returnOptional } from "../utils";
import { fetchGuardedFilesFromPreviousCommit } from "./get-prechange-files";

export async function handleRollback(context: Context) {
    const { logger } = context;
    const guardedFiles = await fetchGuardedFilesFromPreviousCommit(context);

    if (!guardedFiles) {
        logger.error("No files to rollback");
        return;
    }

    logger.info("Rolling back changes");

    try {
        for (const [path, content] of Object.entries(guardedFiles)) {
            const [sha, contentActual] = content;
            const updated = await context.octokit.repos.createOrUpdateFileContents({
                owner: returnOptional(context.payload.repository.owner?.login),
                repo: context.payload.repository.name,
                path,
                message: "Config Protection Rollback",
                sha,
                content: Buffer.from(contentActual).toString("base64"),
            });

            logger.info("Repository updated successfully", { commit: updated.data.commit.html_url });
        }
    } catch (er) {
        logger.error("Failed to update repository", { er });
    }
}

