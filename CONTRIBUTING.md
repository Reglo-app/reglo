# Contributing to REGLO

Short guide for the team. Read it once, then keep it as a reference.

## 1. Branches

| Branch | Purpose | Deployed to |
|---|---|---|
| `main` | Stable code | Production |
| `develop` | Integration of finished work | Pre-production |
| `feature/US-xx-short-name` | One user story | Nobody (local only) |

Rules:
- Nobody pushes directly to `main` or `develop`. Everything goes through a pull request (PR).
- Work branches are created from `develop`.
- Other branch prefixes: `fix/short-name`, `chore/short-name`, `docs/short-name`.

Examples: `feature/US-01-activate-organization`, `fix/login-lockout`, `chore/add-docker-compose`.

## 2. Daily workflow

### Step 1: Start from an up-to-date `develop`
```
git checkout develop
git pull origin develop
```

### Step 2: Create your branch
```
git checkout -b feature/US-02-secure-login
```

### Step 3: Code, then commit often
```
git add .
git status
git commit -m "feat: add login form"
```
Check `git status` before each commit: no `.env` file, no secret, no unwanted file.

### Step 4: Push your branch
```
git push -u origin feature/US-02-secure-login
```
(After the first push, `git push` is enough.)

### Step 5: Open a pull request
1. On GitHub, click **Compare & pull request**.
2. Check that **base** is `develop`.
3. Fill in the template (linked user story, description, checklist).
4. Click **Create pull request**.

### Step 6: Review
- Another team member reviews the PR: **Files changed** > **Review changes** > **Approve** (or **Request changes**).
- Code owners are requested automatically (see `.github/CODEOWNERS`).
- Fix the comments with new commits on the same branch. Do not open a new PR.
- Resolve all conversations before merging.

### Step 7: Merge
- The CI must be green.
- Use **Squash and merge**. The PR title becomes the commit message, so it must follow the commit convention.
- Delete the branch after the merge.

### Step 8: Clean up locally
```
git checkout develop
git pull origin develop
git branch -D feature/US-02-secure-login
```

## 3. Commit convention

Format: `type: short description`

- In English, lowercase, imperative mood ("add", not "added").
- No period at the end. 72 characters maximum.

| Type | Use for |
|---|---|
| `feat` | A new feature |
| `fix` | A bug fix |
| `docs` | Documentation only |
| `chore` | Config, tooling, dependencies |
| `test` | Adding or updating tests |
| `refactor` | Code change without behavior change |
| `ci` | GitHub Actions pipelines |

Good: `feat: add organization creation`, `fix: block login after 5 failed attempts`.
Bad: `update`, `wip`, `fix stuff`, `Added login`.

Optional scope: `feat(api): add organization endpoint`, `fix(web): correct score chart`.

## 4. Pull request rules

- One PR = one user story (or one small task). Keep it small and easy to review.
- The PR must link its user story (`Closes #12`).
- Tests are added or updated with the code.
- Lint and tests must pass locally before pushing.
- Never commit secrets, passwords, tokens or `.env` files. Use `.env.example` for variable names only.

## 5. Project structure

```
reglo/
  api/            Backend: Symfony + API Platform (PHP)
  web/            Frontend: Next.js (TypeScript)
  data-service/   Data service: Python / FastAPI
  .github/        CI workflows, CODEOWNERS, PR template
```

## 6. Releases

- `develop` is deployed to pre-production automatically after each merge.
- To release: open a PR `develop` > `main`. After the merge, the production deployment waits for a manual approval.

## 7. Common mistakes

**Wrong commit message (not pushed yet)**
```
git commit --amend -m "feat: correct message"
```

**Commit made on the wrong branch (not pushed yet)**
```
git branch feature/my-branch
git reset --hard origin/develop
git checkout feature/my-branch
```

**My branch is behind `develop`**
```
git checkout develop
git pull origin develop
git checkout feature/my-branch
git merge develop
```

**Push rejected on `develop` or `main`**
This is expected: the branches are protected. Create a work branch and open a PR.

**Merge conflict**
Do not panic. Open the conflicting files, keep the right code, remove the `<<<<<<<` markers, then:
```
git add .
git commit -m "chore: resolve merge conflicts"
```
If unsure, ask the team before pushing.

## 8. Quick rules

1. Never work directly on `develop` or `main`.
2. Always pull before creating a branch.
3. Small commits, clear messages, in English.
4. One PR per user story, reviewed by someone else.
5. Never commit secrets.
