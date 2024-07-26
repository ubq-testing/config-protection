import { RestEndpointMethodTypes } from "@octokit/rest";

export type ListCommits = RestEndpointMethodTypes["repos"]["listCommits"]["response"]["data"][0];
export type GetCommits = RestEndpointMethodTypes["repos"]["getCommit"]["response"];
export type GetContent = Omit<RestEndpointMethodTypes["repos"]["getContent"]["response"], "data"> & { data: { content: string; sha: string } };
