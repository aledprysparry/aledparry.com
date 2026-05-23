/**
 * Atomically commits one or more files to a GitHub repo via the Git Data API.
 *
 * Why this exists: the admin form needs to persist case-study edits in a way
 * that survives a Vercel serverless cold start. Writing to the runtime filesystem
 * works only on `npm run dev`; on Vercel, `fs.writeFileSync` either errors or
 * lands in /tmp and vanishes. Committing to git is the durable path — and as a
 * bonus, the push triggers a Vercel rebuild so the change goes live in ~2 min.
 */

const API = "https://api.github.com";

export interface CommitFile {
  path: string; // repo-relative, e.g. "content/case-studies/foo.mdx"
  content: string | Buffer; // text for MDX, Buffer for images
}

export interface CommitResult {
  commitSha: string;
  commitUrl: string;
}

interface CommitOpts {
  owner: string;
  repo: string;
  branch: string;
  message: string;
  files: CommitFile[];
  token: string;
  authorName?: string;
  authorEmail?: string;
}

export async function commitFiles(opts: CommitOpts): Promise<CommitResult> {
  const { owner, repo, branch, message, files, token } = opts;
  const authorName = opts.authorName || "Aled Parry (Admin)";
  const authorEmail = opts.authorEmail || "aled@aledparry.com";

  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  const repoApi = `${API}/repos/${owner}/${repo}`;

  // 1. Get current HEAD commit SHA for the target branch
  const refRes = await fetch(`${repoApi}/git/ref/heads/${branch}`, { headers });
  if (!refRes.ok) throw await ghError("read branch ref", refRes);
  const headSha = (await refRes.json()).object.sha as string;

  // 2. Get the tree SHA of that commit (we'll use as base_tree)
  const commitRes = await fetch(`${repoApi}/git/commits/${headSha}`, { headers });
  if (!commitRes.ok) throw await ghError("read head commit", commitRes);
  const baseTreeSha = (await commitRes.json()).tree.sha as string;

  // 3. Create a blob for each file, in parallel
  const blobs = await Promise.all(
    files.map(async (file) => {
      const isBuffer = Buffer.isBuffer(file.content);
      const blobRes = await fetch(`${repoApi}/git/blobs`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          content: isBuffer ? (file.content as Buffer).toString("base64") : file.content,
          encoding: isBuffer ? "base64" : "utf-8",
        }),
      });
      if (!blobRes.ok) throw await ghError(`create blob for ${file.path}`, blobRes);
      return { path: file.path, sha: (await blobRes.json()).sha as string };
    })
  );

  // 4. Build a new tree on top of the base
  const treeRes = await fetch(`${repoApi}/git/trees`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({
      base_tree: baseTreeSha,
      tree: blobs.map((b) => ({
        path: b.path,
        mode: "100644",
        type: "blob",
        sha: b.sha,
      })),
    }),
  });
  if (!treeRes.ok) throw await ghError("create tree", treeRes);
  const newTreeSha = (await treeRes.json()).sha as string;

  // 5. Create the commit pointing at the new tree
  const newCommitRes = await fetch(`${repoApi}/git/commits`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      tree: newTreeSha,
      parents: [headSha],
      author: { name: authorName, email: authorEmail, date: new Date().toISOString() },
      committer: { name: authorName, email: authorEmail, date: new Date().toISOString() },
    }),
  });
  if (!newCommitRes.ok) throw await ghError("create commit", newCommitRes);
  const newCommit = await newCommitRes.json();

  // 6. Move the branch ref forward
  const updateRefRes = await fetch(`${repoApi}/git/refs/heads/${branch}`, {
    method: "PATCH",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ sha: newCommit.sha }),
  });
  if (!updateRefRes.ok) throw await ghError("update branch ref", updateRefRes);

  return {
    commitSha: newCommit.sha as string,
    commitUrl: newCommit.html_url as string,
  };
}

async function ghError(step: string, res: Response): Promise<Error> {
  let body = "";
  try {
    body = await res.text();
  } catch {
    body = "(no body)";
  }
  return new Error(`GitHub API ${step} failed: ${res.status} ${res.statusText} — ${body.slice(0, 300)}`);
}

interface FetchFileOpts {
  owner: string;
  repo: string;
  branch: string;
  path: string;
  token: string;
}

/**
 * Reads a single file from GitHub via the Contents API. Returns the decoded
 * file contents as a string, or null if the file does not exist on the branch.
 *
 * Why this exists: when admin saves are committed to GitHub, the local container
 * filesystem stays stale until the next Vercel rebuild completes (~2 min window).
 * Reading from GitHub closes that loop so two quick edits in a row don't clobber
 * the in-flight commit. Falls back to local fs when the token isn't set.
 */
export async function fetchFile(opts: FetchFileOpts): Promise<string | null> {
  const { owner, repo, branch, path: filePath, token } = opts;
  const url = `${API}/repos/${owner}/${repo}/contents/${encodeURI(filePath)}?ref=${encodeURIComponent(branch)}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    cache: "no-store", // never serve stale; defeats Vercel's data cache too
  });
  if (res.status === 404) return null;
  if (!res.ok) throw await ghError(`read ${filePath}`, res);

  const data = await res.json();
  if (Array.isArray(data) || data.type !== "file") {
    throw new Error(`Path ${filePath} is not a file`);
  }
  return Buffer.from(data.content as string, "base64").toString("utf-8");
}
