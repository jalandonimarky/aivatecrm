import React from "react";
import type { Profile } from "@/types/crm";

interface UserProfileCardProps {
  profile: Profile;
}

export function UserProfileCard({ profile }: UserProfileCardProps) {
  const initials = `${profile.first_name.charAt(0)}${profile.last_name.charAt(0)}`.toUpperCase();

  return (
    <div className="flex items-center space-x-2"> {/* Adjusted spacing and removed card-like styling */}
      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-sm font-semibold flex-shrink-0">
        {initials}
      </div>
      <div>
        <h3 className="text-sm font-medium text-foreground"> {/* Adjusted font size and weight */}
          {profile.first_name} {profile.last_name}
        </h3>
        <p className="text-xs text-muted-foreground">{profile.email}</p> {/* Adjusted font size */}
      </div>
    </div>
  );
}