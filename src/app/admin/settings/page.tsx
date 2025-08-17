
'use client';
import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { type Settings } from '@/lib/settingsRepo';
import { formatMoney, round2 } from '@/lib/money';
import { taxFromInclusive } from '@/lib/tax';

function TaxSettingsCard() {
    const [settings, setSettings] = useState<Settings | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();
    
    const examplePrice = 115.00;
    const exampleTax = settings ? taxFromInclusive(examplePrice, settings.vat.defaultRate) : 0;
    const exampleNet = examplePrice - exampleTax;

    useEffect(() => {
        const fetchSettings = async () => {
            setIsLoading(true);
            try {
                const res = await fetch('/api/settings');
                if (!res.ok) throw new Error('Failed to load settings');
                const data = await res.json();
                setSettings(data);
            } catch (error) {
                toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
            } finally {
                setIsLoading(false);
            }
        };
        fetchSettings();
    }, [toast]);
    
    const handleSave = async () => {
        if (!settings) return;
        setIsSaving(true);
        try {
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ vat: settings.vat }),
            });
            if (!res.ok) throw new Error('Failed to save settings');
            toast({ title: 'Success', description: 'Settings saved.' });
        } catch (error) {
             toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
        } finally {
            setIsSaving(false);
        }
    }

    if (isLoading || !settings) {
        return <Card><div className="p-4"><h2 className="text-xl font-semibold">Loading Settings...</h2></div></Card>;
    }

    return (
        <Card>
            <div className="p-4 border-b border-brand-line">
                <h2 className="text-xl font-semibold">Currency & VAT</h2>
                <p className="text-brand-mute">Configure your store's currency and tax settings.</p>
            </div>
            <div className="p-4 grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="priceIncludesVAT">Prices include VAT</Label>
                        <Switch 
                            id="priceIncludesVAT" 
                            checked={settings.vat.priceIncludesVAT}
                            onCheckedChange={(checked) => setSettings(s => s ? {...s, vat: {...s.vat, priceIncludesVAT: checked}} : null)}
                        />
                    </div>
                     <div>
                        <Label htmlFor="defaultRate">Default VAT Rate (%)</Label>
                        <Input 
                            id="defaultRate"
                            type="number"
                            value={settings.vat.defaultRate * 100}
                            onChange={(e) => setSettings(s => s ? {...s, vat: {...s.vat, defaultRate: parseFloat(e.target.value) / 100}} : null)}
                         />
                    </div>
                    <Button onClick={handleSave} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Settings'}</Button>
                </div>
                <div className="space-y-4 rounded-lg bg-muted p-6">
                    <h4 className="font-semibold">Live Preview</h4>
                    <p className="text-sm text-muted-foreground">Based on your current settings:</p>
                    <div className="text-sm">
                        <p>A product priced at <strong>{formatMoney(examplePrice, settings.currency)}</strong></p>
                        <p>...will have <strong>{formatMoney(exampleNet, settings.currency)}</strong> in net sales</p>
                        <p>...and <strong>{formatMoney(exampleTax, settings.currency)}</strong> in VAT.</p>
                    </div>
                </div>
            </div>
        </Card>
    );
}

export default function SettingsPage() {
  return (
    <AdminLayout title="System Settings">
      <div className="space-y-8">
        <TaxSettingsCard />
        <Card>
            <div className="p-4 border-b border-brand-line"><h2 className="text-xl font-semibold">Other Settings</h2></div>
            <div className="p-4">
                <p className="text-muted-foreground">Other sections like outlet management, receipt templates, etc., are under construction.</p>
            </div>
        </Card>
      </div>
    </AdminLayout>
  );
}
