export interface FaizHesaplamaInput {
    tutar: number;
    baslangicTarihi: Date;
    bitisTarihi: Date;
    ilkDonemFaizOrani: number;
    sonDonemFaizOrani: number;
    faizTuru: 'YASAL' | 'TICARI' | 'TEMERRUT';
}

export interface FaizSonucu {
    anaPara: number;
    faizTutari: number;
    toplamTutar: number;
    gunSayisi: number;
    faizOrani: number;
    baslangicTarihi: Date;
    bitisTarihi: Date;
}

export class FaizHesaplamaService {
    static hesapla(input: FaizHesaplamaInput): FaizSonucu {
        const baslangicYili = input.baslangicTarihi.getFullYear();
        const bitisYili = input.bitisTarihi.getFullYear();
        
        let toplamFaizTutari = 0;
        let toplamGunSayisi = 0;
        
        if (baslangicYili === bitisYili) {
            // Tek dönem
            const gunSayisi = this.gunFarki(input.baslangicTarihi, input.bitisTarihi);
            toplamGunSayisi = gunSayisi;
            
            const gunlukFaizOrani = (input.ilkDonemFaizOrani / 100) / 365;
            toplamFaizTutari = input.tutar * gunlukFaizOrani * gunSayisi;
        } else {
            // İlk yıl için hesaplama (başlangıç tarihinden yıl sonuna kadar)
            const ilkYilBitis = new Date(baslangicYili, 11, 31, 23, 59, 59);
            const ilkDonemGunSayisi = this.gunFarki(input.baslangicTarihi, ilkYilBitis);
            toplamGunSayisi += ilkDonemGunSayisi;
            
            const ilkDonemGunlukFaiz = (input.ilkDonemFaizOrani / 100) / 365;
            const ilkDonemFaizTutari = input.tutar * ilkDonemGunlukFaiz * ilkDonemGunSayisi;
            
            // Son yıl için hesaplama (yıl başından bitiş tarihine kadar)
            const sonYilBaslangic = new Date(bitisYili, 0, 1);
            const sonDonemGunSayisi = this.gunFarki(sonYilBaslangic, input.bitisTarihi);
            toplamGunSayisi += sonDonemGunSayisi;
            
            const sonDonemGunlukFaiz = (input.sonDonemFaizOrani / 100) / 365;
            const sonDonemFaizTutari = input.tutar * sonDonemGunlukFaiz * sonDonemGunSayisi;
            
            toplamFaizTutari = ilkDonemFaizTutari + sonDonemFaizTutari;
        }
        
        return {
            anaPara: input.tutar,
            faizTutari: Number(toplamFaizTutari.toFixed(2)),
            toplamTutar: Number((input.tutar + toplamFaizTutari).toFixed(2)),
            gunSayisi: toplamGunSayisi,
            faizOrani: input.ilkDonemFaizOrani,
            baslangicTarihi: input.baslangicTarihi,
            bitisTarihi: input.bitisTarihi
        };
    }

    private static gunFarki(baslangic: Date, bitis: Date): number {
        const diff = bitis.getTime() - baslangic.getTime();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    }
}
