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
  const [isMobileDescriptionVisible, setIsMobileDescriptionVisible] = React.useState(false);

  const handleClick = () => {
    // On mobile, toggle the description visibility
    if (window.innerWidth <= 768) {
      setIsMobileDescriptionVisible(!isMobileDescriptionVisible);
    }
  };

  return (
    <div className="relative">
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
              onClick={handleClick}
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

      {/* Mobile Description Popup */}
      {isMobileDescriptionVisible && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50">
          <div className="bg-popover border border-border rounded-lg p-3 shadow-lg max-w-48 text-center">
            <p className="font-semibold text-sm">{name}</p>
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
            {count > 1 && (
              <p className="text-xs text-muted-foreground mt-1">
                Earned {count} times
              </p>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMobileDescriptionVisible(false);
              }}
              className="mt-2 text-xs text-primary hover:text-primary/80 underline"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
