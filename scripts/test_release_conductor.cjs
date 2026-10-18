"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const {
  CONFIG, isEnrolled, relevantRuns, evaluateRuns,
  changedPathsNeedMPR, shouldBlockMerge, listRuns
} = require("../.github/scripts/release-conductor.cjs");

const makePR = (overrides = {}) => ({
  number: 202,
  state: "open",
  draft: false,
  user: { login: "nirmikchawale" },
  base: { ref: "main", sha: "base" },
  head: {
    ref: "fix/m001-m007-baseline-science-release-20261018",
    sha: "candidate",
    repo: { full_name: "nirmikchawale/NIRMIK_CHAWALE_SIH_PERSONAL" }
  },
  body: "",
  ...overrides
});

const makeRun = (name, conclusion = "success", more = {}) => ({
  name, head_sha: "candidate", event: "pull_request",
  status: "completed", conclusion, id: 101,
  created_at: "2026-10-18T11:20:00Z", ...more
});

test("historical recovery #202 is never implicitly pre-approved", () => {
  assert.equal(isEnrolled(makePR()), false);
  assert.equal(isEnrolled(makePR({body: "OC-AUTO-RELEASE: approved"})), false);
  assert.equal(isEnrolled(makePR({number:204, head:{...makePR().head, ref:"build/m008-m095-science-ui-train"}, body:"OC-AUTO-RELEASE: approved"})), false);
});
test("old unrelated PRs are never merged on age or green CI alone", () => {
  for (const number of [42,58,69,77,83,94,98,103,105,107,108,140,159,200]) {
    assert.equal(isEnrolled(makePR({ number })), false);
  }
});
test("draft PRs, forks, foreign authors and non-main targets are never eligible", () => {
  assert.equal(isEnrolled(makePR({ draft: true })), false);
  assert.equal(isEnrolled(makePR({ user: { login: "attacker" } })), false);
  assert.equal(isEnrolled(makePR({ head: {
    ref:"phase/untrusted", sha:"candidate", repo:{ full_name:"evil/other" }
  } })), false);
  assert.equal(isEnrolled(makePR({ base: { ref:"legacy" } })), false);
});
test("future opt-in requires owner phase branch AND exact marker", () => {
  const future = makePR({number:501,head:{...makePR().head,ref:"phase/PH001"}});
  assert.equal(isEnrolled(future),false);
  assert.equal(isEnrolled({...future,body:"OC-AUTO-RELEASE: approved"}),true);
  assert.equal(isEnrolled({...future,head:{...future.head,ref:"random/PH001"},body:"OC-AUTO-RELEASE: approved"}),false);
});
test("required checks must all exist and pass on the exact candidate SHA", () => {
  let runs=[makeRun("tests"),makeRun("final-mvp"),makeRun("mpr-10-17-release-certification")];
  assert.equal(evaluateRuns(runs,"candidate","pull_request",["tests","final-mvp","mpr-10-17-release-certification"]).ok,true);
  assert.equal(evaluateRuns(runs,"wrong-commit","pull_request",["tests","final-mvp"]).ok,false);
  assert.equal(evaluateRuns(runs,"candidate","push",["tests","final-mvp"]).ok,false);
  assert.equal(evaluateRuns(runs,"candidate","pull_request",["tests","final-mvp","other-required"]).ok,false);
});
test("failed, skipped and still running checks are hard blockers", () => {
  for(const [status,conclusion] of [["completed","failure"],["completed","skipped"],["in_progress",null]]) {
    let runs=[makeRun("tests"),makeRun("final-mvp",conclusion,{status})];
    assert.equal(evaluateRuns(runs,"candidate","pull_request",["tests","final-mvp"]).ok,false);
  }
});
test("a newer failing rerun supersedes older successful check", () => {
  let runs=[makeRun("tests"),makeRun("final-mvp","success",{id:100,created_at:"2026-10-18T11:10:00Z"}),
    makeRun("final-mvp","failure",{id:200,created_at:"2026-10-18T11:30:00Z"})];
  assert.equal(evaluateRuns(runs,"candidate","pull_request",["tests","final-mvp"]).ok,false);
});
test("scientific workflows already triggered must also succeed", () => {
  const runs=[makeRun("tests"),makeRun("final-mvp"),makeRun("3db14-capability-audit","failure")];
  assert.equal(evaluateRuns(runs,"candidate","pull_request",["tests","final-mvp"],["3db14-capability-audit"]).ok,false);
});
test("MPR is mandatory for scientific UX renderer/test modifications", () => {
  assert.equal(changedPathsNeedMPR(["frontend/src/theme.ts"]),true);
  assert.equal(changedPathsNeedMPR(["frontend/e2e/live.spec.ts"]),true);
  assert.equal(changedPathsNeedMPR([".github/workflows/mpr-release-certification.yml"]),true);
  assert.equal(changedPathsNeedMPR(["docs/requirements/RELEASE_CONDUCTOR.md"]),false);
});
test("red exact-main status blocks all PRs including historic recovery", () => {
  assert.equal(shouldBlockMerge({ok:false},501),true);
  assert.equal(shouldBlockMerge({ok:true},501),false);
  assert.equal(shouldBlockMerge({ok:false},202),true);
  assert.equal(shouldBlockMerge({ok:false},204),true);
});
test("no emergency bypass or implicit seed survives Stage A quarantine", () => {
  assert.deepEqual(CONFIG.recoveryPRs,[]);
  assert.deepEqual(CONFIG.seededPRs,[]);
  assert.deepEqual(CONFIG.productionDispatch,["tests.yml","final-mvp.yml","deploy-pages.yml"]);
});

test("GitHub Actions exact-SHA REST envelope is correctly read, never silently empty", async () => {
  let requests = 0;
  const client = {
    rest: { actions: { listWorkflowRunsForRepo: async ({head_sha,page}) => {
      requests += 1;
      assert.equal(head_sha, "candidate");
      assert.equal(page, 1);
      return { data: { total_count: 3, workflow_runs: [
        makeRun("tests"),
        makeRun("final-mvp"),
        makeRun("deploy-oceantwin-pages", "success", { head_sha: "another-commit" })
      ] }};
    }}}
  };
  const result = await listRuns(client, CONFIG.owner, CONFIG.repo, "candidate");
  assert.equal(requests, 1);
  assert.deepEqual(result.map(x => x.name), ["tests", "final-mvp"]);
  assert.rejects(() => listRuns({rest:{actions:{listWorkflowRunsForRepo:async()=>({data:{total_count:1}})}}}, CONFIG.owner, CONFIG.repo, "candidate"),
    /missing workflow_runs/);
});

test("production conductor workflow_run events originate only from main", () => {
  const workflow = readFileSync(
    join(__dirname, "../.github/workflows/release-conductor.yml"), "utf8");
  assert.match(workflow, /workflow_run:[\\s\\S]*?types: \\[completed\\][\\s\\S]*?branches: \\[main\\]/);
});
