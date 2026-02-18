import { Badge } from "@/components/ui/badge";

type Plan = "monthly" | "yearly";

interface PlanToggleProps {
  selectedPlan: Plan;
  onPlanChange: (plan: Plan) => void;
}

export function PlanToggle({ selectedPlan, onPlanChange }: PlanToggleProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="inline-flex rounded-lg bg-muted p-1">
        <button
          onClick={() => onPlanChange("monthly")}
          className={`rounded-md px-4 py-2 text-sm font-medium transition-all ${
            selectedPlan === "monthly"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Monthly
        </button>
        <button
          onClick={() => onPlanChange("yearly")}
          className={`rounded-md px-4 py-2 text-sm font-medium transition-all relative ${
            selectedPlan === "yearly"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Yearly
          <Badge variant="default" className="absolute -top-2.5 -right-3 text-[10px] px-1.5 py-0 leading-4 bg-header-bg text-primary-foreground border-0">
            BEST VALUE
          </Badge>
        </button>
      </div>
      {selectedPlan === "yearly" && (
        <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
          Save 17%
        </Badge>
      )}
    </div>
  );
}
