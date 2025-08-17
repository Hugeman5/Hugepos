'use client';
import { User } from '@/lib/data';
import { Avatar } from '@/components/ui/avatar';

type StaffGridProps = {
    users: User[];
    selected: string;
    onSelect: (id: string) => void;
    disabled?: boolean;
};


export default function StaffGrid({ users, selected, onSelect, disabled=false }: StaffGridProps){
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {users.map(u=>{
        const uid = String(u.id);
        const isSel = selected===uid;
        return (
          <button
            key={uid}
            onClick={()=>onSelect(uid)}
            disabled={disabled}
            className={[
              "group rounded-2xl border p-4 text-left transition-all duration-150",
              "bg-brand-card border-brand-line hover:border-brand-text/30 focus:outline-none focus:ring-2 focus:ring-transparent focus:ring-brand-accent/60",
              isSel ? "ring-2 ring-brand-accent/80 border-brand-accent/90" : "",
              disabled ? "opacity-60 cursor-not-allowed" : "hover:shadow-soft hover:-translate-y-1"
            ].join(" ")}
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 text-xl">
                 { (u as any).imageUrl ? <img src={(u as any).imageUrl} alt={u.name} className="h-full w-full object-cover" /> : <span className="text-xl">{u.name.charAt(0)}</span> }
              </Avatar>
              <div className="min-w-0">
                <div className="font-semibold text-brand-text">{u.name}</div>
                <div className="text-xs text-brand-mute capitalize">{u.role}</div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
