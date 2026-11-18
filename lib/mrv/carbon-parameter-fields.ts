export const carbonParameterFields = [
  {
    name: "biomassFactor",
    label: "Biomassa (t C/ha)",
    min: 0.01,
    max: 999999.99,
    step: 0.01,
    decimals: 2,
  },
  {
    name: "emissionFactor",
    label: "Faktor emisi",
    min: 0.0001,
    max: 1,
    step: 0.0001,
    decimals: 4,
  },
  {
    name: "co2ConversionFactor",
    label: "Konversi CO₂",
    min: 0.001,
    max: 999.999,
    step: 0.001,
    decimals: 3,
  },
  {
    name: "incentivePerTonIdr",
    label: "Tarif (Rp/t CO₂e)",
    min: 0,
    max: 999999999999.99,
    step: 0.01,
    decimals: 2,
  },
] as const;
