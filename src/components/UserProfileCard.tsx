import React from "react";
import type { Profile } from "@/types/crm";

interface UserProfileCardProps {
  profile: Profile;
}

export function UserProfileCard({ profile }: UserProfileCardProps) {
  const initials = `${profile.first_name.charAt(0)}${profile.last_name.charAt(0)}`.toUpperCase();

  return (
    <div className="flex items-center space-x-4 p-4 bg-gradient-card border border-border/50 rounded-lg shadow-soft">
      <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-lg font-semibold flex-shrink-0">
        {initials}
      </div>
      <div>
        <h3 className="text-lg font-semibold text-foreground">
          {profile.first_name} {profile.last_name}
        </h3>
        <p className="text-sm text-muted-foreground">{profile.email}</p>
      </div>
    </div>
  );
}