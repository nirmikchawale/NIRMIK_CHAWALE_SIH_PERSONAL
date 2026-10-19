#!/usr/bin/env python3
"""Fail-closed CERT-07 Stage A evidence reconciliation; never a public deployment."""
from __future__ import annotations
import datetime as dt
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import urllib.request

ROOT=Path(__file__).resolve().parents[1]
SOURCE_SHA="2736f2f3f3446981ebba563d5b90e010b0bb10c6"
API="https://api.github.com/repos/"+os.environ.get("GITHUB_REPOSITORY","nirmikchawale/NIRMIK_CHAWALE_SIH_PERSONAL")
REQUIRED_RUNS={
 "CERT02":39151385194,
 "CERT03":39151385036,
 "CERT04":39151385066,
 "CERT05":39151385043,
 "CERT06":39151385085,
 "scientific_source":39151385019,
 "python":39151385152,
}
NEEDED_ASSETS={
 "CERT04":[("m095-stage-a-real-chromium-evidence",60000000)],
 "CERT05":[("cert05-stage-a-real-recovery-perf",300)],
 "CERT06":[("cert06-native-api-science",200),("cert06-genuine-integrated-browser",400)]
}
GROUPS=[
(8,15,"RECOVERY_DEVELOPMENT_EVIDENCE"),
(16,23,"SCIENTIFIC_CONTRACTS_DEVELOPED"),
(24,31,"PARTIAL_COMPETITOR_RESEARCH"),
(32,39,"PROVIDER_ADAPTERS_INCOMPLETE"),
(40,47,"AUTHENTIC_IO087_SOURCE_NOT_ACQUIRED"),
(48,55,"METADATA_ONLY_NO_LIVE_105_CELL_QUERIES"),
(56,63,"MATCHUP_ENGINE_FIXTURES_ONLY"),
(64,71,"NATIVE_3D_DEVELOPMENT_TESTED"),
(72,79,"NATIVE_TEMPORAL_DEVELOPMENT_CONTRACTS"),
(80,87,"18_THEMES_DEVELOPMENT_CHROMIUM_CERTIFIED"),
(88,95,"HARDENING_DEVELOPMENT_CERTIFIED_RELEASE_PENDING"),
]

def guard(ok,description):
    if not ok:
        raise SystemExit("CERT-07 refusal: "+description)

def shell(*args):
    return subprocess.check_output(["git",*args],cwd=ROOT,text=True).strip()

def request(path):
    token=os.environ.get("GITHUB_TOKEN")
    guard(bool(token),"missing GITHUB_TOKEN, cannot independently certify GitHub CI")
    headers={"Accept":"application/vnd.github+json",
      "Authorization":"Bearer "+token,
      "User-Agent":"ocean-canvas-cert07-attestation",
      "X-GitHub-Api-Version":"2022-11-28"}
    with urllib.request.urlopen(urllib.request.Request(API+path,headers=headers),timeout=40) as response:
        return json.load(response)

