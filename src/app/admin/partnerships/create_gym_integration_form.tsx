"use client";
import { useFormState, useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useEffect, useState } from 'react';

type ServerAction = (formData: FormData) => Promise<{ apiKey?: string; error?: string } | void>;

function Submit({ label }: { label?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button variant="outline" type="submit" disabled={pending}>
      {pending ? 'Creating…' : (label || 'Create Integration')}
    </Button>
  );
}

export default function CreateGymIntegrationForm({ action }: { action: ServerAction }) {
  const [state, formAction] = useFormState(async (_prev: any, formData: FormData) => {
    try {
      const res = await action(formData);
      return res ?? {};
    } catch (e: any) {
      return { error: e?.message || 'Failed to create integration' };
    }
  }, {});

  const [open, setOpen] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);

  useEffect(() => {
    if (state?.apiKey) {
      setApiKey(state.apiKey);
      setOpen(true);
    }
  }, [state?.apiKey]);

  return (
    <>
      <form action={formAction} className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Input name="partnerId" placeholder="Partner ID" required />
        <Input name="features" placeholder="features (comma) e.g. sdk,api,white_label" />
        <Input name="webhookUrl" placeholder="Webhook URL (optional)" />
        <Textarea name="branding" placeholder='Branding JSON (e.g. {"primaryColor":"#000"})' className="md:col-span-3" />
        <div className="md:col-span-3 flex items-center gap-3">
          <Submit />
          {state?.error && <span className="text-sm text-red-600">{state.error}</span>}
        </div>
      </form>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gym API Key</DialogTitle>
            <DialogDescription>
              Copy this API key now. It will not be shown again.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded border p-3 bg-muted font-mono text-sm break-all select-all">
            {apiKey}
          </div>
          <DialogFooter>
            <Button onClick={() => setOpen(false)} variant="outline">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

