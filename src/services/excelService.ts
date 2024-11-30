import * as XLSX from 'xlsx';

export interface ExcelVeri {
    tarih: Date;
    tutar: number;
}

export class ExcelService {
    static dosyaOku(file: File): Promise<ExcelVeri[]> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target?.result as ArrayBuffer);
                    const workbook = XLSX.read(data, { type: 'array', cellDates: true });
                    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                    
                    // Excel verilerini JSON'a dönüştür
                    const rawData = XLSX.utils.sheet_to_json(firstSheet, { 
                        header: 1,
                        raw: true,
                        dateNF: 'dd.mm.yyyy',
                        defval: ''
                    }) as any[][];

                    if (rawData.length === 0) {
                        throw new Error('Excel dosyası boş');
                    }

                    // İlk satırı kontrol et
                    const firstRow = rawData[0];
                    if (firstRow[0]?.toLowerCase() !== 'tarih' || firstRow[1]?.toLowerCase() !== 'tutar') {
                        // Başlık satırı yoksa, ekle
                        rawData.unshift(['Tarih', 'Tutar']);
                    }

                    const excelVeriler: ExcelVeri[] = [];
                    
                    // İlk satır başlık olduğu için 1'den başla
                    for (let i = 1; i < rawData.length; i++) {
                        const row = rawData[i];
                        if (!row[0] || !row[1]) continue; // Boş satırları atla

                        let tarih: Date | null = null;
                        const rawTarih = row[0];

                        // Excel tarih objesi kontrolü
                        if (rawTarih instanceof Date) {
                            tarih = rawTarih;
                        } else {
                            // String ise farklı formatları dene
                            tarih = this.parseDateFromString(rawTarih.toString());
                        }

                        if (!tarih) {
                            throw new Error(`Satır ${i + 1}'de geçersiz tarih: "${rawTarih}". 
                                Desteklenen formatlar: GG.AA.YYYY, DD.MM.YYYY, MM/DD/YY`);
                        }

                        const tutar = this.parseTutar(row[1]);
                        if (isNaN(tutar)) {
                            throw new Error(`Satır ${i + 1}'de geçersiz tutar: "${row[1]}"`);
                        }

                        excelVeriler.push({ tarih, tutar });
                    }

                    if (excelVeriler.length === 0) {
                        throw new Error('Geçerli veri bulunamadı');
                    }

                    resolve(excelVeriler);
                } catch (error: any) {
                    reject(new Error(error.message || 'Excel dosyası okunamadı'));
                }
            };
            
            reader.onerror = () => {
                reject(new Error('Dosya okuma hatası'));
            };
            
            reader.readAsArrayBuffer(file);
        });
    }

    static raporOlustur(veriler: any[], dosyaAdi: string) {
        // Toplam değerleri hesapla
        const toplamAnaPara = veriler.reduce((sum, veri) => sum + veri.anaPara, 0);
        const toplamFaiz = veriler.reduce((sum, veri) => sum + veri.faizTutari, 0);
        const genelToplam = toplamAnaPara + toplamFaiz;

        // Rapor verilerini hazırla
        const raporVeriler = veriler.map(veri => ({
            'Tarih': new Date(veri.baslangicTarihi).toLocaleDateString('tr-TR'),
            'Ana Para': veri.anaPara.toLocaleString('tr-TR') + ' ₺',
            'Faiz Tutarı': veri.faizTutari.toLocaleString('tr-TR') + ' ₺',
            'Toplam Tutar': veri.toplamTutar.toLocaleString('tr-TR') + ' ₺',
            'Gün Sayısı': veri.gunSayisi,
            'Faiz Oranı': veri.faizOrani
        }));

        // Toplam satırını ekle
        raporVeriler.push({
            'Tarih': 'TOPLAM',
            'Ana Para': toplamAnaPara.toLocaleString('tr-TR') + ' ₺',
            'Faiz Tutarı': toplamFaiz.toLocaleString('tr-TR') + ' ₺',
            'Toplam Tutar': genelToplam.toLocaleString('tr-TR') + ' ₺',
            'Gün Sayısı': '',
            'Faiz Oranı': ''
        });

        const worksheet = XLSX.utils.json_to_sheet(raporVeriler);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Faiz Raporu');

        // Sütun genişliklerini ayarla
        const wscols = [
            {wch: 12}, // Tarih
            {wch: 15}, // Ana Para
            {wch: 15}, // Faiz Tutarı
            {wch: 15}, // Toplam Tutar
            {wch: 10}, // Gün Sayısı
            {wch: 20}  // Faiz Oranı (genişletildi)
        ];
        worksheet['!cols'] = wscols;

        // Son satırı kalın yap
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
        const lastRow = range.e.r;
        
        // Stil tanımları
        const boldStyle = { font: { bold: true } };
        const normalStyle = { font: { bold: false } };

        // Başlık satırını ve toplam satırını kalın yap
        for (let col = range.s.c; col <= range.e.c; col++) {
            const headerCell = XLSX.utils.encode_cell({ r: 0, c: col });
            const totalCell = XLSX.utils.encode_cell({ r: lastRow, c: col });
            
            if (!worksheet[headerCell]) worksheet[headerCell] = {};
            if (!worksheet[totalCell]) worksheet[totalCell] = {};
            
            worksheet[headerCell].s = boldStyle;
            worksheet[totalCell].s = boldStyle;
        }

        XLSX.writeFile(workbook, `${dosyaAdi}.xlsx`);
    }

    private static parseDateFromString(dateStr: string): Date | null {
        if (!dateStr) return null;

        // Farklı tarih formatlarını dene
        const formats = [
            // GG.AA.YYYY
            (str: string) => {
                const parts = str.split('.');
                if (parts.length !== 3) return null;
                const day = parseInt(parts[0]);
                const month = parseInt(parts[1]) - 1;
                const year = parseInt(parts[2]);
                return new Date(year, month, day);
            },
            // MM/DD/YY
            (str: string) => {
                const parts = str.split('/');
                if (parts.length !== 3) return null;
                let year = parseInt(parts[2]);
                if (year < 100) {
                    year += year < 50 ? 2000 : 1900;
                }
                const month = parseInt(parts[0]) - 1;
                const day = parseInt(parts[1]);
                return new Date(year, month, day);
            },
            // YYYY-MM-DD
            (str: string) => {
                const parts = str.split('-');
                if (parts.length !== 3) return null;
                return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
            }
        ];

        for (const format of formats) {
            const date = format(dateStr);
            if (date && !isNaN(date.getTime())) {
                return date;
            }
        }

        return null;
    }

    private static parseTutar(tutarStr: any): number {
        if (tutarStr === null || tutarStr === undefined) return NaN;

        // Eğer sayı ise direkt döndür
        if (typeof tutarStr === 'number') return tutarStr;

        // String ise temizle ve dönüştür
        const temizTutar = tutarStr.toString()
            .replace(/[^\d.,\-]/g, '') // Sadece sayılar, nokta, virgül ve eksi işareti
            .replace(/\.(?=.*\.)/g, '') // Son nokta hariç diğer noktaları sil
            .replace(',', '.'); // Virgülü noktaya çevir

        return parseFloat(temizTutar);
    }
}
