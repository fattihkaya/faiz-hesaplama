import axios from 'axios';

export interface FaizOraniItem {
    BASLANGIC_TARIHI: string;
    BITIS_TARIHI: string;
    TP_TEMFAIZ: number;
    ASGARI_GIDERIM: number;
}

export interface FaizOranlariResponse {
    items: FaizOraniItem[];
}

export class TCMBService {
    private static readonly faizOranlari: { [key: number]: FaizOraniItem } = {
        2024: {
            BASLANGIC_TARIHI: '2024-01-01',
            BITIS_TARIHI: '2024-12-31',
            TP_TEMFAIZ: 48.00,
            ASGARI_GIDERIM: 1310
        },
        2023: {
            BASLANGIC_TARIHI: '2023-01-01',
            BITIS_TARIHI: '2023-12-31',
            TP_TEMFAIZ: 11.75,
            ASGARI_GIDERIM: 800
        },
        2022: {
            BASLANGIC_TARIHI: '2022-01-01',
            BITIS_TARIHI: '2022-12-31',
            TP_TEMFAIZ: 17.25,
            ASGARI_GIDERIM: 555
        }
    };

    static async getFaizOranlari(tarih: string): Promise<FaizOranlariResponse> {
        const date = new Date(tarih);
        const yil = date.getFullYear();
        
        const uygunOran = this.faizOranlari[yil];

        if (!uygunOran) {
            throw new Error(`${yil} yılı için faiz oranı bulunamadı`);
        }

        return {
            items: [uygunOran]
        };
    }
}
