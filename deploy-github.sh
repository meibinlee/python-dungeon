#!/bin/bash
# Run from your own terminal: bash ./deploy-github.sh
# Creates a public python-dungeon repository and publishes the static game.
set -euo pipefail
cd "$(dirname "$0")"

command -v gh >/dev/null || { echo 'GitHub CLI(gh)가 필요합니다.' >&2; exit 1; }
command -v git >/dev/null || { echo 'Git이 필요합니다.' >&2; exit 1; }

# Block publication when answer/combat checks or duplicate-question checks fail.
command -v node >/dev/null || { echo '배포 전 검증을 위한 Node.js가 필요합니다 (npm 설치는 필요 없음).' >&2; exit 1; }
command -v python3 >/dev/null || { echo '문제 검증을 위한 Python 3가 필요합니다.' >&2; exit 1; }
node --experimental-vm-modules tests/check-game.cjs

# Verify real API access before modifying the project or creating anything.
quest_owner=$(gh api user --jq '.login')
quest_user_id=$(gh api user --jq '.id')
quest_repo="$quest_owner/python-dungeon"
quest_remote="https://github.com/$quest_repo.git"

if [ ! -d .git ]; then
  if gh repo view "$quest_repo" --json name --jq '.name' >/dev/null 2>&1; then
    echo "이미 존재하는 저장소입니다: https://github.com/$quest_repo" >&2
    echo '기존 내용을 확인한 후 연결해야 하므로 여기서 중단합니다.' >&2
    exit 1
  fi
  git init -b main
fi

if [ "$(git branch --show-current)" != main ]; then
  echo '현재 브랜치가 main이 아닙니다. 기존 작업 보호를 위해 중단합니다.' >&2
  exit 1
fi

if git remote get-url origin >/dev/null 2>&1; then
  if [ "$(git remote get-url origin)" != "$quest_remote" ]; then
    echo 'origin이 다른 저장소를 가리킵니다. 기존 연결을 보존하고 중단합니다.' >&2
    exit 1
  fi
else
  if ! gh repo view "$quest_repo" --json name --jq '.name' >/dev/null 2>&1; then
    gh repo create "$quest_repo" --public \
      --description 'CODE QUEST — 명빈T의 코딩 던전: 중학교 정보 수업용 2인 협동 웹게임'
  fi
  git remote add origin "$quest_remote"
fi

# Explicit paths avoid uploading unrelated local files or credentials.
git add index.html README.md AGENTS.md css js assets tests .nojekyll .gitignore deploy-github.sh
if ! git diff --cached --quiet; then
  git -c "user.name=$quest_owner" \
    -c "user.email=$quest_user_id+$quest_owner@users.noreply.github.com" \
    commit -m 'Add playable CODE QUEST classroom MVP'
fi

# Uses the existing gh login without changing global credential settings.
# No force push: remote history is preserved if it has diverged.
git -c credential.helper= -c 'credential.helper=!gh auth git-credential' push -u origin main

if gh api "repos/$quest_repo/pages" --silent 2>/dev/null; then
  gh api --method PUT "repos/$quest_repo/pages" \
    -f build_type=legacy -f 'source[branch]=main' -f 'source[path]=/' --silent
else
  gh api --method POST "repos/$quest_repo/pages" \
    -f build_type=legacy -f 'source[branch]=main' -f 'source[path]=/' --silent
fi

quest_site=$(gh api "repos/$quest_repo/pages" --jq '.html_url')
echo "저장소: https://github.com/$quest_repo"
echo "Pages 설정 완료: $quest_site"
echo '아직 배포 빌드 중일 수 있습니다. 저장소 Actions에서 완료를 확인한 뒤 사이트를 여세요.'
