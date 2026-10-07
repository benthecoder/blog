# Type checking

Run `pnpm typecheck` for a full-project check with TypeScript 7.0.2's native compiler. CI and the commit hook use the same command.

Next.js's build checker, its editor plugin, ESLint and other compiler-API consumers resolve `typescript` to Microsoft's `@typescript/typescript6` compatibility package. That package is pinned at 6.0.2; the lockfile resolves its underlying JavaScript compiler to 6.0.3. `pnpm exec tsc6 --noEmit` checks the complete project with that compiler if needed. `pnpm build` also runs Next's type check.

The native compiler is installed under the `@typescript/native` npm alias and provides the `tsc` executable. Both compilers use the same `tsconfig.json`. Keep the compatibility package while these tools require the JavaScript compiler API; TypeScript 7's API is currently unstable.

The old `baseUrl` setting has been removed. Existing `@/*` mappings already use relative paths and work without it. Strict checking and the Next plugin remain enabled.

This setup follows [Microsoft's side-by-side migration guidance](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/).
