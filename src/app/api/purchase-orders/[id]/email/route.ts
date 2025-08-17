
import { NextResponse } from 'next/server';
import { POs } from '@/lib/repos/purchaseOrdersRepo';
import { Suppliers } from '@/lib/repos/suppliersRepo';
import { getPOHTML } from '@/lib/poTemplates';
import nodemailer from 'nodemailer';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const poId = params.id;
  const po = await POs.byId(poId);

  if (!po) {
    return NextResponse.json({ message: 'Purchase Order not found' }, { status: 404 });
  }

  const supplier = await Suppliers.byId(po.supplierId);
  const poHTML = getPOHTML(po);

  // Check for SMTP configuration
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: (process.env.SMTP_PORT || "587") === "465", // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || '"HugePOS" <noreply@example.com>',
        to: supplier?.email,
        subject: `Purchase Order ${po.id}`,
        html: poHTML,
      });
      
      po.status = 'sent';
      await POs.update(po);

      return NextResponse.json({ ok: true, message: 'Email sent successfully' });
    } catch (error) {
      console.error('SMTP Error:', error);
      return NextResponse.json({ message: 'Failed to send email via SMTP', error: (error as Error).message }, { status: 500 });
    }
  } else {
    // Fallback to mailto link
    const subject = encodeURIComponent(`Purchase Order ${po.id}`);
    const body = encodeURIComponent(`Please find our Purchase Order attached.\n\nThank you,\nHugePOS`);
    const mailtoUrl = `mailto:${supplier?.email || ''}?subject=${subject}&body=${body}`;

    return NextResponse.json({
      ok: true,
      message: 'SMTP not configured. Use mailto link.',
      mailtoUrl,
      html: poHTML,
    });
  }
}
