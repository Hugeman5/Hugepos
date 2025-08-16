
type VatConfig = {
  priceIncludesVAT:boolean;
  rate:number; // e.g. 0.15
};

export function taxFromInclusive(priceIncl:number, rate:number){
  // tax = priceIncl * r/(1+r)
  return (priceIncl * rate) / (1 + rate);
}

export function taxFromExclusive(priceExcl:number, rate:number){
  // tax = priceExcl * r
  return priceExcl * rate;
}

export function lineTotals({
  unitPrice, qty, rate, priceIncludesVAT
}:{unitPrice:number; qty:number; rate:number; priceIncludesVAT:boolean;}){
  const q = qty || 0;
  const p = unitPrice || 0;
  if(priceIncludesVAT){
    const gross = p * q;
    const tax = taxFromInclusive(p, rate) * q;
    const net = gross - tax;
    return { net, tax, gross };
  } else {
    const net = p * q;
    const tax = taxFromExclusive(p, rate) * q;
    const gross = net + tax;
    return { net, tax, gross };
  }
}

export function sumTotals(lines:Array<{unitPrice:number; qty:number; rate:number}>, cfg:VatConfig){
  let net=0, tax=0, gross=0;
  for(const ln of lines){
    const t = lineTotals({ unitPrice:ln.unitPrice, qty:ln.qty, rate:ln.rate, priceIncludesVAT:cfg.priceIncludesVAT });
    net+=t.net; tax+=t.tax; gross+=t.gross;
  }
  return { net, tax, gross };
}
