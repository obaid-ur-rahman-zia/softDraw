import { Hint } from "@/components/hint";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UserAvatarProps {
  src?: string;
  fallback?: string;
  name?: string;
  borderColor?: string;
}

export const UserAvatar = ({
  src,
  borderColor,
  fallback,
  name,
}: UserAvatarProps) => {
    
    return (
        <Hint label={name || "Teammate"} side="bottom" sideOffset={18}>
            <Avatar
                className="h-8 w-8 border-2"
                style={{ borderColor }}
            >
                <AvatarImage src={src} />
                <AvatarFallback className="text-xs font-semibold">
                    {fallback}
                </AvatarFallback>
            </Avatar>
        </Hint>
    )
};