def main():
    head=shell("rev-parse","HEAD")
    guard(head==os.environ.get("CERT07_HEAD_SHA"),"checkout is not exact draft head")
    files=shell("diff","--name-only",SOURCE_SHA,head).splitlines()
    allowed={
     ".github/workflows/cert07-stage-a-handoff.yml",
     "scripts/cert07_stage_a_handoff.py",
     "docs/requirements/CERT07_FINAL_STAGE_A_HANDOFF.md",
     "docs/requirements/CERT07_M008_M095_PHASE_MATRIX.md"}
    guard(set(files)==allowed,"unexpected runtime, source, release or missing handoff diff: "+repr(files))
    pr=request("/pulls/204")
    guard(pr["head"]["sha"]==head and pr["draft"] and
          pr["state"]=="open" and pr.get("merged_at") is None,
          "stage A head/draft/merge state changed")
    main_sha=request("/commits/main")["sha"]

    root=ROOT/"frontend/public/main-blocks"
    inventory=json.loads((root/"manifest.json").read_text())
    blocks=inventory["blocks"]
    pilots=[b for b in blocks if b["materialization"]=="pilot"]
    planned=[b for b in blocks if b["materialization"]=="planned"]
    guard((len(blocks),len(pilots),len(planned))==(140,35,105),"original 140/35/105 register changed")
    guard(len({b["id"] for b in blocks})==140,"duplicate original block ID")
    guard(not inventory["integrity"]["synthetic_measurements"] and
          not inventory["integrity"]["synthetic_timestamps"] and
          not inventory["integrity"]["vertical_component_available"],
          "unexpected synthetic or fabricated vertical-current source")
    frames=[]
    for block in pilots:
        for frame in block["payloads"]:
            p=root/frame["path"]
            guard(p.is_file(),"source frame disappeared: "+str(p))
            digest=hashlib.sha256(p.read_bytes()).hexdigest()
            guard(digest==frame["sha256"],"source SHA-256 mismatch: "+str(p))
            frames.append({"id":block["id"],"date":frame["date"],"sha256":digest})
    guard(len(frames)==41 and sum(len(b["payloads"])==2 for b in pilots)==6,
          "41 real frames / 6 multi-date original pilots missing")

    themes=(ROOT/"frontend/src/theme.ts").read_text()
    ids_block=re.search(r"export const GLASS_THEME_IDS\s*=\s*\[(.*?)\]\s*as const",themes,re.S)
    guard(ids_block is not None,"theme registry missing")
    ids=re.findall(r'"([^"]+)"',ids_block.group(1))
    guard(len(ids)==18 and len(set(ids))==18 and ids[9]=="arctic-mist"
          and ids[-2:]==["system-light","system-dark"]
          and 'DEFAULT_GLASS_THEME: GlassThemeId = "arctic-mist"' in themes,
          "18 preserved glass designs or Arctic Mist default invalid")
    roadmap=(ROOT/"docs/requirements/M008_M095_BUILD_FIRST_MASTER_PROTOCOL.md").read_text()
    phase_ids=re.findall(r"^\|\s*(M0\d{2})\s*\|\s*[^|]+\|\s*[^|]+\|\s*QUEUED\s*\|",roadmap,re.M)
    guard(phase_ids==["M%03d"%i for i in range(8,96)],"88 canonical M phases not contiguous")
    matrix=(ROOT/"docs/requirements/CERT07_M008_M095_PHASE_MATRIX.md").read_text()
    for pid in phase_ids:
        guard(matrix.count("| "+pid+" |")==1,"missing/duplicated phase in release matrix "+pid)

    real_runs={}
    for name,number in REQUIRED_RUNS.items():
        run=request("/actions/runs/"+str(number))
        guard(run["head_sha"]==SOURCE_SHA and run["status"]=="completed"
              and run["conclusion"]=="success",
              name+" not actually successful on immutable certified source SHA")
        record={"run_id":number,"sha":run["head_sha"],"conclusion":"success",
                "url":run["html_url"]}
        required=NEEDED_ASSETS.get(name,[])
        if required:
            assets=request("/actions/runs/"+str(number)+"/artifacts?per_page=100")["artifacts"]
            record["artifacts"]=[]
            for exact_name,min_size in required:
                match=next((a for a in assets if a["name"]==exact_name
                            and not a["expired"] and a["size_in_bytes"]>=min_size),None)
                guard(match is not None,"missing/undersized evidence "+name+" "+exact_name)
                record["artifacts"].append({
                    "name":match["name"],"id":match["id"],
                    "bytes":match["size_in_bytes"],"url":match["archive_download_url"]})
        real_runs[name]=record

    failed_release={}
    for label,number in [
      ("mixed_science_frontend_only_scope",39151385087),
      ("full_production_browser_shards",39151385034)
    ]:
        run=request("/actions/runs/"+str(number))
        guard(run["head_sha"]==SOURCE_SHA and run["conclusion"]=="failure",
              "release failure receipt unexpectedly changed; re-audit instead")
        failed_release[label]={"run_id":number,"status":"UNRESOLVED", "url":run["html_url"]}

    phase_states=[]
    for i in range(8,96):
        classification=next(s for lo,hi,s in GROUPS if lo<=i<=hi)
        phase_states.append({"id":"M%03d"%i,"development_state":classification,
          "full_live_and_publicly_certified":False})
    evidence={
      "schema":"oceancanvas-cert07-stage-a-handoff-v1",
      "audited_utc":dt.datetime.now(dt.timezone.utc).isoformat(),
      "source_certified_sha":SOURCE_SHA,"handoff_commit_sha":head,
      "source_to_handoff_changes":files,
      "draft_pr":204,"main_sha_at_audit":main_sha,
      "original_science":{"logical_blocks":140,"original_source_backed_pilots":35,
        "unmaterialized_planned_blocks":105,"original_source_frames":len(frames),
        "original_frame_sha256":frames,"genuine_2024_IO087_frames_acquired":0,
        "new_2024_IO087_matched_profiles":0,"gpu_performance_measurement":"UNMEASURED"},
      "ui":{"glass_themes":ids,"theme_count":18,"default":"arctic-mist"},
      "past_exact_source_passed_development_runs":real_runs,
      "known_failed_release_gates":failed_release,
      "m008_m095":{"count":88,"fully_live_certified":0,"phase_states":phase_states},
      "handoff_scope":"STAGE_A_DEV_CERTIFICATION_ONLY",
      "stage_a_handoff_evidence_complete":True,
      "production_release_approved":False,"source_promoted_to_main":False,
      "pages_published_by_cert07":False,
      "stage_b_owner":"Independent Integration Testing and Merge campaign"}
    dest=ROOT/"certification-evidence/cert07"
    dest.mkdir(parents=True,exist_ok=True)
    (dest/"CERT07_STAGE_A_EVIDENCE.json").write_text(json.dumps(evidence,sort_keys=True,indent=2)+"\n")
    lines=["# CERT-07 Stage A attestation","",
      "**PASS — only full Stage A evidence and controlled deployment handoff.**","",
      "- Exact certified source: "+SOURCE_SHA,
      "- Document-only head: "+head,
      "- Live main at audit: "+main_sha,
      "- Verified 41 original source frames and 18 real glass themes.",
      "- Verified genuine prior CERT02–CERT06 successful run and artifact references.",
      "- 88 M008–M095 phase IDs reconciled; fully publicly certified: **0**.",
      "- IO-087 raw source absent; broader provider/rights and production browser blockers documented.",
      "- No merge, deployment, waiver of MPR scope or public success assertion.",
      "","See committed CERT07_FINAL_STAGE_A_HANDOFF.md and CERT07_M008_M095_PHASE_MATRIX.md."]
    (dest/"CERT07_READABLE_SUMMARY.md").write_text("\n".join(lines)+"\n")
    print("CERT-07 Stage A complete: source-hash, exact-head CI artifacts and full 88-phase handoff audited.")
    print("Publicly certified: 0/88; Stage B remains separate and unapproved.")
if __name__=="__main__":
    main()
