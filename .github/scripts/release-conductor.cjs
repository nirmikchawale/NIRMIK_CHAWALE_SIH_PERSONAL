"use strict";

/**
 * Ocean Canvas unattended release controller.
 *
 * Runs ONLY from trusted default-branch GitHub Actions, never checks out PR
 * code, cannot bypass branch protection, and merges at most one PR per pass.
 * Owner-authored phase PRs must opt in with OC-AUTO-RELEASE: approved in body.
 * #202 is the explicitly pre-enrolled science-recovery release.
 */
const CONFIG = Object.freeze({
  owner: "nirmikchawale",
  repo: "NIRMIK_CHAWALE_SIH_PERSONAL",
  main: "main",
  seededPRs: Object.freeze([202]),
  recoveryPRs: Object.freeze([202]),
  acceptedPrefixes: Object.freeze(["phase/", "release/"]),
  enrollmentMarker: "OC-AUTO-RELEASE: approved",
  requiredPRWorkflows: Object.freeze(["tests", "final-mvp"]),
  optionalPRWorkflows: Object.freeze([
    "mpr-10-17-release-certification",
    "3db11-scale-out",
    "3db12-lod-acceptance",
    "3db13-scientific-rendering-acceptance",
    "3db14-capability-audit",
    "3db15-final-production-acceptance",
    "phase35b-pilot-materialization"
  ]),
  requiredMainWorkflows: Object.freeze([
    "tests", "final-mvp", "deploy-oceantwin-pages"
  ]),
  productionDispatch: Object.freeze([
    "tests.yml", "final-mvp.yml", "deploy-pages.yml"
  ])
});

function isEnrolled(pr, config = CONFIG) {
  if (!pr || pr.state !== "open" || pr.draft || pr.base?.ref !== config.main) {
    return false;
  }
  if (pr.head?.repo?.full_name?.toLowerCase() !==
      (config.owner + "/" + config.repo).toLowerCase()) return false;
  if (pr.user?.login?.toLowerCase() !== config.owner.toLowerCase()) return false;
  if (config.seededPRs.includes(pr.number)) return true;
  return config.acceptedPrefixes.some(prefix => pr.head.ref.startsWith(prefix))
    && String(pr.body || "").includes(config.enrollmentMarker);
}

function relevantRuns(runs, sha, event) {
  const selected = new Map();
  const ordered = [...runs].filter(run => run.head_sha === sha &&
    (!event || run.event === event))
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at) ||
      (a.id || 0) - (b.id || 0));
  for (const run of ordered) selected.set(run.name, run);
  return selected;
}

function evaluateRuns(runs, sha, event, mustHave, conditional = []) {
  const selected = relevantRuns(runs, sha, event);
  const problems = [];
  for (const name of mustHave) {
    const run = selected.get(name);
    if (!run) problems.push(name + ": missing exact-head run");
    else if (run.status !== "completed" || run.conclusion !== "success") {
      problems.push(name + ": " + run.status + "/" + String(run.conclusion));
    }
  }
  for (const name of conditional) {
    const run = selected.get(name);
    if (run && (run.status !== "completed" || run.conclusion !== "success")) {
      problems.push(name + ": " + run.status + "/" + String(run.conclusion));
    }
  }
  return { ok: problems.length === 0, problems };
}

function changedPathsNeedMPR(paths) {
  return paths.some(p =>
    p.startsWith("frontend/src/") ||
    p.startsWith("frontend/e2e/") ||
    p === "frontend/index.html" ||
    p.startsWith("docs/RUI_MPR_") ||
    p === ".github/workflows/mpr-release-certification.yml");
}

function shouldBlockMerge(mainStatus, prNumber, config = CONFIG) {
  return !mainStatus.ok && !config.recoveryPRs.includes(prNumber);
}

async function listRuns(github, owner, repo, sha) {
  // Read the concrete GitHub REST envelope instead of relying on Octokit's
  // special paginated-list normalization for { total_count, workflow_runs }.
  // The latter produced [] for a main SHA with known completed workflows.
  const matches = [];
  for (let page = 1; page <= 5; page += 1) {
    const response = await github.rest.actions.listWorkflowRunsForRepo({
      owner, repo, head_sha: sha, per_page: 100, page
    });
    const envelope = response.data;
    const entries = Array.isArray(envelope?.workflow_runs) ?
      envelope.workflow_runs : [];
    if (!Array.isArray(envelope?.workflow_runs)) {
      throw new Error("GitHub Actions response missing workflow_runs; fail closed");
    }
    for (const run of entries) {
      if (run.head_sha === sha) matches.push(run);
    }
    if (entries.length < 100) break;
  }
  return matches;
}

async function getStatus(github, owner, repo, sha, event, required, optional) {
  const runs = await listRuns(github, owner, repo, sha);
  return evaluateRuns(runs, sha, event, required, optional);
}

