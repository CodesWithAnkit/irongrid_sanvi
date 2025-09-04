
---

# 📄 AI_AGENT_CHEAT_SHEET.md
Save as: `AI_AGENT_CHEAT_SHEET.md`

```markdown
# 🤖 AI Agent Coding Cheat Sheet

This is the **short guide** for AI agents to write **safe, correct, and clean code** without scanning the full contributing doc.

---

## 🧠 Requirement First
- Always clarify **requirement, acceptance criteria, impact area, and boundaries** before coding.  
- Never assume → always ask or infer requirement first.

---

## 🎨 Frontend (Next.js + React)
✅ Do
- Put only **UI atoms** in `components/ui` (Button, Input).  
- Wrap UI + hook logic in **feature components** (LogoutButton).  
- Keep API calls in `lib/api/*`, never inside components.  
- Keep state in **Zustand stores or hooks**, not inside components.  
- Validate input with **Zod** in `lib/utils/validation.ts`.  
- Use:
  - **SSR** → user-specific pages.  
  - **ISR** → catalogs & semi-static data.  
  - **Static** → marketing pages.  

❌ Don’t
- Mix UI + API + state in one file.  
- Store tokens in localStorage/sessionStorage.  

---

## ⚙️ Backend (NestJS + Prisma + Redis + BullMQ)
✅ Do
- **Controllers** → only HTTP (req/res).  
- **Services** → business logic.  
- **Repositories** → DB access (Prisma).  
- **Jobs** → async work in `jobs/` (never inside controllers).  
- Validate input with `class-validator` in DTOs.  
- Use Redis for **sessions** and **caching hot queries**.  
- Add Prisma indexes for heavy queries, always paginate.  
- Keep Swagger docs updated for new endpoints.  

❌ Don’t
- Run background jobs inside controllers.  
- Hardcode secrets or push `.env` files.  
- Log sensitive info (passwords, tokens).  

---

## 🔑 SOLID Quick Rules
- **S** → One file = one responsibility.  
- **O** → Extend via props/services, don’t hack existing code.  
- **L** → Replaceable components/services.  
- **I** → Small DTOs/props, no god-objects.  
- **D** → Depend on abstractions, not implementations.  

---

## 🚦 Safety Nets
- Always run `npm run lint && npm run test` before commit.  
- Use **Conventional Commits** (`feat:`, `fix:`, `chore:`).  
- Get at least 1 PR review before merge.  
- Local dev must run with `docker-compose up` (DB + Redis + API).  

---

🔥 Golden Rule:  
**If unsure → create a new file/module instead of editing multiple unrelated ones.**
