"use client";

import React, { useState } from 'react';
import { ExcelService } from '../services/excelService';
import { FaizHesaplamaService } from '../services/faizHesaplamaService';
import { TCMBService } from '../services/tcmbService';
import BulkDataEntry from './BulkDataEntry';

export default function FaizHesaplamaForm() {
  const [file, setFile] = useState<File | null>(null);
  const [sonuclar, setSonuclar] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [tekliTarih, setTekliTarih] = useState<string>('');
  const [tekliTutar, setTekliTutar] = useState<string>('');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleHesapla = async () => {
    if (!file) {
      setError('Lütfen bir Excel dosyası seçin');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const excelData = await ExcelService.dosyaOku(file);
      if (!excelData || excelData.length === 0) {
        throw new Error('Excel dosyası boş veya okunamadı');
      }

      const hesaplamaSonuclari = await Promise.all(
        excelData.map(async (veri) => {
          const faizOranlari = await TCMBService.getFaizOranlari(veri.tarih.toISOString().split('T')[0]);
          const bitisTarihi = new Date();
          const sonDonemFaizOranlari = await TCMBService.getFaizOranlari(bitisTarihi.toISOString().split('T')[0]);
          
          const sonuc = FaizHesaplamaService.hesapla({
            tutar: veri.tutar,
            baslangicTarihi: veri.tarih,
            bitisTarihi: bitisTarihi,
            ilkDonemFaizOrani: faizOranlari.items[0].TP_TEMFAIZ,
            sonDonemFaizOrani: sonDonemFaizOranlari.items[0].TP_TEMFAIZ,
            faizTuru: 'TEMERRUT'
          });

          const baslangicYili = veri.tarih.getFullYear();
          const bitisYili = bitisTarihi.getFullYear();
          const faizOraniText = baslangicYili === bitisYili 
            ? `%${faizOranlari.items[0].TP_TEMFAIZ}`
            : `%${faizOranlari.items[0].TP_TEMFAIZ} - %${sonDonemFaizOranlari.items[0].TP_TEMFAIZ}`;

          return {
            baslangicTarihi: veri.tarih,
            anaPara: veri.tutar,
            faizTutari: sonuc.faizTutari,
            toplamTutar: sonuc.toplamTutar,
            gunSayisi: sonuc.gunSayisi,
            faizOrani: faizOraniText,
            ilkDonemFaizOrani: faizOranlari.items[0].TP_TEMFAIZ,
            sonDonemFaizOrani: sonDonemFaizOranlari.items[0].TP_TEMFAIZ
          };
        })
      );

      setSonuclar(hesaplamaSonuclari);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu');
      console.error('Hesaplama hatası:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDataSubmit = async (bulkData: ExcelVeri[]) => {
    try {
      setLoading(true);
      setError(null);

      const hesaplamaSonuclari = await Promise.all(
        bulkData.map(async (veri) => {
          const faizOranlari = await TCMBService.getFaizOranlari(veri.tarih.toISOString().split('T')[0]);
          const bitisTarihi = new Date();
          const sonDonemFaizOranlari = await TCMBService.getFaizOranlari(bitisTarihi.toISOString().split('T')[0]);
          
          return FaizHesaplamaService.hesapla({
            tutar: veri.tutar,
            baslangicTarihi: veri.tarih,
            bitisTarihi: bitisTarihi,
            ilkDonemFaizOrani: faizOranlari.items[0].TP_TEMFAIZ,
            sonDonemFaizOrani: sonDonemFaizOranlari.items[0].TP_TEMFAIZ,
            faizTuru: 'TEMERRUT'
          });
        })
      );

      setSonuclar(hesaplamaSonuclari);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hesaplama sırasında bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleTekliHesapla = async () => {
    if (!tekliTarih || !tekliTutar) {
      setError('Lütfen tarih ve tutar giriniz');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const tarih = new Date(tekliTarih);
      const tutar = parseFloat(tekliTutar);

      const faizOranlari = await TCMBService.getFaizOranlari(tarih.toISOString().split('T')[0]);
      const bitisTarihi = new Date();
      const sonDonemFaizOranlari = await TCMBService.getFaizOranlari(bitisTarihi.toISOString().split('T')[0]);
      
      const sonuc = FaizHesaplamaService.hesapla({
        tutar: tutar,
        baslangicTarihi: tarih,
        bitisTarihi: bitisTarihi,
        ilkDonemFaizOrani: faizOranlari.items[0].TP_TEMFAIZ,
        sonDonemFaizOrani: sonDonemFaizOranlari.items[0].TP_TEMFAIZ,
        faizTuru: 'TEMERRUT'
      });

      const baslangicYili = tarih.getFullYear();
      const bitisYili = bitisTarihi.getFullYear();
      const faizOraniText = baslangicYili === bitisYili 
        ? `%${faizOranlari.items[0].TP_TEMFAIZ}`
        : `%${faizOranlari.items[0].TP_TEMFAIZ} - %${sonDonemFaizOranlari.items[0].TP_TEMFAIZ}`;

      const hesaplamaSonucu = {
        baslangicTarihi: tarih,
        anaPara: tutar,
        faizTutari: sonuc.faizTutari,
        toplamTutar: sonuc.toplamTutar,
        gunSayisi: sonuc.gunSayisi,
        faizOrani: faizOraniText,
        ilkDonemFaizOrani: faizOranlari.items[0].TP_TEMFAIZ,
        sonDonemFaizOrani: sonDonemFaizOranlari.items[0].TP_TEMFAIZ
      };

      setSonuclar([hesaplamaSonucu]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu');
      console.error('Hesaplama hatası:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRaporIndir = () => {
    if (sonuclar.length === 0) {
      setError('İndirilecek rapor bulunmamaktadır');
      return;
    }

    try {
      ExcelService.raporOlustur(sonuclar, 'Faiz_Raporu');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Rapor oluşturulurken bir hata oluştu');
      console.error('Rapor oluşturma hatası:', err);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '20px', fontSize: '24px', fontWeight: 'bold' }}>
          Temerrüt Faizi Hesaplama
        </h1>

        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px' }}>Tekli Veri Girişi</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '300px', margin: '0 auto' }}>
            <div>
              <label htmlFor="tekliTarih" style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
                Tarih
              </label>
              <input
                type="date"
                id="tekliTarih"
                value={tekliTarih}
                onChange={(e) => setTekliTarih(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>
            <div>
              <label htmlFor="tekliTutar" style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
                Tutar (₺)
              </label>
              <input
                type="number"
                id="tekliTutar"
                value={tekliTutar}
                onChange={(e) => setTekliTutar(e.target.value)}
                placeholder="0.00"
                step="0.01"
                style={{
                  width: '100%',
                  padding: '6px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>
            <button
              onClick={handleTekliHesapla}
              disabled={loading}
              style={{
                padding: '8px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? 'Hesaplanıyor...' : 'Hesapla'}
            </button>
          </div>
        </div>

        <div style={{ marginTop: '30px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px' }}>Excel ile Toplu Veri Girişi</h2>
          <div style={{ marginBottom: '15px' }}>
            <h3 style={{ fontSize: '16px', marginBottom: '10px' }}>Excel Dosyası Yükleme</h3>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              style={{ marginBottom: '10px' }}
            />
          </div>

          <BulkDataEntry onDataSubmit={handleBulkDataSubmit} />

          <div style={{ marginTop: '15px' }}>
            <button
              onClick={handleHesapla}
              disabled={!file || loading}
              style={{
                padding: '8px 16px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginRight: '10px',
                fontSize: '14px',
                opacity: (!file || loading) ? 0.7 : 1
              }}
            >
              {loading ? 'Hesaplanıyor...' : 'Hesapla'}
            </button>

            {sonuclar.length > 0 && (
              <button
                onClick={handleRaporIndir}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#2196F3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Rapor İndir
              </button>
            )}
          </div>
        </div>

        {error && (
          <div style={{ color: 'red', textAlign: 'center', margin: '15px 0', fontSize: '14px' }}>
            {error}
          </div>
        )}

        {sonuclar.length > 0 && (
          <div style={{ marginTop: '30px', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr>
                  <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left', backgroundColor: '#f5f5f5' }}>Tarih</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left', backgroundColor: '#f5f5f5' }}>Ana Para</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left', backgroundColor: '#f5f5f5' }}>Faiz Tutarı</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left', backgroundColor: '#f5f5f5' }}>Toplam</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left', backgroundColor: '#f5f5f5' }}>Gün</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left', backgroundColor: '#f5f5f5' }}>Faiz Oranı</th>
                </tr>
              </thead>
              <tbody>
                {sonuclar.map((sonuc, index) => (
                  <tr key={index}>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                      {sonuc.baslangicTarihi.toLocaleDateString('tr-TR')}
                    </td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                      {sonuc.anaPara.toLocaleString('tr-TR')} ₺
                    </td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                      {sonuc.faizTutari.toLocaleString('tr-TR')} ₺
                    </td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                      {sonuc.toplamTutar.toLocaleString('tr-TR')} ₺
                    </td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                      {sonuc.gunSayisi}
                    </td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                      {sonuc.faizOrani}
                    </td>
                  </tr>
                ))}
                {sonuclar.length > 0 && (
                  <tr style={{ backgroundColor: '#f5f5f5', fontWeight: 'bold' }}>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>TOPLAM</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                      {sonuclar.reduce((sum, sonuc) => sum + sonuc.anaPara, 0).toLocaleString('tr-TR')} ₺
                    </td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                      {sonuclar.reduce((sum, sonuc) => sum + sonuc.faizTutari, 0).toLocaleString('tr-TR')} ₺
                    </td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                      {sonuclar.reduce((sum, sonuc) => sum + sonuc.toplamTutar, 0).toLocaleString('tr-TR')} ₺
                    </td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}></td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
