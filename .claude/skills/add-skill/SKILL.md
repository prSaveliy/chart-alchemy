---
allowed-tools: Write, Bash(mkdir:*)
description: Guide for creating new skills
argument-hint: [skill-name] [description]
---

# Skill Creator Guide

## How This Skill Works

The `/add-skill` skill shows this guide for creating new skills. It includes:

- Skill structure and syntax
- Common patterns and examples
- Security restrictions and limitations
- Frontmatter options

**Note for AI**: When creating skills, you CAN use bash tools like `Bash(mkdir:*)`, `Bash(ls:*)`, `Bash(git:*)` in the `allowed-tools` frontmatter of NEW skills - but ONLY for operations within the current project directory. This skill itself only needs `mkdir` to create new skill directories.

## Skill Locations

- **Personal**: `~/.claude/skills/` (available across all projects)
- **Project**: `.claude/skills/` (available in the repo root - shared with anyone who clones the project)

## Basic Structure

Each skill lives in its own directory with a `SKILL.md` file:

```
.claude/skills/
└── my-skill/
    └── SKILL.md
```

```markdown
---
allowed-tools: Read, Edit, Write, Bash(git:*)
description: Brief description of what this skill does
argument-hint: [required-arg] [optional-arg]
model: claude-sonnet-4-6
---

# Skill Title

Your skill instructions here.

Arguments: $ARGUMENTS

File reference: @path/to/file.js

Bash command output: (exclamation)git status(backticks)
```

## ⚠️ Security Restrictions

**Bash Commands (exclamation prefix)**: Limited to current working directory only.

- ✅ Works: `! + backtick + git status + backtick` (in project dir)
- ❌ Blocked: `! + backtick + ls /outside/project + backtick` (outside project)
- ❌ Blocked: `! + backtick + pwd + backtick` (if referencing dirs outside project)

**File References (`@` prefix)**: No directory restrictions.

- ✅ Works: `@/path/to/system/file.md`
- ✅ Works: `@../other-project/file.js`

## Common Patterns

### Simple Skill

```bash
mkdir -p ~/.claude/skills/review && echo "Review this code for bugs and suggest fixes" > ~/.claude/skills/review/SKILL.md
```

### Skill with Arguments

```markdown
Fix issue #$ARGUMENTS following our coding standards
```

### Skill with File References

```markdown
Compare @src/old.js with @src/new.js and explain differences
```

### Skill with Bash Output (Project Directory Only)

```markdown
---
allowed-tools: Bash(git:*)
---

Current status: (!)git status(`)
Current branch: (!)git branch --show-current(`)
Recent commits: (!)git log --oneline -5(`)

Create commit for these changes.
```

**Note**: Only works with skills in the current project directory.

## Frontmatter Options

- `allowed-tools`: Tools this skill can use
- `description`: Brief description (shows in /help)
- `argument-hint`: Help text for arguments
- `model`: Specific model to use

## Best Practices

### Safe Skills (No Security Issues)

```markdown
# System prompt editor (file reference only)

(@)path/to/system/prompt.md

Edit your system prompt above.
```

### Project-Specific Skills (Bash OK)

```markdown
---
allowed-tools: Bash(git:*), Bash(npm:*)
---

Current git status: (!)git status(`)
Package info: (!)npm list --depth=0(`)

Review project state and suggest next steps.
```

### Cross-Directory File Access (Use @ not !)

```markdown
# Compare config files

Compare (@)path/to/system.md with (@)project/config.md

Show differences and suggest improvements.
```

## Usage

After creating: `/<skill-name> [arguments]`

Example: `/review`
