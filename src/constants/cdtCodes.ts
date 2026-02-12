/**
 * Common CDT (Code on Dental Procedures and Nomenclature) procedure codes.
 * Used for treatment plans and billing. Default fees are approximate real-world values.
 */
export interface CDTCode {
  code: string;
  description: string;
  /** Default fee in USD for billing/treatment plans */
  defaultFee?: number;
}

export const CDT_CODES: CDTCode[] = [
  { code: "D0120", description: "Periodic oral evaluation", defaultFee: 75 },
  { code: "D0150", description: "Comprehensive oral evaluation", defaultFee: 150 },
  { code: "D0210", description: "Intraoral - complete series of radiographs", defaultFee: 185 },
  { code: "D0220", description: "Intraoral - periapical first film", defaultFee: 35 },
  { code: "D0274", description: "Bitewing - 4 films", defaultFee: 95 },
  { code: "D1110", description: "Prophylaxis - adult", defaultFee: 125 },
  { code: "D1120", description: "Prophylaxis - child", defaultFee: 95 },
  { code: "D1351", description: "Dental sealant - per tooth", defaultFee: 55 },
  { code: "D2140", description: "Amalgam - 1 surface, primary", defaultFee: 135 },
  { code: "D2150", description: "Amalgam - 2 surfaces, primary", defaultFee: 155 },
  { code: "D2160", description: "Amalgam - 3 surfaces, primary", defaultFee: 175 },
  { code: "D2330", description: "Resin - 1 surface, anterior", defaultFee: 185 },
  { code: "D2391", description: "Resin - 1 surface, posterior", defaultFee: 195 },
  { code: "D2392", description: "Resin - 2 surfaces, posterior", defaultFee: 225 },
  { code: "D2393", description: "Resin - 3 surfaces, posterior", defaultFee: 265 },
  { code: "D2740", description: "Crown - porcelain/ceramic", defaultFee: 1295 },
  { code: "D2750", description: "Crown - porcelain fused to metal", defaultFee: 1195 },
  { code: "D2790", description: "Crown - full cast noble metal", defaultFee: 1095 },
  { code: "D3110", description: "Pulp cap - direct", defaultFee: 95 },
  { code: "D3220", description: "Therapeutic pulpotomy", defaultFee: 195 },
  { code: "D3310", description: "Endodontic therapy - anterior", defaultFee: 995 },
  { code: "D3320", description: "Endodontic therapy - bicuspid", defaultFee: 1095 },
  { code: "D3330", description: "Endodontic therapy - molar", defaultFee: 1295 },
  { code: "D4210", description: "Gingivectomy - 4 or more teeth", defaultFee: 395 },
  { code: "D4341", description: "Scaling and root planing - per quadrant", defaultFee: 285 },
  { code: "D7240", description: "Extraction - erupted tooth", defaultFee: 195 },
  { code: "D9230", description: "Analgesia - nitrous oxide", defaultFee: 85 },
  { code: "D9248", description: "Non-intravenous conscious sedation", defaultFee: 295 },
];

/** Get default fee for a CDT code, if defined */
export function getDefaultFeeForCode(code: string): number | undefined {
  return CDT_CODES.find((c) => c.code === code)?.defaultFee;
}
