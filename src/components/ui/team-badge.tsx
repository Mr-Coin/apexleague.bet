import * as React from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export interface TeamBadgeProps {
  icon: React.ReactNode;
  name: string;
  description: string;
  color: string;
  backgroundColor: string;
  textColor: string;
  count?: number;
  className?: string;
}

export function TeamBadge({ 
  icon, 
  name, 
  description, 
  color, 
  backgroundColor, 
  textColor, 
  count = 1,
  className 
}: TeamBadgeProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className={cn(
              "inline-flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-200 hover:scale-110 cursor-pointer relative",
              backgroundColor,
              textColor,
              className
            )}
            style={{ borderColor: color }}
          >
            <div className="w-4 h-4 flex items-center justify-center">
              {icon}
            </div>
            {count > 1 && (
              <span className="absolute -top-2 -right-2 bg-slate-600/80 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-medium backdrop-blur-sm border border-slate-500/30">
                {count}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-center">
            <p className="font-semibold">{name}</p>
            <p className="text-sm text-muted-foreground">{description}</p>
            {count > 1 && (
              <p className="text-xs text-muted-foreground mt-1">
                Earned {count} times
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
