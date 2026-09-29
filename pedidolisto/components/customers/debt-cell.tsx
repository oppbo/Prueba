import type { AccountDetail } from "@/lib/domain/accounts";
import { formatMoney } from "@/lib/format";

/** Debt amount with a calm overdue indicator underneath. */
export function DebtCell({ account }: { account: AccountDetail }) {
  if (account.currentDebt <= 0) return <span className="text-sm text-muted-foreground">—</span>;
  return (
    <div className="text-right whitespace-nowrap">
      <p className="text-sm font-medium tabular">{formatMoney(account.currentDebt)}</p>
      {account.overdueDebt > 0 && (
        <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-destructive tabular">
          <span className="size-1.5 rounded-full bg-destructive" aria-hidden />
          {formatMoney(account.overdueDebt)} vencido
        </p>
      )}
    </div>
  );
}