async function dispatch(github, owner, repo, workflows) {
  for (const workflow_id of workflows) {
    await github.rest.actions.createWorkflowDispatch({
      owner, repo, workflow_id, ref: CONFIG.main
    });
  }
}

async function runController({ github, core, context }) {
  const { owner, repo, main } = CONFIG;
  if (context.repo.owner.toLowerCase() !== owner.toLowerCase() ||
      context.repo.repo !== repo) throw new Error("Conductor configured for another repository");
  const dryRun = process.env.OC_RELEASE_DRY_RUN === "true";
  const log = message => { core.info(message); };
  const mainHead = await github.rest.repos.getCommit({ owner, repo, ref: main });
  const mainSHA = mainHead.data.sha;
  log("Ocean Canvas main " + mainSHA + "; dry-run=" + dryRun);

  const mainStatus = await getStatus(
    github, owner, repo, mainSHA, null,
    CONFIG.requiredMainWorkflows, []
  );
  log("Exact-main release gate: " +
    (mainStatus.ok ? "GREEN" : mainStatus.problems.join("; ")));

  // Release-controller merges explicitly dispatch all three workflows in
  // the SAME successful merge transaction. Never redispatch absent checks
  // from a poller: API latency or missing enumeration once caused an
  // unbounded workflow_run -> dispatch -> workflow_run feedback loop.
  // Fail closed instead; a repair agent may diagnose the missing run.
  const allMainRuns = await listRuns(github, owner, repo, mainSHA);
  const names = relevantRuns(allMainRuns, mainSHA, null);
  log("Discovered exact-main runs: " + allMainRuns.length + " => " +
    [...names.keys()].join(", "));
  const absent = CONFIG.requiredMainWorkflows.filter(n => !names.has(n));
  if (absent.length) {
    log("Missing main checks (NO automatic redispatch): " + absent.join(", "));
  }

  const entries = await github.paginate(github.rest.pulls.list, {
    owner, repo, state: "open", per_page: 100,
    sort: "created", direction: "asc"
  });
  const candidates = entries.filter(item => isEnrolled(item)).sort(
    (a, b) => Number(a.number) - Number(b.number)
  );
  log("Enrolled phase queue: " + candidates.map(p => "#" + p.number).join(", "));
  for (const candidate of candidates) {
    if (shouldBlockMerge(mainStatus, candidate.number)) {
      log("Stop: public main release is not green; do not stack phases.");
      return;
    }
    const pr = (await github.rest.pulls.get({
      owner, repo, pull_number: candidate.number
    })).data;
    if (!isEnrolled(pr) || pr.head.sha !== candidate.head.sha) {
      log("Stop: PR eligibility or head changed during inspection.");
      return;
    }
    // A PR must target the current main head. Never auto-rebase or force push.
    if (pr.base.sha !== mainSHA || pr.mergeable !== true) {
      log("Stop: candidate is out of date, conflicting, or GitHub has not determined mergeability.");
      return;
    }
    const paths = (await github.paginate(github.rest.pulls.listFiles, {
      owner, repo, pull_number: pr.number, per_page: 100
    })).map(file => file.filename);

    if (paths.length === 0) { log("Stop: empty PR."); return; }
    const required = [...CONFIG.requiredPRWorkflows];
    if (changedPathsNeedMPR(paths)) required.push("mpr-10-17-release-certification");

    const checks = await getStatus(
      github, owner, repo, pr.head.sha, "pull_request",
      required,
      CONFIG.optionalPRWorkflows.filter(x => !required.includes(x))
    );
    if (!checks.ok) {
      log("PR #" + pr.number + " BLOCKED: " + checks.problems.join("; "));
      return;
    }
    log("PR #" + pr.number + " exact-SHA CI GREEN: " + pr.head.sha);
    if (dryRun) {
      log("DRY RUN: would squash-merge and dispatch post-merge certification.");
      return;
    }
    // GitHub enforces repository branch/ruleset constraints. Never force-merge
    // or bypass review requirements, and never merge a different PR SHA.
    const merged = await github.rest.pulls.merge({
      owner, repo, pull_number: pr.number,
      sha: pr.head.sha, merge_method: "squash",
      commit_title: "release(Ocean Canvas): " + pr.title
    });
    if (!merged.data.merged) throw new Error("GitHub declined PR merge");
    log("Merged PR #" + pr.number + ": " + merged.data.sha);
    // Merges made with GITHUB_TOKEN DO NOT emit push workflows. The
    // workflow_dispatch events below are the supported way to run checks and
    // GitHub Pages on the merged exact-main tree.
    await dispatch(github, owner, repo, CONFIG.productionDispatch);
    log("Dispatched tests, final-mvp and Pages. Remaining queue locked until exact-main green.");
    return;
  }
  log("No enrolled, test-green phase to advance.");
}

module.exports = {
  CONFIG, isEnrolled, relevantRuns, evaluateRuns,
  changedPathsNeedMPR, shouldBlockMerge, listRuns, runController
};
