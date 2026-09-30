export interface BankPreset {
  id: string
  name: string
  shortName: string
  type: 'bank' | 'wallet' | 'cash' | 'credit'
  color: 'emerald' | 'blue' | 'cyan' | 'purple' | 'amber' | 'rose'
  logoSvg: string
}

export const BANK_PRESETS: BankPreset[] = [
  {
    id: 'bca',
    name: 'BCA (Bank Central Asia)',
    shortName: 'BCA Utama',
    type: 'bank',
    color: 'blue',
    logoSvg: 'https://upload.wikimedia.org/wikipedia/commons/5/5c/Bank_Central_Asia.svg'
  },
  {
    id: 'mandiri',
    name: 'Bank Mandiri',
    shortName: 'Mandiri Utama',
    type: 'bank',
    color: 'amber',
    logoSvg: 'https://upload.wikimedia.org/wikipedia/commons/a/ad/Bank_Mandiri_logo_2016.svg'
  },
  {
    id: 'bri',
    name: 'BRI (Bank Rakyat Indonesia)',
    shortName: 'BRI BritAma',
    type: 'bank',
    color: 'blue',
    logoSvg: 'https://upload.wikimedia.org/wikipedia/commons/2/2e/BRI_2020.svg'
  },
  {
    id: 'bni',
    name: 'BNI (Bank Negara Indonesia)',
    shortName: 'BNI Taplus',
    type: 'bank',
    color: 'rose',
    logoSvg: 'https://upload.wikimedia.org/wikipedia/commons/5/55/BNI_logo.svg'
  },
  {
    id: 'bsi',
    name: 'BSI (Bank Syariah Indonesia)',
    shortName: 'BSI Hasanah',
    type: 'bank',
    color: 'emerald',
    logoSvg: 'https://upload.wikimedia.org/wikipedia/commons/a/a0/Bank_Syariah_Indonesia.svg'
  },
  {
    id: 'cimb',
    name: 'CIMB Niaga',
    shortName: 'CIMB Niaga',
    type: 'bank',
    color: 'rose',
    logoSvg: 'https://upload.wikimedia.org/wikipedia/commons/3/38/CIMB_Niaga_logo.svg'
  },
  {
    id: 'jago',
    name: 'Bank Jago',
    shortName: 'Kantong Jago',
    type: 'bank',
    color: 'amber',
    logoSvg: 'https://upload.wikimedia.org/wikipedia/commons/e/eb/Logo_Bank_Jago.svg'
  },
  {
    id: 'gopay',
    name: 'GoPay / Gojek',
    shortName: 'GoPay / QRIS',
    type: 'wallet',
    color: 'cyan',
    logoSvg: 'https://upload.wikimedia.org/wikipedia/commons/8/86/Gopay_logo.svg'
  },
  {
    id: 'ovo',
    name: 'OVO Cash',
    shortName: 'OVO Cash',
    type: 'wallet',
    color: 'purple',
    logoSvg: 'https://upload.wikimedia.org/wikipedia/commons/e/eb/Logo_ovo_purple.svg'
  },
  {
    id: 'dana',
    name: 'DANA Indonesia',
    shortName: 'Dompet DANA',
    type: 'wallet',
    color: 'blue',
    logoSvg: 'https://upload.wikimedia.org/wikipedia/commons/7/72/Logo_DANA.svg'
  },
  {
    id: 'shopeepay',
    name: 'ShopeePay',
    shortName: 'ShopeePay',
    type: 'wallet',
    color: 'rose',
    logoSvg: 'https://upload.wikimedia.org/wikipedia/commons/f/fe/ShopeePay_logo.svg'
  },
  {
    id: 'cash',
    name: 'Dompet Cash / Tunai',
    shortName: 'Cash Tunai',
    type: 'cash',
    color: 'emerald',
    logoSvg: '💵'
  }
]

export function getBankPreset(presetId: string): BankPreset | undefined {
  return BANK_PRESETS.find(b => b.id === presetId)
}
