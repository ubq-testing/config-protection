import { Context } from "../types/context";
import { returnOptional } from "../utils";

export async function fetchGuardedFilesFromPreviousCommit(context: Context) {
    const {
        logger,
        payload: { repository, before, after, head_commit: headCommit },
        config: { filesThatNeedGuarded },
    } = context;

    let commitData;

    try {
        commitData = await context.octokit.repos.getCommit({
            owner: returnOptional(repository.owner?.login),
            repo: repository.name,
            ref: returnOptional(headCommit?.id)
        });
    } catch (error: unknown) {
        logger.debug("Commit sha error.", { error });
    }

    const files = commitData?.data.files

    if (!files?.length) {
        logger.info("No files found in the commit");
        return;
    }

    logger.info("Files to rollback", { files: files.map((file) => file.filename) });

    const guardedFiles: Record<string, string> = {};
    const mapped: Record<string, string[]> = {};

    for (const file of files) {
        if (filesThatNeedGuarded.includes(file.filename)) {
            guardedFiles[file.filename] = file.sha;
        }
    }

    await Promise.all(
        Object.entries(guardedFiles).map(async ([file, sha]) => {
            try {
                const { data: fileData } = await context.octokit.repos.getContent({
                    owner: returnOptional(context.payload.repository.owner?.login),
                    repo: context.payload.repository.name,
                    path: file,
                    mediaType: {
                        format: "raw",
                    },
                    ref: before,
                });

                if (!mapped[file]) {
                    mapped[file] = [];
                }

                mapped[file].push(sha, fileData as unknown as string)
            } catch (error: unknown) {
                logger.error("File content error.", { error });
            }
        }));

    return mapped;
}