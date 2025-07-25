import React from "react";
import type { Profile } from "@/types/crm";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // Import shadcn/ui Avatar components

interface UserProfileCardProps {
  profile: Profile;
}

export function UserProfileCard({ profile }: UserProfileCardProps) {
  const initials = `${profile.first_name?.charAt(0) || ''}${profile.last_name?.charAt(0) || ''}`.toUpperCase();

  return (
    <div className="flex items-center space-x-2">
      <Avatar className="w-8 h-8 border border-border">
        {profile.avatar_url ? (
          <AvatarImage src={profile.avatar_url} alt={`${profile.first_name} ${profile.last_name}'s avatar`} />
        ) : (
          <AvatarFallback className="bg-muted text-muted-foreground text-sm font-semibold">
            {initials}
          </AvatarFallback>
        )}
      </Avatar>
      <div>
        <h3 className="text-sm font-medium text-foreground">
          {profile.first_name} {profile.last_name}
        </h3>
        <p className="text-xs text-muted-foreground">{profile.email}</p>
      </div>
    </div>
  );
}