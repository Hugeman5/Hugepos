
import path from "path"; import { promises as fs } from "fs";
const FILE = path.join(process.cwd(),"data","purchaseOrders.json");
export type POLine = { itemId:string; name:string; sku?:string; qty:number; uom:string; packSize:number; priceExVat:number; vatRate:number; lineExVat:number; lineVat:number; lineIncVat:number; };
export type PurchaseOrder = { id:string; supplierId:string; supplierName:string; createdAt:string; status:"draft"|"sent"|"received"; lines:POLine[]; totals:{ exVat:number; vat:number; incVat:number }; notes?:string };

async function read():Promise<PurchaseOrder[]>{ try{ return JSON.parse(await fs.readFile(FILE,"utf8")); }catch{ return []; } }
async function write(rows:PurchaseOrder[]){ await fs.mkdir(path.dirname(FILE),{recursive:true}); await fs.writeFile(FILE, JSON.stringify(rows,null,2)); }

export const POs = {
  all: read,
  byId: async(id:string)=> (await read()).find(p=>p.id===id)||null,
  create: async(po:PurchaseOrder)=>{ const rows=await read(); rows.push(po); await write(rows); return po; },
  update: async(po:PurchaseOrder)=>{ const rows=await read(); const i=rows.findIndex(x=>x.id===po.id); if(i>=0) rows[i]=po; await write(rows); return po; }
};
