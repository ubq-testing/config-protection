/* eslint-disable sonarjs/no-duplicate-string */
import { http, HttpResponse } from "msw";
import { db } from "./db";
/**
 * Intercepts the routes and returns a custom payload
 */
export const handlers = [
  http.get("https://api.github.com/users/:user", ({ params: { user } }) => {
    return HttpResponse.json(db.users.findFirst({ where: { login: { equals: user as string } } }));
  }),
  // get repo
  http.get("https://api.github.com/repos/:owner/:repo", ({ params: { owner, repo } }: { params: { owner: string; repo: string } }) => {
    const item = db.repo.findFirst({ where: { name: { equals: repo }, owner: { login: { equals: owner } } } });
    if (!item) {
      return new HttpResponse(null, { status: 404 });
    }
    return HttpResponse.json(item);
  }),
  // get commit
  http.get("https://api.github.com/repos/:owner/:repo/commits/:sha", ({ params: { owner, repo, sha } }) => {
    const changes = db.commit.findFirst({
      where: { owner: { login: { equals: owner as string } }, repo: { equals: repo as string }, sha: { equals: sha as string } },
    });
    if (!changes) {
      return new HttpResponse(null, { status: 404 });
    }
    return HttpResponse.json(changes.data);
  }),
  // get collaborator permission
  http.get("https://api.github.com/repos/:owner/:repo/collaborators/:user/permission", ({ params: { user } }) => {
    switch (user) {
      case "ubiquity":
        return HttpResponse.json({ permission: "admin" });
      case "billing":
        return HttpResponse.json({ permission: "billing_manager" });
      default:
        return HttpResponse.json({ permission: "read" });
    }
  }),
  // get membership
  http.get("https://api.github.com/orgs/:org/memberships/:username", ({ params: { username } }) => {
    switch (username) {
      case "ubiquity":
        return HttpResponse.json({ role: "admin" });
      case "billing":
        return HttpResponse.json({ role: "billing_manager" });
      default:
        return HttpResponse.json({ role: "member" });
    }
  }),
  // rate limit
  http.get("https://api.github.com/rate_limit", () => {
    return HttpResponse.json({
      rate: {
        limit: 5000,
        remaining: 4999,
        reset: 1618713319,
      },
    });
  }),
  // get repo commits
  http.get("https://api.github.com/repos/:owner/:repo/commits", ({ params: { path } }) => {
    const commits = db.commit.getAll();
    if (path === ".github/ubiquibot-config.yml") {
      return HttpResponse.json(commits[0]);
    }
    return HttpResponse.json(commits[1]);
  }),
  http.get("https://api.github.com/repos/:owner/:repo/contents/:path", ({ params: { path } }) => {
    const commits = db.commit.getAll();
    if (path === ".github/ubiquibot-config.yml") {
      return HttpResponse.json(commits[0]);
    }
    return HttpResponse.json(commits[1]);
  }),
  http.put("https://api.github.com/repos/:owner/:repo/contents/:path", ({ params: { path } }) => {
    const commits = db.commit.getAll();
    if (path === ".github/ubiquibot-config.yml") {
      return HttpResponse.json(commits[0]);
    }
    return HttpResponse.json(commits[1]);
  }),
];
