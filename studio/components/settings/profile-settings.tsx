"use client";

import { useRef } from "react";
import { Trash2, Upload } from "lucide-react";
import { Button } from "../ui/button";
import { profileInitial, type Profile } from "../../lib/profile";

const fieldClass =
  "h-9.5 w-full rounded-lg border border-border bg-background px-3 text-[13px] outline-none transition-colors focus:border-accent";

export function ProfileSettings({
  profile,
  onChange,
}: {
  profile: Profile;
  onChange: (profile: Profile) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const initial = profileInitial(profile);

  function pickAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange({ ...profile, avatar: String(reader.result ?? "") });
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  return (
    <div className="space-y-6">
      <section className="flex items-center gap-4">
        <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-full border border-border-strong bg-surface-hover font-display text-lg font-semibold text-foreground-muted">
          {profile.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatar} alt="" className="size-full object-cover" />
          ) : initial ? (
            initial
          ) : (
            <span className="size-2.5 rounded-full bg-foreground-subtle" />
          )}
        </div>
        <div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={pickAvatar}
          />
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={() => fileRef.current?.click()}>
              <Upload className="size-3.5" />
              Upload image
            </Button>
            {profile.avatar && (
              <Button size="sm" variant="ghost" onClick={() => onChange({ ...profile, avatar: "" })}>
                <Trash2 className="size-3.5" />
                Remove
              </Button>
            )}
          </div>
          <p className="mt-2 text-[11px] text-foreground-subtle">
            PNG or JPG. Stored locally in this browser only.
          </p>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-medium text-foreground-muted">Name</span>
          <input
            value={profile.name}
            onChange={(e) => onChange({ ...profile, name: e.target.value })}
            placeholder="Ada Lovelace"
            className={fieldClass}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-medium text-foreground-muted">Role</span>
          <input
            value={profile.role}
            onChange={(e) => onChange({ ...profile, role: e.target.value })}
            placeholder="Front-End Engineer"
            className={fieldClass}
          />
        </label>
      </section>

      <label className="flex flex-col gap-1.5">
        <span className="text-[12px] font-medium text-foreground-muted">Bio</span>
        <textarea
          rows={3}
          value={profile.bio}
          onChange={(e) => onChange({ ...profile, bio: e.target.value })}
          placeholder="A short note about what you build."
          className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-[13px] leading-relaxed outline-none transition-colors focus:border-accent"
        />
      </label>
    </div>
  );
}
