import { logoutAction } from "@/app/auth-actions";

/** Signed-in user and sign-out (a plain server-action form, no client JS). */
export function UserBox({ name, email }: { name: string; email: string }) {
	return (
		<div className="flex items-center gap-3">
			<div
				aria-hidden="true"
				className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-zinc-200"
			>
				{name.trim().charAt(0).toUpperCase()}
			</div>
			<div className="min-w-0 flex-1">
				<p className="truncate text-sm font-medium text-zinc-100">{name}</p>
				<p className="truncate text-xs text-zinc-500">{email}</p>
			</div>
			<form action={logoutAction}>
				<button
					type="submit"
					title="Cerrar sesión"
					className="rounded-md border border-white/10 px-2.5 py-1.5 text-xs font-semibold text-zinc-400 hover:border-white/25 hover:text-zinc-100"
				>
					Salir
				</button>
			</form>
		</div>
	);
}
