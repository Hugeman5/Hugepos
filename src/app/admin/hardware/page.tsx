'use client';
import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

export default function HardwarePage() {
    const { toast } = useToast();

    const handleTestPrint = async (type: 'test' | 'receipt', deviceId: string) => {
        try {
            const res = await fetch('/api/devices/print', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, deviceId }),
            });
            if (!res.ok) throw new Error('Failed to send test print');
            toast({ title: 'Success', description: `Test print job sent to ${deviceId}.` });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
        }
    };

    const handleOpenDrawer = async (deviceId: string) => {
        try {
            const res = await fetch('/api/devices/drawer/open', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ deviceId }),
            });
            if (!res.ok) throw new Error('Failed to open drawer');
            toast({ title: 'Success', description: `Open command sent to ${deviceId}.` });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
        }
    };

    const handleSimulateScan = async (code: string) => {
        try {
            const res = await fetch('/api/devices/scanner/simulate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code }),
            });
            if (!res.ok) throw new Error('Failed to simulate scan');
            toast({ title: 'Success', description: `Simulated scan of code: ${code}.` });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
        }
    };

  return (
    <AdminLayout title="Hardware Management">
      <Tabs defaultValue="printers">
        <TabsList>
          <TabsTrigger value="printers">Printers</TabsTrigger>
          <TabsTrigger value="drawers">Cash Drawers</TabsTrigger>
          <TabsTrigger value="scanners">Scanners</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="test">Test</TabsTrigger>
        </TabsList>

        <TabsContent value="printers" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Printers</CardTitle>
              <CardDescription>This section is under construction. Manage printers here.</CardDescription>
            </CardHeader>
          </Card>
        </TabsContent>
        <TabsContent value="drawers" className="mt-4">
           <Card>
            <CardHeader>
              <CardTitle>Cash Drawers</CardTitle>
              <CardDescription>This section is under construction. Manage drawers here.</CardDescription>
            </CardHeader>
          </Card>
        </TabsContent>
        <TabsContent value="scanners" className="mt-4">
           <Card>
            <CardHeader>
              <CardTitle>Scanners</CardTitle>
              <CardDescription>This section is under construction. Manage scanners here.</CardDescription>
            </CardHeader>
          </Card>
        </TabsContent>
        <TabsContent value="templates" className="mt-4">
           <Card>
            <CardHeader>
              <CardTitle>Templates</CardTitle>
              <CardDescription>This section is under construction. Edit templates here.</CardDescription>
            </CardHeader>
          </Card>
        </TabsContent>

        <TabsContent value="test" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Hardware Testing</CardTitle>
              <CardDescription>Send test commands to your configured hardware.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-x-2">
                    <Button onClick={() => handleTestPrint('test', 'rcpt1')}>Print Test Receipt (rcpt1)</Button>
                </div>
                 <div className="space-x-2">
                    <Button onClick={() => handleOpenDrawer('drawer1')}>Open Drawer (drawer1)</Button>
                </div>
                 <div className="space-x-2">
                    <Button onClick={() => handleSimulateScan('869123000111')}>Simulate Scan</Button>
                </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}
