
import path from "path";
import { promises as fs } from "fs";

const FILE = path.join(process.cwd(), "data", "sequence.json");

export async function nextSeq(key: string, start = 1000) {
  let data:any={};
  try{ data = JSON.parse(await fs.readFile(FILE,"utf8")); }catch{}
  const next = (Number(data[key]) || start) + 1;
  data[key] = next;
  await fs.mkdir(path.dirname(FILE),{recursive:true});
  await fs.writeFile(FILE, JSON.stringify(data,null,2),"utf8");
  return next;
}
