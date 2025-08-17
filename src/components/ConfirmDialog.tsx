
"use client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function ConfirmDialog({
  open, title="Confirm", message, confirmText="Confirm", cancelText="Cancel",
  onCancel, onConfirm, busy=false
}:{
  open:boolean; title?:string; message:string; confirmText?:string; cancelText?:string;
  onCancel:()=>void; onConfirm:()=>void; busy?:boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={(v)=>{ if(!v) onCancel(); }}>
      <DialogContent>
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <p className="text-sm">{message}</p>
        <DialogFooter>
          <Button variant="secondary" onClick={onCancel} disabled={busy}>{cancelText}</Button>
          <Button variant="destructive" onClick={onConfirm} disabled={busy}>
            {busy ? "Working…" : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
