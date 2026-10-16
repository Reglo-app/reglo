import { UserMenu } from "@/components/shell/user-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { ROLE_LABELS, api } from "@/lib/api";

/** Loads the signed-in user and renders the topbar user menu. */
export async function CurrentUserMenu() {
    const user = await api.getCurrentUser();

    return (
        <UserMenu
            fullName={`${user.firstName} ${user.lastName}`}
            roleLabel={ROLE_LABELS[user.role]}
            organizationName={user.organization.name}
        />
    );
}

export function CurrentUserMenuSkeleton() {
    return (
        <div className="flex items-center gap-3" aria-hidden="true">
            <Skeleton className="size-8 rounded-sm" />
            <Skeleton className="hidden h-8 w-28 md:block" />
        </div>
    );
}
