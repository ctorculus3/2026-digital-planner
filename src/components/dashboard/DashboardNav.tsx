import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { LayoutDashboard, BookOpen, Users } from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "Journal", path: "/journal", icon: BookOpen },
  { label: "Community", path: "/community", icon: Users },
];

export function DashboardNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="bg-[hsl(var(--time-section-bg))] border-b border-border">
      <div className="flex items-center justify-center gap-1 px-4 py-1.5">
        {NAV_ITEMS.map(({ label, path, icon: Icon }) => {
          const isActive = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-header-bg text-primary-foreground shadow-sm"
                  : "text-foreground/70 hover:text-foreground hover:bg-background/50"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
