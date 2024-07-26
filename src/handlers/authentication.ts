import { Context } from "../types/context";
import { returnOptional } from "../utils";

export async function handleAuth(context: Context, username: string, pusher: string): Promise<boolean> {
  const isPusherAdmin = await isUserAuthorized(context, pusher);
  const isSenderAdmin = await isUserAuthorized(context, username);

  if (!isPusherAdmin) {
    context.logger.error("Pusher is not authorized", { pusher });
  }

  if (!isSenderAdmin) {
    context.logger.error("Sender is not authorized", { sender: username });
  }

  return isPusherAdmin && isSenderAdmin;
}

export async function isUserAuthorized(context: Context, username: string): Promise<boolean> {
  const {
    config: { rolesAllowedToModify },
  } = context;
  return checkAuth(await checkCollaboratorPermission(context, username), await checkMembershipForUser(context, username), rolesAllowedToModify);
}

function checkAuth(permission: string, role: string, rolesAllowedToModify: string[]) {
  return rolesAllowedToModify.includes(permission) || rolesAllowedToModify.includes(role);
}

async function checkCollaboratorPermission(context: Context, username: string) {
  const { owner, name } = context.payload.repository;
  try {
    const response = await context.octokit.rest.repos.getCollaboratorPermissionLevel({
      owner: returnOptional(owner?.login),
      repo: name,
      username,
    });
    return response.data.permission;
  } catch (error) {
    return "none";
  }
}

async function checkMembershipForUser(context: Context, username: string) {
  const { octokit, payload } = context;
  if (!payload.organization) throw new Error(`No organization found in payload!`);
  try {
    const { data: membership } = await octokit.rest.orgs.getMembershipForUser({
      org: payload.organization.login,
      username,
    });

    return membership.role;
  } catch (error) {
    return "none";
  }
}
