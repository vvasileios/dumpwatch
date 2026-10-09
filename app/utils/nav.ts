export interface NavItem {
    label: string;
    to: string;
    icon: string;
    description: string;
    roles?: string[];
}

export const navItems: NavItem[] = [
    { label: "Map", to: "/", icon: "lucide:map", description: "Reported dumps across the city" },
    { label: "Reports", to: "/reports", icon: "lucide:flag", description: "Browse and track reports" },
    {
        label: "Collection points",
        to: "/collection-points",
        icon: "lucide:trash-2",
        description: "Nearby collection and drop-off points",
        roles: ["moderator", "admin"],
    },
    {
        label: "Zones",
        to: "/zones",
        icon: "lucide:chart-pie",
        description: "Dashboard for each zone",
        roles: ["moderator", "admin"],
    },
];

export function visibleNav(role?: string | null) {
    return navItems.filter((i) => !i.roles || (role && i.roles.includes(role)));
}
